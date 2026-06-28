#!/bin/bash
# etcd snapshot backup script
# Runs on the Kubernetes master node (needs etcdctl and access to /etc/kubernetes/pki/etcd/)
#
# Setup:
#   chmod +x /usr/local/bin/etcd-backup.sh
#   Add to crontab: 0 2 * * * /usr/local/bin/etcd-backup.sh >> /var/log/etcd-backup.log 2>&1

BACKUP_DIR="/var/backups/etcd"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SNAPSHOT="$BACKUP_DIR/etcd-$TIMESTAMP.db"

mkdir -p "$BACKUP_DIR"

echo "[$TIMESTAMP] Starting etcd snapshot backup..."

ETCDCTL_API=3 etcdctl \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  snapshot save "$SNAPSHOT"

if [ $? -eq 0 ]; then
  SIZE=$(du -sh "$SNAPSHOT" | cut -f1)
  echo "[$TIMESTAMP] Snapshot saved: $SNAPSHOT ($SIZE)"
else
  echo "[$TIMESTAMP] ERROR: snapshot failed"
  exit 1
fi

# Remove snapshots older than RETENTION_DAYS
find "$BACKUP_DIR" -name "etcd-*.db" -mtime +$RETENTION_DAYS -delete
echo "[$TIMESTAMP] Cleaned up snapshots older than $RETENTION_DAYS days"
echo "[$TIMESTAMP] Current backups:"
ls -lh "$BACKUP_DIR"
