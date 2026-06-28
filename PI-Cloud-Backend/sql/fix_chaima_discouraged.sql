-- ═══════════════════════════════════════════════════════════════════
-- Fix: Force chaima (profile_id=2) → DISCOURAGED prediction
-- Today = 2026-04-19; discouraged threshold = days_since_last > 40
-- ═══════════════════════════════════════════════════════════════════

-- Step 1: Push chaima's most recent COMPLETED consultation to 45 days ago
-- This gives days_since_last = 45 (> 40 threshold → discouraged_score +2.0)
UPDATE consultations
SET scheduled_at = '2026-03-05 10:00:00'
WHERE profile_id = 2
  AND status = 'COMPLETED'
ORDER BY scheduled_at DESC
LIMIT 1;

-- Step 2: Mark her REJECTED consultations so cancel_rate counts them
-- (service now counts REJECTED as cancellations — no SQL change needed,
--  but ensure at least 1-2 REJECTED/CANCELLED entries exist)
-- If chaima has no CANCELLED consultations, add one:
INSERT INTO consultations
  (profile_id, dietitian_id, scheduled_at, duration_minutes, status,
   doctor_name, doctor_specialty, consultation_type, priority, reason, created_at)
SELECT
  2, dietitian_id, '2026-03-15 10:00:00', 30, 'CANCELLED',
  doctor_name, doctor_specialty, 'VIDEO_CALL', 'NORMAL', 'Annulée par patient', '2026-03-13 10:00:00'
FROM consultations
WHERE profile_id = 2
LIMIT 1
ON DUPLICATE KEY UPDATE status = status; -- no-op if conflicts

-- Step 3: Verify result
SELECT id, status, scheduled_at,
       DATEDIFF(NOW(), scheduled_at) AS days_ago
FROM consultations
WHERE profile_id = 2
ORDER BY scheduled_at DESC;
