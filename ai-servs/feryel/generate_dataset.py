"""
Generate a synthetic dataset (15,000 rows) for training two models:
  1. Consultation Volume Prediction — will patient book within 14 days?
  2. Dropout Risk Classification   — active / discouraged / healed

Features mirror real PeakWell DB columns:
  BiometricEntry, ConsultationRating, ConsultationFeedback,
  HealthGoal, SymptomEntry, Consultation history.

Labels are logically derived so the trained model learns real-world patterns.
"""

import numpy as np
import pandas as pd
import os

np.random.seed(42)
N = 15_000

# ── 1. Patient demographics ────────────────────────────────────────
age = np.random.randint(18, 65, N)
gender = np.random.choice([0, 1], N)  # 0=F, 1=M

# ── 2. Biometric trends (change over last 3 weeks) ─────────────────
weight_trend = np.round(np.random.normal(0, 2.5, N), 2)        # kg change
bmi_trend = np.round(weight_trend * 0.35 + np.random.normal(0, 0.3, N), 2)
bp_systolic_trend = np.round(np.random.normal(0, 8, N), 1)     # mmHg change
bp_diastolic_trend = np.round(bp_systolic_trend * 0.5 + np.random.normal(0, 3, N), 1)
glucose_trend = np.round(np.random.normal(0, 5, N), 1)         # mg/dL change
body_fat_trend = np.round(np.random.normal(0, 1.5, N), 2)      # % change

# ── 3. Current biometrics (absolute values) ─────────────────────────
weight_current = np.round(np.random.normal(75, 15, N).clip(45, 140), 1)
bmi_current = np.round(np.random.normal(25, 5, N).clip(16, 45), 1)
bp_systolic_current = np.round(np.random.normal(120, 15, N).clip(90, 180), 0)
glucose_current = np.round(np.random.normal(95, 20, N).clip(60, 200), 0)

# ── 4. Consultation history ─────────────────────────────────────────
days_since_last_consultation = np.random.exponential(30, N).clip(1, 180).astype(int)
total_consultations = np.random.poisson(5, N).clip(1, 30)
cancel_rate = np.round(np.random.beta(2, 8, N), 2)  # mostly low cancellation
avg_consultation_gap_days = np.round(np.random.normal(25, 12, N).clip(7, 90), 0)

# ── 5. Satisfaction metrics ─────────────────────────────────────────
avg_rating = np.round(np.random.normal(3.5, 1.0, N).clip(1, 5), 1)
symptoms_improved = np.random.choice([0, 1], N, p=[0.35, 0.65])
advice_followed = np.random.choice([0, 1], N, p=[0.3, 0.7])
would_recommend = np.random.choice([0, 1], N, p=[0.25, 0.75])

# ── 6. Health goals ─────────────────────────────────────────────────
goal_progress_pct = np.round(np.random.beta(3, 3, N) * 100, 1)
goal_achieved = (goal_progress_pct > 85).astype(int)
num_active_goals = np.random.poisson(2, N).clip(0, 6)

# ── 7. Symptoms last 30 days ────────────────────────────────────────
symptom_count_30d = np.random.poisson(3, N).clip(0, 20)
avg_symptom_severity = np.round(np.random.normal(2.5, 1.0, N).clip(1, 5), 1)
avg_mood = np.round(np.random.normal(3.2, 0.9, N).clip(1, 5), 1)
avg_energy = np.round(np.random.normal(3.0, 1.0, N).clip(1, 5), 1)
avg_stress = np.round(np.random.normal(2.8, 1.0, N).clip(1, 5), 1)

# ── 8. Biometric submission frequency (engagement proxy) ───────────
biometric_entries_last_30d = np.random.poisson(8, N).clip(0, 30)

# ═══════════════════════════════════════════════════════════════════
# LABEL GENERATION — logically consistent with features
# ═══════════════════════════════════════════════════════════════════

# ── Label 1: will_book_within_14_days ──────────────────────────────
# Higher probability if: biometrics worsening, more symptoms,
# higher engagement, shorter gap since last, low goal progress

book_score = (
    (weight_trend > 0).astype(float) * 1.5 +                  # gaining weight → needs help
    (bp_systolic_trend > 5).astype(float) * 1.2 +              # BP rising
    (glucose_trend > 5).astype(float) * 1.0 +                  # glucose rising
    (symptom_count_30d > 3).astype(float) * 1.0 +              # symptoms (lowered threshold)
    (avg_symptom_severity > 2.5).astype(float) * 0.8 +         # moderate+ symptoms
    (goal_progress_pct < 50).astype(float) * 0.7 +             # still working on goal
    (goal_progress_pct > 20).astype(float) * 0.5 +             # has made some progress → engaged
    (biometric_entries_last_30d > 3).astype(float) * 0.5 +     # still tracking
    (days_since_last_consultation < 20).astype(float) * 0.8 +  # recent visitor (boosted)
    (avg_rating >= 3.5).astype(float) * 0.5 +                  # trusts the dietitian
    (avg_mood < 3.5).astype(float) * 0.4 +                     # not feeling great → needs help
    (goal_achieved == 1).astype(float) * -1.5 +                # healed → no longer needs to come
    (goal_progress_pct > 85).astype(float) * -1.0 +            # near/at goal → less urgent
    np.random.normal(0, 1.2, N)                                 # reduced noise
)

book_prob = 1 / (1 + np.exp(-0.5 * (book_score - 3)))
will_book_within_14_days = (np.random.random(N) < book_prob).astype(int)

# ── Label 2: dropout_type ─────────────────────────────────────────
# 0 = active (still engaged)
# 1 = dropout_discouraged (bad biometrics + low satisfaction)
# 2 = dropout_healed (good biometrics + goals achieved)

discouraged_score = (
    (days_since_last_consultation > 40).astype(float) * 2.0 +
    (avg_rating < 2.5).astype(float) * 2.0 +
    (goal_progress_pct < 25).astype(float) * 1.5 +
    (symptoms_improved == 0).astype(float) * 1.0 +
    (advice_followed == 0).astype(float) * 1.0 +
    (weight_trend > 1).astype(float) * 0.8 +
    (avg_mood < 2.5).astype(float) * 0.8 +
    (avg_energy < 2.5).astype(float) * 0.6 +
    (biometric_entries_last_30d < 3).astype(float) * 1.0 +
    np.random.normal(0, 1.2, N)
)

healed_score = (
    (days_since_last_consultation > 35).astype(float) * 1.5 +
    (avg_rating >= 4.2).astype(float) * 2.0 +           # FIX: was > 4.0, needs 4.2+
    (goal_achieved == 1).astype(float) * 3.0 +           # strong healed signal
    (goal_progress_pct > 80).astype(float) * 2.0 +
    (symptoms_improved == 1).astype(float) * 1.0 +
    (weight_trend < -0.3).astype(float) * 0.5 +
    (bp_systolic_trend < -3).astype(float) * 0.4 +
    (avg_mood > 4.0).astype(float) * 1.0 +
    (avg_stress < 2.0).astype(float) * 0.8 +
    (symptom_count_30d < 3).astype(float) * 0.8 +
    (avg_mood < 3.0).astype(float) * -1.2 +             # bad mood PENALIZES healed
    (avg_stress > 3.5).astype(float) * -1.2 +           # high stress PENALIZES healed
    np.random.normal(0, 1.2, N)
)

active_score = (
    (days_since_last_consultation < 30).astype(float) * 2.0 +
    (days_since_last_consultation < 15).astype(float) * 1.0 +  # bonus very recent
    (biometric_entries_last_30d > 3).astype(float) * 1.2 +
    (total_consultations > 2).astype(float) * 0.6 +
    (goal_progress_pct > 15).astype(float) * 0.8 +             # has goals in progress
    (goal_progress_pct < 85).astype(float) * 0.4 +             # not yet done
    (avg_mood >= 2.0).astype(float) * 0.4 +                    # functional mood
    (avg_mood <= 4.2).astype(float) * 0.4 +                    # not too happy (healed)
    (will_book_within_14_days == 1).astype(float) * 1.5 +
    np.random.normal(0, 1.2, N)
)

scores = np.stack([active_score, discouraged_score, healed_score], axis=1)
dropout_type = np.argmax(scores, axis=1)

# ═══════════════════════════════════════════════════════════════════
# BUILD DATAFRAME & SAVE
# ═══════════════════════════════════════════════════════════════════

df = pd.DataFrame({
    # Demographics
    'age': age,
    'gender': gender,

    # Biometric trends (3-week change)
    'weight_trend': weight_trend,
    'bmi_trend': bmi_trend,
    'bp_systolic_trend': bp_systolic_trend,
    'bp_diastolic_trend': bp_diastolic_trend,
    'glucose_trend': glucose_trend,
    'body_fat_trend': body_fat_trend,

    # Current biometrics
    'weight_current': weight_current,
    'bmi_current': bmi_current,
    'bp_systolic_current': bp_systolic_current,
    'glucose_current': glucose_current,

    # Consultation history
    'days_since_last_consultation': days_since_last_consultation,
    'total_consultations': total_consultations,
    'cancel_rate': cancel_rate,
    'avg_consultation_gap_days': avg_consultation_gap_days,

    # Satisfaction
    'avg_rating': avg_rating,
    'symptoms_improved': symptoms_improved,
    'advice_followed': advice_followed,
    'would_recommend': would_recommend,

    # Goals
    'goal_progress_pct': goal_progress_pct,
    'goal_achieved': goal_achieved,
    'num_active_goals': num_active_goals,

    # Symptoms
    'symptom_count_30d': symptom_count_30d,
    'avg_symptom_severity': avg_symptom_severity,
    'avg_mood': avg_mood,
    'avg_energy': avg_energy,
    'avg_stress': avg_stress,

    # Engagement
    'biometric_entries_last_30d': biometric_entries_last_30d,

    # Labels
    'will_book_within_14_days': will_book_within_14_days,
    'dropout_type': dropout_type,
})

out_path = os.path.join(os.path.dirname(__file__), 'dataset.csv')
df.to_csv(out_path, index=False)

print(f"Dataset saved: {out_path}")
print(f"Shape: {df.shape}")
print(f"\n--- will_book_within_14_days ---")
print(df['will_book_within_14_days'].value_counts())
print(f"\n--- dropout_type ---")
print(f"  0 = active:       {(dropout_type == 0).sum()}")
print(f"  1 = discouraged:  {(dropout_type == 1).sum()}")
print(f"  2 = healed:       {(dropout_type == 2).sum()}")
