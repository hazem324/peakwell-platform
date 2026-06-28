#!/bin/bash
# MySQL automatic failover + failback monitor
# States: normal → failed (failover) → recovering (failback) → normal
NAMESPACE=peakwell
MYSQL_ROOT_PASSWORD=peakwell
REPLICATOR_PASSWORD=replicatorpass
THRESHOLD=5
FAIL_COUNT=0
STATE="normal"

echo "=== MySQL failover monitor started ==="
echo "Primary: mysql-0  |  Standby: mysql-replica-0"

while true; do
  sleep 10

  # ── NORMAL: watch mysql-0, trigger failover if it goes down ──────────────
  if [ "$STATE" = "normal" ]; then
    POD_PHASE=$(kubectl get pod mysql-0 -n $NAMESPACE -o jsonpath='{.status.phase}' 2>/dev/null)
    if [ "$POD_PHASE" != "Running" ]; then
      FAIL_COUNT=$((FAIL_COUNT + 1))
      echo "[normal] mysql-0 phase=$POD_PHASE — fail $FAIL_COUNT/$THRESHOLD"
    else
      if kubectl exec mysql-0 -n $NAMESPACE -- \
           mysqladmin ping -u root -p"$MYSQL_ROOT_PASSWORD" --silent 2>/dev/null; then
        FAIL_COUNT=0
      else
        FAIL_COUNT=$((FAIL_COUNT + 1))
        echo "[normal] mysql-0 not responding — fail $FAIL_COUNT/$THRESHOLD"
      fi
    fi

    if [ "$FAIL_COUNT" -ge "$THRESHOLD" ]; then
      echo "=== PRIMARY DOWN — FAILOVER STARTING ==="

      kubectl exec mysql-replica-0 -n $NAMESPACE -- \
        mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e \
        "STOP SLAVE; RESET SLAVE ALL; SET GLOBAL read_only=OFF; SET GLOBAL super_read_only=OFF;" \
        2>/dev/null

      kubectl patch service mysql -n $NAMESPACE --type=merge \
        -p '{"spec":{"selector":{"app":"mysql-replica","db-role":"standby"}}}'

      # Service now routes to replica-0. Kill any stale connections that pre-date
      # the switch so Keycloak/backend reconnect fresh to the new primary.
      sleep 3
      kubectl exec mysql-replica-0 -n $NAMESPACE -- \
        bash -c "mysql -uroot -p\"$MYSQL_ROOT_PASSWORD\" -Bse \
          'SELECT id FROM information_schema.processlist WHERE id != CONNECTION_ID() AND user NOT IN (\"system user\",\"event_scheduler\") AND command != \"Binlog Dump\"' \
          2>/dev/null | while read cid; do \
            mysql -uroot -p\"$MYSQL_ROOT_PASSWORD\" -e \"KILL CONNECTION \$cid\" 2>/dev/null; \
          done"

      echo "=== FAILOVER COMPLETE — mysql-replica-0 is now primary ==="
      STATE="failed"
      FAIL_COUNT=0
    fi

  # ── FAILED: wait for mysql-0 to come back ────────────────────────────────
  elif [ "$STATE" = "failed" ]; then
    POD_PHASE=$(kubectl get pod mysql-0 -n $NAMESPACE -o jsonpath='{.status.phase}' 2>/dev/null)
    if [ "$POD_PHASE" != "Running" ]; then
      echo "[failed] Waiting for mysql-0 to recover... phase=$POD_PHASE"
      continue
    fi

    if ! kubectl exec mysql-0 -n $NAMESPACE -- \
           mysqladmin ping -u root -p"$MYSQL_ROOT_PASSWORD" --silent 2>/dev/null; then
      echo "[failed] mysql-0 pod Running but mysqld not ready yet..."
      continue
    fi

    echo "=== mysql-0 is back — FAILBACK STARTING ==="
    STATE="recovering"

  # ── RECOVERING: sync mysql-0 from replica-0, then promote it back ────────
  elif [ "$STATE" = "recovering" ]; then
    # Reset mysql-0 to a clean state before importing
    echo "[failback] Resetting mysql-0 before import..."
    kubectl exec mysql-0 -n $NAMESPACE -- \
      mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e \
      "STOP SLAVE; RESET SLAVE ALL;
       SET GLOBAL read_only=OFF; SET GLOBAL super_read_only=OFF;" 2>/dev/null

    echo "[failback] Dumping data from mysql-replica-0..."
    kubectl exec mysql-replica-0 -n $NAMESPACE -- \
      bash -c "mysqldump -u root -p\"$MYSQL_ROOT_PASSWORD\" \
        --source-data=2 --single-transaction --routines --triggers \
        --add-drop-database --databases peakwell keycloak \
        > /tmp/failback-dump.sql 2>/tmp/failback-dump.err"
    kubectl cp $NAMESPACE/mysql-replica-0:/tmp/failback-dump.sql /tmp/failback-dump.sql

    if [ ! -s /tmp/failback-dump.sql ]; then
      echo "[failback] ERROR: dump is empty, aborting failback"
      kubectl exec mysql-replica-0 -n $NAMESPACE -- cat /tmp/failback-dump.err 2>/dev/null
      exit 1
    fi

    DUMP_FILE=$(grep -oE "MASTER_LOG_FILE='[^']+'" /tmp/failback-dump.sql | \
      grep -oE "'[^']+'" | tr -d "'")
    DUMP_POS=$(grep -oE "MASTER_LOG_POS=[0-9]+" /tmp/failback-dump.sql | \
      grep -oE "[0-9]+")
    echo "[failback] Dump position: $DUMP_FILE @ $DUMP_POS"

    if [ -z "$DUMP_FILE" ] || [ -z "$DUMP_POS" ]; then
      echo "[failback] ERROR: could not extract binlog position from dump — aborting"
      head -30 /tmp/failback-dump.sql
      exit 1
    fi

    echo "[failback] Importing into mysql-0..."
    kubectl cp /tmp/failback-dump.sql $NAMESPACE/mysql-0:/tmp/failback-dump.sql
    kubectl exec mysql-0 -n $NAMESPACE -- \
      bash -c "mysql -u root -p\"$MYSQL_ROOT_PASSWORD\" < /tmp/failback-dump.sql 2>/tmp/failback-import.err"

    # Ensure replicator user exists on replica-0 (it became primary, may need re-grant)
    kubectl exec mysql-replica-0 -n $NAMESPACE -- \
      mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e \
      "ALTER USER IF EXISTS 'replicator'@'%' IDENTIFIED BY '$REPLICATOR_PASSWORD';
       GRANT REPLICATION SLAVE ON *.* TO 'replicator'@'%';
       FLUSH PRIVILEGES;" 2>/dev/null

    # Point mysql-0 at replica-0 and catch up
    kubectl exec mysql-0 -n $NAMESPACE -- \
      mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "
        STOP SLAVE; RESET SLAVE ALL;
        CHANGE MASTER TO
          MASTER_HOST='mysql-replica-0.mysql-replica.$NAMESPACE.svc.cluster.local',
          MASTER_USER='replicator',
          MASTER_PASSWORD='$REPLICATOR_PASSWORD',
          MASTER_LOG_FILE='$DUMP_FILE',
          MASTER_LOG_POS=$DUMP_POS;
        START SLAVE;" 2>/dev/null

    echo "[failback] Waiting for mysql-0 to catch up..."
    for i in $(seq 1 60); do
      BEHIND=$(kubectl exec mysql-0 -n $NAMESPACE -- \
        mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SHOW SLAVE STATUS\G" 2>/dev/null \
        | grep "Seconds_Behind_Master:" | awk '{print $2}')
      [ "$BEHIND" = "0" ] && echo "[failback] mysql-0 is fully synced!" && break
      echo "[failback] Seconds_Behind_Master=$BEHIND — waiting..."
      sleep 5
    done

    # Promote mysql-0 back to primary with a clean binlog so replica-0 can follow it
    kubectl exec mysql-0 -n $NAMESPACE -- \
      mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e \
      "STOP SLAVE; RESET SLAVE ALL;
       SET GLOBAL read_only=OFF; SET GLOBAL super_read_only=OFF;
       RESET MASTER;" 2>/dev/null

    # Get mysql-0's fresh binlog position for replica-0 to follow
    MYSQL0_STATUS=$(kubectl exec mysql-0 -n $NAMESPACE -- \
      mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SHOW MASTER STATUS\G" 2>/dev/null)
    MYSQL0_FILE=$(echo "$MYSQL0_STATUS" | grep "File:" | awk '{print $2}')
    MYSQL0_POS=$(echo "$MYSQL0_STATUS"  | grep "Position:" | awk '{print $2}')
    echo "[failback] mysql-0 fresh binlog position: $MYSQL0_FILE @ $MYSQL0_POS"

    # Switch service back to mysql-0 BEFORE re-enslaving replica-0
    kubectl patch service mysql -n $NAMESPACE --type=merge \
      -p '{"spec":{"selector":{"app":"mysql","db-role":"active"}}}'

    # Reconfigure replica-0 as standby of mysql-0
    kubectl exec mysql-replica-0 -n $NAMESPACE -- \
      mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "
        STOP SLAVE; RESET SLAVE ALL;
        SET GLOBAL read_only=ON; SET GLOBAL super_read_only=ON;
        CHANGE MASTER TO
          MASTER_HOST='mysql-0.mysql.$NAMESPACE.svc.cluster.local',
          MASTER_USER='replicator',
          MASTER_PASSWORD='$REPLICATOR_PASSWORD',
          MASTER_LOG_FILE='$MYSQL0_FILE',
          MASTER_LOG_POS=$MYSQL0_POS;
        START SLAVE;" 2>/dev/null

    # Kill all app connections on replica-0 so Keycloak/backend get a TCP RST and
    # reconnect via the service (which now points to mysql-0). This avoids needing
    # to restart Keycloak manually after failback.
    echo "[failback] Killing app connections on replica-0 to force pool reconnect..."
    kubectl exec mysql-replica-0 -n $NAMESPACE -- \
      bash -c "mysql -uroot -p\"$MYSQL_ROOT_PASSWORD\" -Bse \
        'SELECT id FROM information_schema.processlist WHERE id != CONNECTION_ID() AND user NOT IN (\"system user\",\"event_scheduler\") AND command != \"Binlog Dump\"' \
        2>/dev/null | while read cid; do \
          mysql -uroot -p\"$MYSQL_ROOT_PASSWORD\" -e \"KILL CONNECTION \$cid\" 2>/dev/null; \
        done"

    echo "=== FAILBACK COMPLETE — mysql-0 is primary, mysql-replica-0 is standby ==="
    STATE="normal"
    FAIL_COUNT=0
  fi
done
