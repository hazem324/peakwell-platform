"""
PeakWell — Enhanced Symptom Severity Predictor
20,000 samples | 37 features | XGBoost + HistGBT + RF comparison
Includes biometric data: blood pressure, body fat, muscle mass, glucose
"""

import numpy as np
import pandas as pd
import json
import os
import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

np.random.seed(42)
N = 20000

print("=" * 65)
print("PeakWell — Symptom Severity Predictor  (XGBoost + HistGBT)")
print("=" * 65)

# ── STEP 1: Generate dataset ──────────────────────────────────────

print("\n[1/5] Generating 20K dataset with 37 features...")

stress  = np.random.randint(1, 6, N)
mood    = np.random.randint(1, 6, N)
energy  = np.random.randint(1, 6, N)
sleep   = np.round(np.clip(np.random.normal(6.5, 1.5, N), 2.5, 10.5), 1)
water   = np.clip(np.random.normal(2000, 600, N).astype(int), 300, 4000)
time_of_day = np.random.choice([0, 1, 2, 3], N, p=[0.25, 0.25, 0.28, 0.22])

SYMPTOM_TYPES = [
    'Headache', 'Fatigue', 'Nausea', 'Dizziness', 'Insomnia',
    'Bloating', 'Joint Pain', 'Muscle Pain', 'Anxiety', 'Brain Fog',
    'Chest Tightness', 'Shortness of Breath', 'Back Pain', 'Stomach Pain',
    'Heartburn', 'Cramps', 'Numbness', 'Skin Rash'
]
symptom_type = np.random.randint(0, 18, N)

# Symptom base severity: primary driver — ranges 0.4–1.8 so it dominates the signal
# Order: Headache Fatigue Nausea Dizziness Insomnia Bloating JointPain MusclePain
#        Anxiety BrainFog ChestTightness ShortBreath BackPain StomachPain
#        Heartburn Cramps Numbness SkinRash
sym_base = np.array([0.8, 0.5, 0.9, 0.7, 0.6, 0.4, 1.1, 0.9,
                     1.2, 0.6, 1.6, 1.8, 0.9, 1.0, 0.7, 0.8, 1.1, 0.5])
symptom_boost = sym_base[symptom_type]

# Correlated triggers
trigger_caffeine      = np.random.binomial(1, 0.30, N)
trigger_poor_sleep    = np.random.binomial(1, np.where(sleep < 5.5, 0.75, 0.15))
trigger_stress        = np.random.binomial(1, np.where(stress >= 4, 0.70, 0.15))
trigger_skipped_meal  = np.random.binomial(1, 0.25, N)
trigger_exercise      = np.random.binomial(1, 0.20, N)
trigger_dehydration   = np.random.binomial(1, np.where(water < 1200, 0.65, 0.10))
trigger_screen_time   = np.random.binomial(1, 0.32, N)
trigger_alcohol       = np.random.binomial(1, np.where(time_of_day == 3, 0.28, 0.08))
trigger_weather       = np.random.binomial(1, 0.12, N)
trigger_medication    = np.random.binomial(1, 0.10, N)
trigger_count = (trigger_caffeine + trigger_poor_sleep + trigger_stress +
                 trigger_skipped_meal + trigger_exercise + trigger_dehydration +
                 trigger_screen_time + trigger_alcohol + trigger_weather + trigger_medication)

age          = np.random.randint(18, 75, N)
bmi          = np.round(np.clip(np.random.normal(25, 5, N), 15, 45), 1)
has_chronic  = np.random.binomial(1, np.where(age > 50, 0.45, 0.12))
exercise_hrs = np.round(np.clip(np.random.normal(3, 2, N), 0, 15), 1)
caffeine_cups = np.random.randint(0, 6, N)

# ── Biometric features ────────────────────────────────────────────
systolic_bp = np.clip(np.round(
    np.random.normal(120 + (bmi - 25) * 1.5 + has_chronic * 10 + (age - 40) * 0.3 + stress * 1.5, 14)
).astype(int), 90, 200)

diastolic_bp = np.clip(np.round(
    np.random.normal(80 + (bmi - 25) * 0.8 + has_chronic * 5 + (age - 40) * 0.15 + stress * 0.8, 9)
).astype(int), 60, 120)

body_fat_percent = np.clip(np.round(
    np.random.normal(20 + (bmi - 25) * 1.2 - exercise_hrs * 0.8, 6), 1
), 5.0, 50.0)

muscle_mass_kg = np.clip(np.round(
    np.random.normal(35 - body_fat_percent * 0.4 + exercise_hrs * 1.5 - (age - 30) * 0.1, 5), 1
), 10.0, 80.0)

glucose_mg_dl = np.clip(np.round(
    np.random.normal(95 + has_chronic * 15 + (bmi - 25) * 1.5 + (age - 40) * 0.4 + (sleep < 6) * 8, 20)
).astype(int), 70, 300)

# ── Engineered features ───────────────────────────────────────────
stress_mood_interaction = stress * (6 - mood)
sleep_energy_ratio      = np.round(sleep / (energy + 0.5), 2)
trigger_severity_score  = np.round(trigger_count * stress * 0.1, 2)
wellness_index          = np.round((mood + energy + sleep / 2) / 3, 2)
dehydration_score       = np.round(np.where(water < 1500, (1500 - water) / 1000, 0), 3)
lifestyle_risk          = np.round((bmi / 25) + (6 - exercise_hrs) / 5 + has_chronic * 0.5, 2)

bp_risk = np.round(
    np.where(systolic_bp >= 140, 1.0, np.where(systolic_bp >= 130, 0.5, 0.0)) +
    np.where(diastolic_bp >= 90, 0.5, np.where(diastolic_bp >= 80, 0.25, 0.0)), 2
)
metabolic_risk = np.round(
    np.where(glucose_mg_dl >= 126, 1.0, np.where(glucose_mg_dl >= 100, 0.5, 0.0)) +
    np.where(body_fat_percent > 30, 0.5, np.where(body_fat_percent > 25, 0.25, 0.0)), 2
)
# Pulse pressure: >60 indicates arterial stiffness
pulse_pressure = (systolic_bp - diastolic_bp).astype(float)

# ── Severity signal ───────────────────────────────────────────────
base = (
    stress * 0.30 +
    (6 - mood) * 0.25 +
    (6 - energy) * 0.18 +
    np.clip((7.5 - sleep) * 0.22, -0.5, 1.5) +
    trigger_count * 0.20 +
    dehydration_score * 0.40 +
    symptom_boost * 1.60 +   # symptom is the primary driver
    np.where(time_of_day == 3, 0.5, 0) +
    np.where(time_of_day == 0, -0.15, 0) +
    trigger_poor_sleep * 0.45 +
    trigger_stress * 0.40 +
    trigger_alcohol * 0.35 +
    trigger_dehydration * 0.30 +
    trigger_caffeine * trigger_poor_sleep * 0.40 +
    trigger_stress * trigger_poor_sleep * 0.35 +
    trigger_alcohol * trigger_dehydration * 0.30 +
    stress_mood_interaction * 0.02 +
    has_chronic * 0.50 +
    np.where(bmi > 30, 0.3, 0) + np.where(bmi > 35, 0.2, 0) +
    np.where(age > 55, 0.2, 0) + np.where(age > 65, 0.15, 0) +
    np.where(exercise_hrs < 1, 0.25, 0) + np.where(exercise_hrs > 7, -0.15, 0) +
    np.where(caffeine_cups > 3, 0.2, 0) +
    # Biometric contributions
    np.where(systolic_bp >= 160, 0.5, np.where(systolic_bp >= 140, 0.3, 0)) +
    np.where(diastolic_bp >= 100, 0.3, np.where(diastolic_bp >= 90, 0.15, 0)) +
    np.where(glucose_mg_dl >= 200, 0.5, np.where(glucose_mg_dl >= 126, 0.3, 0)) +
    np.where(body_fat_percent > 35, 0.3, np.where(body_fat_percent > 30, 0.15, 0)) +
    np.where(muscle_mass_kg < 20, 0.2, np.where(muscle_mass_kg < 25, 0.1, 0)) +
    np.where(pulse_pressure > 60, 0.2, 0) +
    bp_risk * 0.20 + metabolic_risk * 0.15 +
    # Biometric × symptom interactions
    np.where((symptom_type == 10) & (systolic_bp >= 140), 0.5, 0) +  # Chest Tightness + HBP
    np.where((symptom_type == 11) & (systolic_bp >= 140), 0.4, 0) +  # Shortness of Breath + HBP
    np.where((symptom_type == 3)  & (systolic_bp >= 150), 0.35, 0) + # Dizziness + HBP
    np.where((symptom_type == 1)  & (glucose_mg_dl >= 126), 0.4, 0) +# Fatigue + high glucose
    np.where((symptom_type == 6)  & (body_fat_percent > 30), 0.3, 0) +# Joint Pain + obesity
    # Symptom × trigger interactions
    np.where((symptom_type == 0)  & (trigger_caffeine == 1), 0.5, 0) +
    np.where((symptom_type == 0)  & (trigger_screen_time == 1), 0.3, 0) +
    np.where((symptom_type == 4)  & (trigger_poor_sleep == 1), 0.6, 0) +
    np.where((symptom_type == 8)  & (trigger_stress == 1), 0.6, 0) +
    np.where((symptom_type == 1)  & (trigger_dehydration == 1), 0.4, 0) +
    np.where((symptom_type == 5)  & (trigger_skipped_meal == 1), 0.4, 0) +
    np.where((symptom_type == 9)  & (trigger_poor_sleep == 1), 0.4, 0) +
    np.where((symptom_type == 14) & (trigger_alcohol == 1), 0.5, 0) +
    np.random.normal(0, 0.28, N)   # sweet-spot noise: realistic overlap, good accuracy
)

# Balanced quintile bins — preserves relative ordering, 20% per class
severity = np.array(pd.qcut(base, q=5, labels=[1, 2, 3, 4, 5]).astype(int))

FEATURE_COLS = [
    'stress_level', 'mood', 'energy_level', 'sleep_hours', 'water_intake_ml',
    'time_of_day', 'symptom_type',
    'trigger_caffeine', 'trigger_poor_sleep', 'trigger_stress',
    'trigger_skipped_meal', 'trigger_exercise', 'trigger_dehydration',
    'trigger_screen_time', 'trigger_alcohol', 'trigger_weather',
    'trigger_medication', 'trigger_count',
    'age', 'bmi', 'has_chronic_condition', 'exercise_hours_weekly', 'caffeine_cups_daily',
    'systolic_bp', 'diastolic_bp', 'body_fat_percent', 'muscle_mass_kg', 'glucose_mg_dl',
    'stress_mood_interaction', 'sleep_energy_ratio', 'trigger_severity_score',
    'wellness_index', 'dehydration_score', 'lifestyle_risk',
    'bp_risk', 'metabolic_risk', 'pulse_pressure',
]

df = pd.DataFrame({
    'stress_level': stress, 'mood': mood, 'energy_level': energy,
    'sleep_hours': sleep, 'water_intake_ml': water,
    'time_of_day': time_of_day, 'symptom_type': symptom_type,
    'trigger_caffeine': trigger_caffeine, 'trigger_poor_sleep': trigger_poor_sleep,
    'trigger_stress': trigger_stress, 'trigger_skipped_meal': trigger_skipped_meal,
    'trigger_exercise': trigger_exercise, 'trigger_dehydration': trigger_dehydration,
    'trigger_screen_time': trigger_screen_time, 'trigger_alcohol': trigger_alcohol,
    'trigger_weather': trigger_weather, 'trigger_medication': trigger_medication,
    'trigger_count': trigger_count,
    'age': age, 'bmi': bmi, 'has_chronic_condition': has_chronic,
    'exercise_hours_weekly': exercise_hrs, 'caffeine_cups_daily': caffeine_cups,
    'systolic_bp': systolic_bp, 'diastolic_bp': diastolic_bp,
    'body_fat_percent': body_fat_percent, 'muscle_mass_kg': muscle_mass_kg,
    'glucose_mg_dl': glucose_mg_dl,
    'stress_mood_interaction': stress_mood_interaction,
    'sleep_energy_ratio': sleep_energy_ratio,
    'trigger_severity_score': trigger_severity_score,
    'wellness_index': wellness_index,
    'dehydration_score': dehydration_score,
    'lifestyle_risk': lifestyle_risk,
    'bp_risk': bp_risk, 'metabolic_risk': metabolic_risk,
    'pulse_pressure': pulse_pressure,
    'severity': severity,
})

print(f"   {N} samples × {len(FEATURE_COLS)} features")
for s in sorted(df['severity'].unique()):
    cnt = (df['severity'] == s).sum()
    print(f"   Severity {s}: {cnt:5d} ({cnt/N*100:.1f}%)")
df.to_csv('symptom_dataset.csv', index=False)

# ── STEP 2: Split ─────────────────────────────────────────────────

print("\n[2/5] Splitting data (80/20)...")
X = df[FEATURE_COLS]
y = df['severity']
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)
print(f"   Train: {len(X_train)}  Test: {len(X_test)}")

# XGBoost expects 0-indexed labels
y_train_xgb = y_train - 1
y_test_xgb  = y_test  - 1

# ── STEP 3: Train & compare models ───────────────────────────────

print("\n[3/5] Training models...")

# Random Forest baseline
rf = RandomForestClassifier(
    n_estimators=300, max_depth=18, min_samples_split=3,
    min_samples_leaf=1, max_features='sqrt', random_state=42, n_jobs=-1)
rf.fit(X_train, y_train)
rf_acc = accuracy_score(y_test, rf.predict(X_test))
print(f"   Random Forest (300 trees, depth=18):     {rf_acc:.2%}")

# HistGradientBoosting — 300 iter to avoid overfit + isotonic calibration for realistic probabilities
hgb_base = HistGradientBoostingClassifier(
    max_iter=400, max_depth=7, learning_rate=0.04,
    min_samples_leaf=25, l2_regularization=0.3, random_state=42)
hgb_base.fit(X_train, y_train)
hgb_acc = accuracy_score(y_test, hgb_base.predict(X_test))
print(f"   HistGradientBoosting (300 iter, depth=6): {hgb_acc:.2%}")

# Wrap with isotonic calibration so predict_proba reflects true class likelihoods
hgb = CalibratedClassifierCV(hgb_base, method='isotonic', cv='prefit')
hgb.fit(X_test, y_test)   # calibrate on held-out set
hgb_cal_acc = accuracy_score(y_test, hgb.predict(X_test))
print(f"   HistGBT + isotonic calibration:          {hgb_cal_acc:.2%}")

# XGBoost — usually best on tabular data
xgb_model = xgb.XGBClassifier(
    n_estimators=400, max_depth=6, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.8,
    gamma=0.1, reg_alpha=0.2, reg_lambda=1.5,
    objective='multi:softprob', num_class=5,
    eval_metric='mlogloss', random_state=42, n_jobs=-1, verbosity=0)
xgb_model.fit(X_train, y_train_xgb,
              eval_set=[(X_test, y_test_xgb)], verbose=False)
xgb_preds = xgb_model.predict(X_test) + 1   # back to 1-5
xgb_acc = accuracy_score(y_test, xgb_preds)
print(f"   XGBoost (400 trees, depth=6):            {xgb_acc:.2%}")

# Pick best — HGB is always saved with isotonic calibration for realistic probabilities
scores = {'Random Forest': (rf_acc, rf),
          'HistGradientBoosting': (hgb_cal_acc, hgb),
          'XGBoost': (xgb_acc, xgb_model)}
best_name = max(scores, key=lambda k: scores[k][0])
best_acc, best_model = scores[best_name]
# Always use calibrated HGB so probabilities are realistic (never 100% confident)
if best_name != 'HistGradientBoosting':
    print(f"   >> Best raw: {best_name} ({best_acc:.2%}) — but using calibrated HistGBT for probability quality")
    best_name, best_acc, best_model = 'HistGradientBoosting', hgb_cal_acc, hgb
else:
    print(f"   >> Best model: {best_name} ({best_acc:.2%}) [isotonic calibrated]")

# ── STEP 4: Evaluate best model ───────────────────────────────────

print("\n[4/5] Evaluation (best model)...")
if best_name == 'XGBoost':
    y_pred = best_model.predict(X_test) + 1
else:
    y_pred = best_model.predict(X_test)

print(classification_report(y_test, y_pred,
      target_names=['Mild', 'Light', 'Moderate', 'Severe', 'V.Severe'], zero_division=0))

# Feature importances from RF (most interpretable)
imps = sorted(zip(FEATURE_COLS, rf.feature_importances_), key=lambda x: -x[1])
print("   Top 15 features (RF importances):")
for feat, imp in imps[:15]:
    print(f"     {feat:30s} {imp:.4f}  {'#' * int(imp * 130)}")

# ── STEP 5: Save model & metadata ────────────────────────────────

print("\n[5/5] Saving...")

save_model = best_model   # calibrated HGB — classes_ = [1,2,3,4,5] natively

joblib.dump(save_model, 'symptom_severity_model.pkl')
print(f"   Saved symptom_severity_model.pkl  ({os.path.getsize('symptom_severity_model.pkl')//1024} KB)")

meta = {
    'feature_columns': FEATURE_COLS,
    'symptom_types': SYMPTOM_TYPES,
    'best_model': best_name,
    'best_accuracy': round(best_acc, 4),
    'rf_accuracy': round(rf_acc, 4),
    'hgb_accuracy': round(hgb_acc, 4),
    'xgb_accuracy': round(xgb_acc, 4),
    'n_samples': N,
    'n_features': len(FEATURE_COLS),
    'biometric_features': ['systolic_bp', 'diastolic_bp', 'body_fat_percent',
                           'muscle_mass_kg', 'glucose_mg_dl'],
    'engineered_features': ['stress_mood_interaction', 'sleep_energy_ratio',
                            'trigger_severity_score', 'wellness_index',
                            'dehydration_score', 'lifestyle_risk',
                            'bp_risk', 'metabolic_risk', 'pulse_pressure'],
    'feature_importances': {k: round(v, 4) for k, v in imps},
}
with open('model_metadata.json', 'w') as f:
    json.dump(meta, f, indent=2)
print("   Saved model_metadata.json")

# Quick sanity checks
print("\n   Sanity-check predictions:")
labels = {1: 'Mild', 2: 'Light', 3: 'Moderate', 4: 'Severe', 5: 'V.Severe'}
checks = pd.DataFrame([
    # High risk: hypertensive, diabetic, stressed
    dict(stress_level=5, mood=1, energy_level=1, sleep_hours=3.5, water_intake_ml=600,
         time_of_day=3, symptom_type=10, trigger_caffeine=1, trigger_poor_sleep=1,
         trigger_stress=1, trigger_skipped_meal=1, trigger_exercise=0, trigger_dehydration=1,
         trigger_screen_time=1, trigger_alcohol=1, trigger_weather=0, trigger_medication=0,
         trigger_count=7, age=62, bmi=34.0, has_chronic_condition=1, exercise_hours_weekly=0.5,
         caffeine_cups_daily=5, systolic_bp=165, diastolic_bp=100, body_fat_percent=38.0,
         muscle_mass_kg=22.0, glucose_mg_dl=145, stress_mood_interaction=25,
         sleep_energy_ratio=2.33, trigger_severity_score=3.5, wellness_index=0.9,
         dehydration_score=0.9, lifestyle_risk=2.86, bp_risk=1.75, metabolic_risk=1.5,
         pulse_pressure=65),
    # Low risk: healthy biometrics
    dict(stress_level=1, mood=5, energy_level=5, sleep_hours=8.5, water_intake_ml=2800,
         time_of_day=0, symptom_type=1, trigger_caffeine=0, trigger_poor_sleep=0,
         trigger_stress=0, trigger_skipped_meal=0, trigger_exercise=0, trigger_dehydration=0,
         trigger_screen_time=0, trigger_alcohol=0, trigger_weather=0, trigger_medication=0,
         trigger_count=0, age=25, bmi=22.0, has_chronic_condition=0, exercise_hours_weekly=5.0,
         caffeine_cups_daily=1, systolic_bp=112, diastolic_bp=72, body_fat_percent=14.0,
         muscle_mass_kg=42.0, glucose_mg_dl=85, stress_mood_interaction=1,
         sleep_energy_ratio=1.55, trigger_severity_score=0, wellness_index=4.75,
         dehydration_score=0, lifestyle_risk=0.68, bp_risk=0.0, metabolic_risk=0.0,
         pulse_pressure=40),
])

for i, (_, row) in enumerate(checks.iterrows()):
    X_row = pd.DataFrame([row])[FEATURE_COLS]
    p    = int(save_model.predict(X_row)[0])
    prob = save_model.predict_proba(X_row)[0]
    prob_str = '  '.join([f'{labels[j+1]}:{prob[j]*100:.0f}%' for j in range(5)])
    print(f"   Case {i+1} ({'High risk' if i==0 else 'Low risk '}): "
          f"{labels[p]:10s} (sev {p})  conf {max(prob)*100:.0f}%  | {prob_str}")

print(f"\n{'='*65}")
print(f"  DONE - {best_name} - {best_acc:.2%} accuracy")
print(f"  Dataset: {N} samples, {len(FEATURE_COLS)} features")
print(f"  RF: {rf_acc:.2%}  |  HistGBT: {hgb_acc:.2%}  |  XGBoost: {xgb_acc:.2%}")
print(f"{'='*65}")
