-- ═══════════════════════════════════════════════════════════════════════
-- PeakWell AI Test Data
-- Adds biometric history, symptoms, goals, ratings & feedbacks
-- for your 3 existing patients + 3 new patients
-- Dietitian ID = 2 (Eya ben nsasser)
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- Step 1: Assign existing patients to dietitian
-- ───────────────────────────────────────────────────────────────────────
UPDATE medical_profiles SET dietitian_id = 2 WHERE id IN (1, 2, 3);

-- ───────────────────────────────────────────────────────────────────────
-- Step 2: Create 3 NEW patients (profiles 4, 5, 6)
-- ───────────────────────────────────────────────────────────────────────
INSERT INTO medical_profiles (id, first_name, last_name, date_of_birth, gender, blood_type, height, emergency_contact, complete, dietitian_id)
VALUES
  (4, 'Amira',   'Ben Salem',  '1998-03-15', 'Female', 'A+',  1.65, '+216 98 111 222', true, 2),
  (5, 'Mohamed', 'Bouazizi',   '1992-01-30', 'Male',   'AB-', 1.82, '+216 95 777 888', true, 2),
  (6, 'Khalil',  'Chaabane',   '1997-09-25', 'Male',   'O-',  1.75, '+216 93 111 333', true, 2);

-- ───────────────────────────────────────────────────────────────────────
-- Step 3: BIOMETRIC ENTRIES (progressive measurements over weeks)
-- ───────────────────────────────────────────────────────────────────────

-- ▸ Feryel (profile 1) — Active, steady weight loss, good patient
INSERT INTO biometric_entries (weight, height, bmi, body_fat, muscle_mass, systolic, diastolic, glucose, notes, recorded_at, profile_id) VALUES
  (72.0, 1.68, 25.5, 28.0, 27.0, 125, 82, 95,  'Debut programme',       '2026-03-01 09:00:00', 1),
  (71.2, 1.68, 25.2, 27.5, 27.3, 123, 80, 93,  'Bonne semaine',         '2026-03-08 09:00:00', 1),
  (70.5, 1.68, 25.0, 27.0, 27.5, 122, 79, 92,  'Progres continu',       '2026-03-15 09:00:00', 1),
  (69.8, 1.68, 24.7, 26.5, 27.8, 120, 78, 90,  'Regime bien suivi',     '2026-03-22 09:00:00', 1),
  (69.0, 1.68, 24.4, 26.0, 28.0, 118, 77, 88,  'Excellents resultats',  '2026-03-29 09:00:00', 1),
  (68.5, 1.68, 24.3, 25.5, 28.2, 117, 76, 87,  'Objectif proche',       '2026-04-05 09:00:00', 1),
  (68.0, 1.68, 24.1, 25.0, 28.5, 116, 75, 86,  'Tres bon suivi',        '2026-04-12 09:00:00', 1);

-- ▸ chaima (profile 2) — Discouraged, weight stagnating then gaining
INSERT INTO biometric_entries (weight, height, bmi, body_fat, muscle_mass, systolic, diastolic, glucose, notes, recorded_at, profile_id) VALUES
  (82.0, 1.62, 31.2, 33.0, 25.0, 138, 88, 108, 'Premier bilan',    '2026-02-15 10:00:00', 2),
  (81.5, 1.62, 31.0, 32.8, 25.0, 136, 87, 106, 'Legere baisse',    '2026-02-22 10:00:00', 2),
  (81.8, 1.62, 31.1, 33.0, 24.8, 137, 88, 107, 'Stagnation',       '2026-03-01 10:00:00', 2),
  (82.5, 1.62, 31.4, 33.5, 24.5, 140, 90, 110, 'Reprise de poids', '2026-03-10 10:00:00', 2),
  (83.2, 1.62, 31.7, 34.0, 24.2, 142, 91, 112, 'Frustree',         '2026-03-20 10:00:00', 2);

-- ▸ Fares (profile 3) — already has 1 entry, add more showing improvement then plateau
INSERT INTO biometric_entries (weight, height, bmi, body_fat, muscle_mass, systolic, diastolic, glucose, notes, recorded_at, profile_id) VALUES
  (73.0, 1.80, 22.5, 26.0, 30.5, 142, 122, 132, 'Deuxieme mesure',   '2026-03-05 09:00:00', 3),
  (72.0, 1.80, 22.2, 25.5, 30.8, 140, 120, 130, 'Amelioration',      '2026-03-15 09:00:00', 3),
  (71.0, 1.80, 21.9, 25.0, 31.0, 138, 118, 128, 'Bon progres',       '2026-03-25 09:00:00', 3),
  (70.5, 1.80, 21.8, 24.8, 31.0, 136, 118, 128, 'Stable',            '2026-04-05 09:00:00', 3),
  (70.0, 1.80, 21.6, 24.5, 31.2, 135, 117, 126, 'Continue bien',     '2026-04-15 09:00:00', 3);

-- ▸ Amira (profile 4) — Healed patient, reached target, stable weight
INSERT INTO biometric_entries (weight, height, bmi, body_fat, muscle_mass, systolic, diastolic, glucose, notes, recorded_at, profile_id) VALUES
  (68.0, 1.65, 25.0, 28.0, 25.0, 125, 82, 95, 'Debut programme',    '2026-01-10 08:30:00', 4),
  (66.5, 1.65, 24.4, 27.0, 25.5, 122, 80, 93, 'Bonne progression',  '2026-01-25 08:30:00', 4),
  (64.0, 1.65, 23.5, 25.5, 26.0, 120, 78, 90, 'Objectif atteint',   '2026-02-10 08:30:00', 4),
  (63.5, 1.65, 23.3, 25.0, 26.2, 118, 77, 88, 'Maintien du poids',  '2026-02-25 08:30:00', 4),
  (63.2, 1.65, 23.2, 24.8, 26.3, 117, 76, 87, 'Stable guerie',      '2026-03-10 08:30:00', 4);

-- ▸ Mohamed (profile 5) — High risk, BP and glucose worsening, stopped coming
INSERT INTO biometric_entries (weight, height, bmi, body_fat, muscle_mass, systolic, diastolic, glucose, notes, recorded_at, profile_id) VALUES
  (105.0, 1.82, 31.7, 30.0, 38.0, 150, 95, 125, 'Premiere visite',     '2026-01-05 11:00:00', 5),
  (104.0, 1.82, 31.4, 29.5, 38.2, 148, 93, 122, 'Effort initial',      '2026-01-20 11:00:00', 5),
  (104.5, 1.82, 31.5, 30.2, 37.5, 152, 96, 128, 'Rechute alimentaire', '2026-02-05 11:00:00', 5),
  (106.0, 1.82, 32.0, 31.0, 37.0, 155, 98, 132, 'Aggravation',         '2026-02-20 11:00:00', 5);

-- ▸ Khalil (profile 6) — At risk, stopped tracking 48 days ago
INSERT INTO biometric_entries (weight, height, bmi, body_fat, muscle_mass, systolic, diastolic, glucose, notes, recorded_at, profile_id) VALUES
  (88.0, 1.75, 28.7, 26.0, 32.0, 135, 88, 105, 'Debut programme', '2026-01-15 09:30:00', 6),
  (87.0, 1.75, 28.4, 25.5, 32.3, 133, 86, 103, 'Premier mois ok', '2026-02-01 09:30:00', 6),
  (87.5, 1.75, 28.6, 26.0, 32.0, 136, 88, 106, 'Stagnation',      '2026-02-15 09:30:00', 6),
  (88.5, 1.75, 28.9, 26.5, 31.5, 138, 89, 108, 'Derniere mesure',  '2026-03-01 09:30:00', 6);


-- ───────────────────────────────────────────────────────────────────────
-- Step 4: CONSULTATIONS for new patients
-- ───────────────────────────────────────────────────────────────────────

-- ▸ Amira (profile 4) — Many completed, goals achieved (HEALED)
INSERT INTO consultations (profile_id, dietitian_id, scheduled_at, duration_minutes, status, doctor_name, doctor_specialty, consultation_type, priority, reason, created_at) VALUES
  (4, 2, '2026-01-12 08:30:00', 30, 'COMPLETED', 'Dr. Nutritionniste', 'Nutrition', 'IN_PERSON',  'NORMAL', 'Bilan initial',          '2026-01-10 08:00:00'),
  (4, 2, '2026-01-27 08:30:00', 30, 'COMPLETED', 'Dr. Nutritionniste', 'Nutrition', 'VIDEO_CALL', 'NORMAL', 'Suivi plan alimentaire',  '2026-01-25 08:00:00'),
  (4, 2, '2026-02-12 08:30:00', 30, 'COMPLETED', 'Dr. Nutritionniste', 'Nutrition', 'IN_PERSON',  'NORMAL', 'Objectif atteint',        '2026-02-10 08:00:00'),
  (4, 2, '2026-02-27 08:30:00', 30, 'COMPLETED', 'Dr. Nutritionniste', 'Nutrition', 'IN_PERSON',  'NORMAL', 'Seance de cloture',       '2026-02-25 08:00:00'),
  (4, 2, '2026-03-12 08:30:00', 30, 'COMPLETED', 'Dr. Nutritionniste', 'Nutrition', 'VIDEO_CALL', 'NORMAL', 'Controle post-programme', '2026-03-10 08:00:00');

-- ▸ Mohamed (profile 5) — Few consultations, cancelled often, last visit 57 days ago (DISCOURAGED)
INSERT INTO consultations (profile_id, dietitian_id, scheduled_at, duration_minutes, status, doctor_name, doctor_specialty, consultation_type, priority, reason, created_at) VALUES
  (5, 2, '2026-01-07 11:00:00', 45, 'COMPLETED',  'Dr. Nutritionniste', 'Nutrition', 'IN_PERSON',  'URGENT', 'Bilan urgent glycemie elevee',  '2026-01-05 08:00:00'),
  (5, 2, '2026-01-22 11:00:00', 30, 'COMPLETED',  'Dr. Nutritionniste', 'Nutrition', 'IN_PERSON',  'NORMAL', 'Suivi glycemie',                '2026-01-20 08:00:00'),
  (5, 2, '2026-02-07 11:00:00', 30, 'CANCELLED',  'Dr. Nutritionniste', 'Nutrition', 'VIDEO_CALL', 'NORMAL', 'Annule par patient',            '2026-02-05 08:00:00'),
  (5, 2, '2026-02-20 11:00:00', 30, 'COMPLETED',  'Dr. Nutritionniste', 'Nutrition', 'IN_PERSON',  'URGENT', 'Dernier suivi',                 '2026-02-18 08:00:00'),
  (5, 2, '2026-03-10 11:00:00', 30, 'CANCELLED',  'Dr. Nutritionniste', 'Nutrition', 'IN_PERSON',  'NORMAL', 'Ne repond plus',                '2026-03-08 08:00:00');

-- ▸ Khalil (profile 6) — Stopped after 3 visits, last 48 days ago (AT RISK)
INSERT INTO consultations (profile_id, dietitian_id, scheduled_at, duration_minutes, status, doctor_name, doctor_specialty, consultation_type, priority, reason, created_at) VALUES
  (6, 2, '2026-01-17 09:30:00', 30, 'COMPLETED',  'Dr. Nutritionniste', 'Nutrition', 'IN_PERSON',  'NORMAL', 'Premiere consultation',  '2026-01-15 08:00:00'),
  (6, 2, '2026-02-03 09:30:00', 30, 'COMPLETED',  'Dr. Nutritionniste', 'Nutrition', 'VIDEO_CALL', 'NORMAL', 'Suivi',                  '2026-02-01 08:00:00'),
  (6, 2, '2026-03-01 09:30:00', 30, 'COMPLETED',  'Dr. Nutritionniste', 'Nutrition', 'IN_PERSON',  'NORMAL', 'Derniere visite',         '2026-02-27 08:00:00'),
  (6, 2, '2026-03-20 09:30:00', 30, 'CANCELLED',  'Dr. Nutritionniste', 'Nutrition', 'IN_PERSON',  'NORMAL', 'Annule sans raison',     '2026-03-18 08:00:00');


-- ───────────────────────────────────────────────────────────────────────
-- Step 5: HEALTH GOALS
-- ───────────────────────────────────────────────────────────────────────

-- ▸ Feryel (1) — Active goal, 60% progress
INSERT INTO health_goals (profile_id, metric, direction, start_value, target_value, unit, deadline, active, achieved, created_at) VALUES
  (1, 'weight',  'decrease', 72.0, 65.0, 'kg', '2026-06-30', true,  false, '2026-03-01 09:00:00'),
  (1, 'bodyFat', 'decrease', 28.0, 22.0, '%',  '2026-06-30', true,  false, '2026-03-01 09:00:00');

-- ▸ chaima (2) — Goal set but no progress (discouraged)
INSERT INTO health_goals (profile_id, metric, direction, start_value, target_value, unit, deadline, active, achieved, created_at) VALUES
  (2, 'weight',  'decrease', 82.0, 72.0, 'kg',    '2026-05-30', true, false, '2026-02-15 10:00:00'),
  (2, 'glucose', 'decrease', 108.0, 95.0, 'mg/dL', '2026-05-30', true, false, '2026-02-15 10:00:00');

-- ▸ Fares (3) — Active goal, decent progress
INSERT INTO health_goals (profile_id, metric, direction, start_value, target_value, unit, deadline, active, achieved, created_at) VALUES
  (3, 'weight',   'decrease', 70.0, 65.0, 'kg',    '2026-07-31', true, false, '2026-03-05 09:00:00'),
  (3, 'systolic', 'decrease', 140.0, 120.0, 'mmHg', '2026-07-31', true, false, '2026-03-05 09:00:00');

-- ▸ Amira (4) — Goal ACHIEVED (healed)
INSERT INTO health_goals (profile_id, metric, direction, start_value, target_value, unit, deadline, active, achieved, achieved_date, created_at) VALUES
  (4, 'weight', 'decrease', 68.0, 64.0, 'kg', '2026-04-30', false, true, '2026-02-10', '2026-01-10 08:30:00'),
  (4, 'bmi',    'decrease', 25.0, 23.5, '',   '2026-04-30', false, true, '2026-02-10', '2026-01-10 08:30:00');

-- ▸ Mohamed (5) — Goals not progressing at all
INSERT INTO health_goals (profile_id, metric, direction, start_value, target_value, unit, deadline, active, achieved, created_at) VALUES
  (5, 'weight',   'decrease', 105.0, 90.0, 'kg',     '2026-06-30', true, false, '2026-01-05 11:00:00'),
  (5, 'glucose',  'decrease', 125.0, 100.0, 'mg/dL', '2026-06-30', true, false, '2026-01-05 11:00:00'),
  (5, 'systolic', 'decrease', 150.0, 130.0, 'mmHg',  '2026-06-30', true, false, '2026-01-05 11:00:00');

-- ▸ Khalil (6) — Goal abandoned essentially
INSERT INTO health_goals (profile_id, metric, direction, start_value, target_value, unit, deadline, active, achieved, created_at) VALUES
  (6, 'weight', 'decrease', 88.0, 80.0, 'kg', '2026-05-31', true, false, '2026-01-15 09:30:00');


-- ───────────────────────────────────────────────────────────────────────
-- Step 6: SYMPTOM ENTRIES (last 30-60 days)
-- ───────────────────────────────────────────────────────────────────────

-- ▸ Feryel (1) — Mild symptoms, high mood & energy
INSERT INTO symptom_entries (log_date, symptom, severity, time_of_day, duration, mood, energy_level, stress_level, notes, created_at, profile_id) VALUES
  ('2026-04-02', 'Fatigue legere',  1, 'morning',   30,  4, 4, 2, 'Apres sport',         '2026-04-02 08:00:00', 1),
  ('2026-04-05', 'Mal de tete',     2, 'afternoon',  60,  4, 3, 2, 'Deshydratation',      '2026-04-05 14:00:00', 1),
  ('2026-04-10', 'Fatigue legere',  1, 'evening',    45,  5, 4, 1, 'Journee chargee',     '2026-04-10 19:00:00', 1),
  ('2026-04-14', 'Aucun',           1, 'morning',   NULL, 5, 5, 1, 'Tres bonne forme',    '2026-04-14 08:00:00', 1);

-- ▸ chaima (2) — Increasing symptoms, bad mood (discouraged)
INSERT INTO symptom_entries (log_date, symptom, severity, time_of_day, duration, mood, energy_level, stress_level, notes, created_at, profile_id) VALUES
  ('2026-03-10', 'Fatigue',          3, 'morning',   120, 2, 2, 4, 'Pas motivee',              '2026-03-10 08:00:00', 2),
  ('2026-03-14', 'Fringales',        4, 'afternoon',  60, 2, 2, 4, 'Envie de sucre',           '2026-03-14 15:00:00', 2),
  ('2026-03-18', 'Insomnie',         3, 'night',     180, 1, 1, 5, 'Stress travail + regime',  '2026-03-18 23:00:00', 2),
  ('2026-03-22', 'Mal de tete',      4, 'morning',    90, 2, 2, 4, 'Stresse',                  '2026-03-22 09:00:00', 2),
  ('2026-03-28', 'Fatigue extreme',  5, 'afternoon', 240, 1, 1, 5, 'Veut tout arreter',        '2026-03-28 14:00:00', 2),
  ('2026-04-05', 'Nausees',          4, 'morning',    90, 1, 1, 5, 'Regime trop dur',          '2026-04-05 08:00:00', 2);

-- ▸ Fares (3) — Mild, improving
INSERT INTO symptom_entries (log_date, symptom, severity, time_of_day, duration, mood, energy_level, stress_level, notes, created_at, profile_id) VALUES
  ('2026-03-25', 'Ballonnements', 2, 'afternoon', 60,  3, 3, 3, 'Apres dejeuner',     '2026-03-25 13:00:00', 3),
  ('2026-04-02', 'Fatigue',       2, 'morning',   45,  3, 3, 2, 'Legere',              '2026-04-02 08:00:00', 3),
  ('2026-04-10', 'Aucun',         1, 'morning',   NULL, 4, 4, 2, 'Amelioration nette', '2026-04-10 08:00:00', 3),
  ('2026-04-16', 'Aucun',         1, 'morning',   NULL, 4, 4, 1, 'En forme',            '2026-04-16 08:00:00', 3);

-- ▸ Amira (4) — No recent symptoms (healed, stable)
INSERT INTO symptom_entries (log_date, symptom, severity, time_of_day, duration, mood, energy_level, stress_level, notes, created_at, profile_id) VALUES
  ('2026-03-15', 'Aucun', 1, 'morning', NULL, 5, 5, 1, 'Tout va bien', '2026-03-15 08:00:00', 4),
  ('2026-04-01', 'Aucun', 1, 'morning', NULL, 5, 5, 1, 'En forme',     '2026-04-01 08:00:00', 4);

-- ▸ Mohamed (5) — Severe symptoms, high stress (high risk)
INSERT INTO symptom_entries (log_date, symptom, severity, time_of_day, duration, mood, energy_level, stress_level, notes, created_at, profile_id) VALUES
  ('2026-02-10', 'Vertiges',         4, 'morning',   60,  2, 2, 5, 'Glycemie instable',   '2026-02-10 09:00:00', 5),
  ('2026-02-15', 'Fatigue chronique', 5, 'afternoon', 300, 1, 1, 5, 'Peut pas travailler', '2026-02-15 14:00:00', 5),
  ('2026-02-20', 'Nausees',          4, 'morning',   90,  1, 1, 5, 'Apres repas',          '2026-02-20 08:00:00', 5),
  ('2026-02-25', 'Douleur thorax',   5, 'evening',   120, 1, 1, 5, 'Inquiet',              '2026-02-25 20:00:00', 5);

-- ▸ Khalil (6) — No recent symptoms (stopped tracking)
INSERT INTO symptom_entries (log_date, symptom, severity, time_of_day, duration, mood, energy_level, stress_level, notes, created_at, profile_id) VALUES
  ('2026-02-10', 'Fatigue',    3, 'morning',   90, 2, 2, 4, 'Manque de motivation', '2026-02-10 09:00:00', 6),
  ('2026-02-20', 'Fringales',  3, 'afternoon', 60, 2, 2, 3, 'Envies de gras',       '2026-02-20 15:00:00', 6);


-- ───────────────────────────────────────────────────────────────────────
-- Step 7: CONSULTATION RATINGS for existing consultations
-- ───────────────────────────────────────────────────────────────────────
-- Note: Ratings for consultation IDs 2 and 7 already exist, skip those

-- ▸ Feryel — high ratings on other completed consultations
INSERT INTO consultation_ratings (consultation_id, overall_rating, doctor_knowledge_rating, communication_rating, advice_usefulness_rating, punctuality_rating, would_recommend, feedback, created_at)
SELECT id, 5, 5, 5, 5, 5, true, 'Excellent suivi', NOW()
FROM consultations WHERE profile_id = 1 AND status = 'COMPLETED' AND id NOT IN (SELECT consultation_id FROM consultation_ratings)
ORDER BY scheduled_at LIMIT 1;

-- ▸ chaima — low ratings (frustrated)
INSERT INTO consultation_ratings (consultation_id, overall_rating, doctor_knowledge_rating, communication_rating, advice_usefulness_rating, punctuality_rating, would_recommend, feedback, created_at)
SELECT id, 2, 3, 2, 2, 3, false, 'Pas de resultats je suis decouragee', NOW()
FROM consultations WHERE profile_id = 2 AND status IN ('COMPLETED','UPCOMING') AND id NOT IN (SELECT consultation_id FROM consultation_ratings)
ORDER BY scheduled_at LIMIT 1;

-- ▸ Fares — decent ratings
INSERT INTO consultation_ratings (consultation_id, overall_rating, doctor_knowledge_rating, communication_rating, advice_usefulness_rating, punctuality_rating, would_recommend, feedback, created_at)
SELECT id, 4, 4, 4, 4, 4, true, 'Bon suivi je progresse', NOW()
FROM consultations WHERE profile_id = 3 AND status IN ('COMPLETED','UPCOMING') AND id NOT IN (SELECT consultation_id FROM consultation_ratings)
ORDER BY scheduled_at LIMIT 1;

-- ▸ Amira (4) — excellent ratings (healed happy patient)
INSERT INTO consultation_ratings (consultation_id, overall_rating, doctor_knowledge_rating, communication_rating, advice_usefulness_rating, punctuality_rating, would_recommend, feedback, created_at)
SELECT c.id, 5, 5, 5, 5, 5, true, 'Programme parfait objectif atteint', NOW()
FROM consultations c WHERE c.profile_id = 4 AND c.status = 'COMPLETED'
AND c.id NOT IN (SELECT consultation_id FROM consultation_ratings)
ORDER BY c.scheduled_at LIMIT 1;

INSERT INTO consultation_ratings (consultation_id, overall_rating, doctor_knowledge_rating, communication_rating, advice_usefulness_rating, punctuality_rating, would_recommend, feedback, created_at)
SELECT c.id, 5, 5, 5, 5, 5, true, 'Je recommande vivement', NOW()
FROM consultations c WHERE c.profile_id = 4 AND c.status = 'COMPLETED'
AND c.id NOT IN (SELECT consultation_id FROM consultation_ratings)
ORDER BY c.scheduled_at LIMIT 1;

-- ▸ Mohamed (5) — very low rating
INSERT INTO consultation_ratings (consultation_id, overall_rating, doctor_knowledge_rating, communication_rating, advice_usefulness_rating, punctuality_rating, would_recommend, feedback, created_at)
SELECT c.id, 1, 2, 2, 1, 2, false, 'Pas adapte a ma situation aucun progres', NOW()
FROM consultations c WHERE c.profile_id = 5 AND c.status = 'COMPLETED'
AND c.id NOT IN (SELECT consultation_id FROM consultation_ratings)
ORDER BY c.scheduled_at LIMIT 1;

-- ▸ Khalil (6) — mediocre
INSERT INTO consultation_ratings (consultation_id, overall_rating, doctor_knowledge_rating, communication_rating, advice_usefulness_rating, punctuality_rating, would_recommend, feedback, created_at)
SELECT c.id, 3, 3, 3, 2, 3, false, 'Resultats trop lents', NOW()
FROM consultations c WHERE c.profile_id = 6 AND c.status = 'COMPLETED'
AND c.id NOT IN (SELECT consultation_id FROM consultation_ratings)
ORDER BY c.scheduled_at LIMIT 1;


-- ───────────────────────────────────────────────────────────────────────
-- Step 8: CONSULTATION FEEDBACKS
-- ───────────────────────────────────────────────────────────────────────

-- ▸ Feryel (1) — follows advice, improving
INSERT INTO consultation_feedbacks (consultation_id, overall_rating, doctor_knowledge, communication, helpfulness, would_recommend, advice_followed, symptoms_improved, comments, created_at)
SELECT c.id, 5, 5, 5, 5, 5, true, true, 'Je suis le plan a la lettre tres contente', NOW()
FROM consultations c WHERE c.profile_id = 1 AND c.status = 'COMPLETED'
AND c.id NOT IN (SELECT consultation_id FROM consultation_feedbacks WHERE consultation_id IS NOT NULL)
ORDER BY c.scheduled_at LIMIT 1;

-- ▸ chaima (2) — did NOT follow advice
INSERT INTO consultation_feedbacks (consultation_id, overall_rating, doctor_knowledge, communication, helpfulness, would_recommend, advice_followed, symptoms_improved, comments, created_at)
SELECT c.id, 2, 3, 2, 2, 2, false, false, 'Regime trop difficile je narrive pas', NOW()
FROM consultations c WHERE c.profile_id = 2 AND c.status IN ('COMPLETED','UPCOMING')
AND c.id NOT IN (SELECT consultation_id FROM consultation_feedbacks WHERE consultation_id IS NOT NULL)
ORDER BY c.scheduled_at LIMIT 1;

-- ▸ Amira (4) — followed advice, healed
INSERT INTO consultation_feedbacks (consultation_id, overall_rating, doctor_knowledge, communication, helpfulness, would_recommend, advice_followed, symptoms_improved, comments, created_at)
SELECT c.id, 5, 5, 5, 5, 5, true, true, 'Programme termine avec succes', NOW()
FROM consultations c WHERE c.profile_id = 4 AND c.status = 'COMPLETED'
AND c.id NOT IN (SELECT consultation_id FROM consultation_feedbacks WHERE consultation_id IS NOT NULL)
ORDER BY c.scheduled_at LIMIT 1;

-- ▸ Mohamed (5) — did NOT follow
INSERT INTO consultation_feedbacks (consultation_id, overall_rating, doctor_knowledge, communication, helpfulness, would_recommend, advice_followed, symptoms_improved, comments, created_at)
SELECT c.id, 1, 2, 2, 1, 1, false, false, 'Trop complique jai abandonne', NOW()
FROM consultations c WHERE c.profile_id = 5 AND c.status = 'COMPLETED'
AND c.id NOT IN (SELECT consultation_id FROM consultation_feedbacks WHERE consultation_id IS NOT NULL)
ORDER BY c.scheduled_at LIMIT 1;

-- ▸ Fares (3) — follows partially
INSERT INTO consultation_feedbacks (consultation_id, overall_rating, doctor_knowledge, communication, helpfulness, would_recommend, advice_followed, symptoms_improved, comments, created_at)
SELECT c.id, 4, 4, 4, 4, 4, true, true, 'Jessaie de suivre parfois dur le weekend', NOW()
FROM consultations c WHERE c.profile_id = 3 AND c.status IN ('COMPLETED','UPCOMING')
AND c.id NOT IN (SELECT consultation_id FROM consultation_feedbacks WHERE consultation_id IS NOT NULL)
ORDER BY c.scheduled_at LIMIT 1;


-- ═══════════════════════════════════════════════════════════════════════
-- EXPECTED AI PREDICTIONS AFTER THIS DATA
-- ═══════════════════════════════════════════════════════════════════════
--
-- Patient           | Expected        | Key signals
-- ──────────────────┼─────────────────┼────────────────────────────────────
-- Feryel Mghirbi    | ACTIVE          | -4kg weight trend, high rating 5/5, low stress, recent visits
-- chaima bdr        | DISCOURAGED     | +1.2kg weight gain, rating 2/5, high stress 5, cancelled
-- Fares Matri       | ACTIVE          | -0.5kg trend, rating 4/5, improving symptoms
-- Amira Ben Salem   | HEALED          | goals achieved, stable weight, 5/5 rating, 39 days since last visit
-- Mohamed Bouazizi  | DISCOURAGED     | +1kg weight, BP worsening, 1/5 rating, 57 days since last visit
-- Khalil Chaabane   | AT RISK         | +0.5kg, 48 days gap, 3/5 rating, stopped tracking
-- ═══════════════════════════════════════════════════════════════════════
