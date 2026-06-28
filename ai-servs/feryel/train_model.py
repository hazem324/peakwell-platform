"""
Train two Random Forest models on the PeakWell consultation dataset:
  1. booking_model.pkl  — predicts will_book_within_14_days (binary)
  2. dropout_model.pkl  — predicts dropout_type (0=active, 1=discouraged, 2=healed)

Outputs:
  - Trained model files (.pkl)
  - Classification reports
  - Feature importance rankings
"""

import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

BASE_DIR = os.path.dirname(__file__)

# ═══════════════════════════════════════════════════════════════════
# 1. LOAD DATA
# ═══════════════════════════════════════════════════════════════════

df = pd.read_csv(os.path.join(BASE_DIR, 'dataset.csv'))
print(f"Loaded {len(df)} rows, {len(df.columns)} columns\n")

FEATURE_COLS = [
    'age', 'gender',
    'weight_trend', 'bmi_trend', 'bp_systolic_trend', 'bp_diastolic_trend',
    'glucose_trend', 'body_fat_trend',
    'weight_current', 'bmi_current', 'bp_systolic_current', 'glucose_current',
    'days_since_last_consultation', 'total_consultations', 'cancel_rate',
    'avg_consultation_gap_days',
    'avg_rating', 'symptoms_improved', 'advice_followed', 'would_recommend',
    'goal_progress_pct', 'goal_achieved', 'num_active_goals',
    'symptom_count_30d', 'avg_symptom_severity', 'avg_mood', 'avg_energy',
    'avg_stress',
    'biometric_entries_last_30d',
]

X = df[FEATURE_COLS]

# ═══════════════════════════════════════════════════════════════════
# 2. TRAIN MODEL 1 — Booking Prediction
# ═══════════════════════════════════════════════════════════════════

print("=" * 60)
print("MODEL 1: Consultation Booking Prediction")
print("=" * 60)

y_book = df['will_book_within_14_days']
X_train, X_test, y_train, y_test = train_test_split(X, y_book, test_size=0.2, random_state=42)

booking_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    min_samples_split=10,
    min_samples_leaf=5,
    random_state=42,
    n_jobs=-1,
)
booking_model.fit(X_train, y_train)

y_pred = booking_model.predict(X_test)
print(f"\nAccuracy: {accuracy_score(y_test, y_pred):.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['No Booking', 'Will Book']))

# Feature importance
importances = pd.Series(booking_model.feature_importances_, index=FEATURE_COLS)
print("\nTop 10 Features (Booking Prediction):")
print(importances.sort_values(ascending=False).head(10).to_string())

# Save
booking_path = os.path.join(BASE_DIR, 'booking_model.pkl')
joblib.dump(booking_model, booking_path)
print(f"\nModel saved: {booking_path}")

# ═══════════════════════════════════════════════════════════════════
# 3. TRAIN MODEL 2 — Dropout Type Classification
# ═══════════════════════════════════════════════════════════════════

print("\n" + "=" * 60)
print("MODEL 2: Dropout Type Classification")
print("=" * 60)

y_drop = df['dropout_type']
X_train2, X_test2, y_train2, y_test2 = train_test_split(X, y_drop, test_size=0.2, random_state=42)

dropout_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=8,
    min_samples_leaf=4,
    random_state=42,
    n_jobs=-1,
)
dropout_model.fit(X_train2, y_train2)

y_pred2 = dropout_model.predict(X_test2)
print(f"\nAccuracy: {accuracy_score(y_test2, y_pred2):.4f}")
print("\nClassification Report:")
print(classification_report(y_test2, y_pred2, target_names=['Active', 'Discouraged', 'Healed']))

# Feature importance
importances2 = pd.Series(dropout_model.feature_importances_, index=FEATURE_COLS)
print("\nTop 10 Features (Dropout Classification):")
print(importances2.sort_values(ascending=False).head(10).to_string())

# Save
dropout_path = os.path.join(BASE_DIR, 'dropout_model.pkl')
joblib.dump(dropout_model, dropout_path)
print(f"\nModel saved: {dropout_path}")

# ═══════════════════════════════════════════════════════════════════
# 4. SAVE FEATURE LIST
# ═══════════════════════════════════════════════════════════════════

features_path = os.path.join(BASE_DIR, 'features.txt')
with open(features_path, 'w') as f:
    f.write('\n'.join(FEATURE_COLS))
print(f"\nFeature list saved: {features_path}")

print("\nTraining complete!")
