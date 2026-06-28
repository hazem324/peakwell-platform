#!/bin/bash
# MySQL automatic failover + failback monitor
# Run on the Kubernetes master node (needs kubectl in PATH with cluster access).
#
# Usage:
#   chmod +x mysql-failover.sh
#   nohup ./mysql-failover.sh >> /var/log/mysql-failover.log 2>&1 &
#
# States:
#   normal     — watches mysql-0; triggers failover after THRESHOLD failures
#   failed     — mysql-replica-0 is primary; waits for mysql-0 to recover
#   recovering — syncs mysql-0 from replica, promotes it back, re-enslaves replica

NAMESPACE="${NAMESPACE:-peakwell}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-CHANGE_ME}"
REPLICATOR_PASSWORD="${REPLICATOR_PASSWORD:-replicatorpass}"
THRESHOLD=5
FAIL_COUNT=0
STATE="normal"

echo "=== MySQL failover monitor started ==="
echo "Primary: mysql-0  |  Standby: mysql-replica-0  |  Namespace: $NAMESPACE"

while true; do
  sleep 10

  # ── NORMAL: watch mysql-0 ──────────────────────────────────────────────────
  if [ "$STATE" = "normal" ]; then
    POD_PHASE=$(kubectl get pod mysql-0 -n "$NAMESPACE" \
      -o jsonpath='{.status.phase}' 2>/dev/null)

    if [ "$POD_PHASE" != "Running" ]; then
      FAIL_COUNT=$((FAIL_COUNT + 1))
      echo "[normal] mysql-0 phase='$POD_PHASE' — fail $FAIL_COUNT/$THRESHOLD"
    else
      if kubectl exec mysql-0 -n "$NAMESPACE" -- \
           mysqladmin ping -u root -p"$MYSQL_ROOT_PASSWORD" --silent 2>/dev/null; then
        FAIL_COUNT=0
      else
        FAIL_COUNT=$((FAIL_COUNT + 1))
        echo "[normal] mysql-0 mysqld not responding — fail $FAIL_COUNT/$THRESHOLD"
      fi
    fi

    if [ "$FAIL_COUNT" -ge "$THRESHOLD" ]; then
      echo "=== PRIMARY DOWN — FAILOVER STARTING ==="

      kubectl exec mysql-replica-0 -n "$NAMESPACE" -- \
        mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e \
        "STOP SLAVE; RESET SLAVE ALL;
         SET GLOBAL read_only=OFF; SET GLOBAL super_read_only=OFF;" 2>/dev/null

      kubectl patch service mysql -n "$NAMESPACE" --type=merge \
        -p '{"spec":{"selector":{"app":"mysql-replica","db-role":"standby"}}}'

      echo "=== FAILOVER COMPLETE — mysql-replica-0 is now primary ==="
      STATE="failed"
      FAIL_COUNT=0
    fi

  # ── FAILED: wait for mysql-0 to come back ─────────────────────────────────
  elif [ "$STATE" = "failed" ]; then
    POD_PHASE=$(kubectl get pod mysql-0 -n "$NAMESPACE" \
      -o jsonpath='{.status.phase}' 2>/dev/null)

    if [ "$POD_PHASE" != "Running" ]; then
      echo "[failed] Waiting for mysql-0... phase='$POD_PHASE'"
    elif ! kubectl exec mysql-0 -n "$NAMESPACE" -- \
           mysqladmin ping -u root -p"$MYSQL_ROOT_PASSWORD" --silent 2>/dev/null; then
      echo "[failed] mysql-0 pod Running but mysqld not ready yet..."
    else
      echo "=== mysql-0 is back — FAILBACK STARTING ==="
      STATE="recovering"
    fi

  # ── RECOVERING: sync mysql-0 → promote it → re-enslave replica ────────────
  elif [ "$STATE" = "recovering" ]; then
    echo "[failback] Dumping all databases from mysql-replica-0..."
    kubectl exec mysql-replica-0 -n "$NAMESPACE" -- \
      mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" \
        --master-data=2 --single-transaction --all-databases \
      > /tmp/failback-dump.sql 2>/dev/null

    echo "[failback] Importing into mysql-0..."
    kubectl cp /tmp/failback-dump.sql "$NAMESPACE/mysql-0:/tmp/failback-dump.sql"
    kubectl exec mysql-0 -n "$NAMESPACE" -- \
      bash -c "mysql -u root -p\"$MYSQL_ROOT_PASSWORD\" < /tmp/failback-dump.sql" 2>/dev/null

    DUMP_FILE=$(grep "MASTER_LOG_FILE" /tmp/failback-dump.sql \
      | sed "s/.*MASTER_LOG_FILE='\\([^']*\\)'.*/\\1/")
    DUMP_POS=$(grep "MASTER_LOG_POS" /tmp/failback-dump.sql \
      | sed "s/.*MASTER_LOG_POS=\\([0-9]*\\).*/\\1/")
    echo "[failback] Sync point: $DUMP_FILE @ $DUMP_POS"

    # Ensure replicator user exists on replica-0 (now acting as primary)
    kubectl exec mysql-replica-0 -n "$NAMESPACE" -- \
      mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e \
      "ALTER USER IF EXISTS 'replicator'@'%' IDENTIFIED BY '$REPLICATOR_PASSWORD';
       GRANT REPLICATION SLAVE ON *.* TO 'replicator'@'%';
       FLUSH PRIVILEGES;" 2>/dev/null

    # Point mysql-0 at replica-0 and let it catch up
    kubectl exec mysql-0 -n "$NAMESPACE" -- \
      mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "
        STOP SLAVE; RESET SLAVE ALL;
        CHANGE MASTER TO
          MASTER_HOST='mysql-replica-0.mysql-replica.$NAMESPACE.svc.cluster.local',
          MASTER_USER='replicator',
          MASTER_PASSWORD='$REPLICATOR_PASSWORD',
          MASTER_LOG_FILE='$DUMP_FILE',
          MASTER_LOG_POS=$DUMP_POS;
        START SLAVE;" 2>/dev/null

    echo "[failback] Waiting for mysql-0 to sync..."
    for i in $(seq 1 60); do
      BEHIND=$(kubectl exec mysql-0 -n "$NAMESPACE" -- \
        mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SHOW SLAVE STATUS\G" 2>/dev/null \
        | grep "Seconds_Behind_Master:" | awk '{print $2}')
      [ "$BEHIND" = "0" ] && echo "[failback] mysql-0 fully synced!" && break
      echo "[failback] Seconds_Behind_Master=$BEHIND — waiting..."
      sleep 5
    done

    # Promote mysql-0 back to primary
    kubectl exec mysql-0 -n "$NAMESPACE" -- \
      mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e \
      "STOP SLAVE; RESET SLAVE ALL;
       SET GLOBAL read_only=OFF; SET GLOBAL super_read_only=OFF;" 2>/dev/null

    # Get mysql-0's binlog position for replica-0 to follow
    MYSQL0_STATUS=$(kubectl exec mysql-0 -n "$NAMESPACE" -- \
      mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SHOW MASTER STATUS\G" 2>/dev/null)
    MYSQL0_FILE=$(echo "$MYSQL0_STATUS" | grep "File:"     | awk '{print $2}')
    MYSQL0_POS=$(echo "$MYSQL0_STATUS"  | grep "Position:" | awk '{print $2}')

    # Switch service back to mysql-0
    kubectl patch service mysql -n "$NAMESPACE" --type=merge \
      -p '{"spec":{"selector":{"app":"mysql","db-role":"active"}}}'

    # Reconfigure replica-0 as standby of mysql-0
    kubectl exec mysql-replica-0 -n "$NAMESPACE" -- \
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

    echo "=== FAILBACK COMPLETE — mysql-0 is primary, mysql-replica-0 is standby ==="
    STATE="normal"
    FAIL_COUNT=0
  fi
done
