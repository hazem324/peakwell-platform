"""
PeakWell AI Model Evaluation
Produces accuracy, classification reports, confusion matrices,
and cross-validation scores for both trained models.

Run:
    python evaluate.py
"""

import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix, roc_auc_score
)

BASE_DIR = os.path.dirname(__file__)

# ── Load data & models ────────────────────────────────────────────────────────
df = pd.read_csv(os.path.join(BASE_DIR, 'dataset.csv'))
booking_model  = joblib.load(os.path.join(BASE_DIR, 'booking_model.pkl'))
dropout_model  = joblib.load(os.path.join(BASE_DIR, 'dropout_model.pkl'))

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

def separator(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def confusion_table(cm, labels):
    print("\nConfusion Matrix:")
    header = "          " + "  ".join(f"{l:>12}" for l in labels)
    print(header)
    for i, row in enumerate(cm):
        print(f"  {labels[i]:>8}  " + "  ".join(f"{v:>12}" for v in row))

# ==============================================================================
# MODEL 1 — Booking Prediction
# ==============================================================================
separator("MODEL 1: Consultation Booking Prediction")

y_book = df['will_book_within_14_days']
X_train, X_test, y_train, y_test = train_test_split(
    X, y_book, test_size=0.2, random_state=42, stratify=y_book
)

y_pred  = booking_model.predict(X_test)
y_proba = booking_model.predict_proba(X_test)[:, 1]

acc  = accuracy_score(y_test, y_pred)
auc  = roc_auc_score(y_test, y_proba)
cm   = confusion_matrix(y_test, y_pred)

print(f"\n  Accuracy  : {acc * 100:.2f}%")
print(f"  ROC-AUC   : {auc:.4f}")

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['No Booking', 'Will Book']))

confusion_table(cm, ['No Booking', 'Will Book'])

# Cross-validation (5-fold)
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(booking_model, X, y_book, cv=cv, scoring='accuracy')
print(f"\n  5-Fold Cross-Validation Accuracy:")
print(f"  Scores : {[f'{s*100:.2f}%' for s in cv_scores]}")
print(f"  Mean   : {cv_scores.mean()*100:.2f}%  ±  {cv_scores.std()*100:.2f}%")

# Feature importance
imp1 = pd.Series(booking_model.feature_importances_, index=FEATURE_COLS)
print("\n  Top 10 Most Important Features:")
for feat, val in imp1.sort_values(ascending=False).head(10).items():
    bar = "#" * int(val * 200)
    print(f"  {feat:<35} {val:.4f}  {bar}")

# ==============================================================================
# MODEL 2 — Dropout Type Classification
# ==============================================================================
separator("MODEL 2: Dropout Type Classification")

y_drop = df['dropout_type']
X_train2, X_test2, y_train2, y_test2 = train_test_split(
    X, y_drop, test_size=0.2, random_state=42, stratify=y_drop
)

y_pred2  = dropout_model.predict(X_test2)
y_proba2 = dropout_model.predict_proba(X_test2)

acc2 = accuracy_score(y_test2, y_pred2)
auc2 = roc_auc_score(y_test2, y_proba2, multi_class='ovr', average='macro')
cm2  = confusion_matrix(y_test2, y_pred2)

print(f"\n  Accuracy  : {acc2 * 100:.2f}%")
print(f"  ROC-AUC   : {auc2:.4f}  (macro OvR)")

print("\nClassification Report:")
print(classification_report(y_test2, y_pred2, target_names=['Active', 'Discouraged', 'Healed']))

confusion_table(cm2, ['Active', 'Discouraged', 'Healed'])

# Cross-validation
cv_scores2 = cross_val_score(dropout_model, X, y_drop, cv=cv, scoring='accuracy')
print(f"\n  5-Fold Cross-Validation Accuracy:")
print(f"  Scores : {[f'{s*100:.2f}%' for s in cv_scores2]}")
print(f"  Mean   : {cv_scores2.mean()*100:.2f}%  ±  {cv_scores2.std()*100:.2f}%")

# Per-class accuracy
print("\n  Per-Class Accuracy:")
labels = ['Active', 'Discouraged', 'Healed']
for i, label in enumerate(labels):
    mask = y_test2 == i
    if mask.sum() > 0:
        class_acc = accuracy_score(y_test2[mask], y_pred2[mask])
        print(f"  {label:<15} {class_acc*100:.2f}%  ({mask.sum()} samples)")

# Feature importance
imp2 = pd.Series(dropout_model.feature_importances_, index=FEATURE_COLS)
print("\n  Top 10 Most Important Features:")
for feat, val in imp2.sort_values(ascending=False).head(10).items():
    bar = "#" * int(val * 200)
    print(f"  {feat:<35} {val:.4f}  {bar}")

# ==============================================================================
# SUMMARY
# ==============================================================================
separator("SUMMARY")
print(f"""
  Dataset size          : {len(df)} samples  |  {len(FEATURE_COLS)} features

  +----------------------------------+-----------+-----------+
  | Model                            | Accuracy  |  ROC-AUC  |
  +----------------------------------+-----------+-----------+
  | Booking Prediction (binary)      | {acc*100:>6.2f}%   |  {auc:.4f}   |
  | Dropout Classification (3-class) | {acc2*100:>6.2f}%   |  {auc2:.4f}   |
  +----------------------------------+-----------+-----------+

  CV Booking  : {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%
  CV Dropout  : {cv_scores2.mean()*100:.2f}% ± {cv_scores2.std()*100:.2f}%

  Note: Models are trained on synthetic data. High accuracy is
  expected. For production, validate against real patient records.
""")
