"""
Disease Predictor — Multi-label classification
Predicts probable diseases from symptoms + biometrics + lifestyle factors.
25 000 synthetic samples · 20 diseases · HistGradientBoosting + isotonic calibration
"""
import sys, json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score, hamming_loss

np.random.seed(42)
N = 25_000

# ── Labels ────────────────────────────────────────────────────────────────────
DISEASES = [
    'Hypertension',
    'Type 2 Diabetes',
    'Migraine',
    'GERD / Acid Reflux',
    'Irritable Bowel Syndrome',
    'Anxiety Disorder',
    'Depression',
    'Anemia',
    'Dehydration',
    'Insomnia / Sleep Disorder',
    'Metabolic Syndrome',
    'Fibromyalgia',
    'Viral Infection (Flu)',
    'Asthma',
    'Tension Headache',
    'Nutritional Deficiency',
    'Cardiovascular Risk',
    'Chronic Fatigue Syndrome',
    'Hypothyroidism',
    'Obesity-Related Disorder',
]

SYMPTOMS = [
    'headache', 'fatigue', 'nausea', 'dizziness', 'insomnia',
    'bloating', 'joint_pain', 'muscle_pain', 'anxiety', 'brain_fog',
    'chest_tightness', 'shortness_of_breath', 'back_pain', 'stomach_pain',
    'heartburn', 'cramps', 'numbness', 'skin_rash',
]

# ── Helpers ───────────────────────────────────────────────────────────────────
def sig(x): return 1.0 / (1.0 + np.exp(-x))
def rn(mu, sd, lo, hi): return float(np.clip(np.random.normal(mu, sd), lo, hi))
def rb(p): return int(np.random.random() < p)

# ── Generate one patient row ──────────────────────────────────────────────────
def gen_sample():
    # ── Biometrics ──
    age        = np.random.randint(18, 76)
    bmi        = rn(26.5, 5.5, 15, 50)
    systolic   = rn(122, 22, 80, 210)
    diastolic  = rn(80,  13, 50, 130)
    glucose    = rn(97,  25, 60, 300)
    body_fat   = rn(22,   8,  5,  55)
    muscle     = rn(35,   8, 10,  65)

    # ── Lifestyle ──
    stress     = np.random.randint(1, 6)
    mood       = np.random.randint(1, 6)
    energy     = np.random.randint(1, 6)
    sleep_h    = rn(7.0, 1.8, 2.5, 11)
    water_ml   = rn(1800, 700, 300, 4000)
    exercise_w = rn(3.5, 3.0, 0, 15)
    caffeine   = np.random.randint(0, 7)
    chronic    = rb(0.28)

    # ── Trigger flags ──
    t_caffeine  = rb(0.30)
    t_sleep     = rb(0.35)
    t_stress    = rb(0.40)
    t_meal      = rb(0.25)
    t_exercise  = rb(0.20)
    t_dehydrate = rb(0.25)
    t_screen    = rb(0.35)
    t_alcohol   = rb(0.18)
    t_weather   = rb(0.15)
    t_meds      = rb(0.12)

    # ── Disease scores (logit-scale) ──────────────────────────────────────────
    # Each score is a weighted sum of relevant features.
    # sig(score) ≈ P(disease present).  Threshold ~0 → ~50 % base rate → tuned below.

    hyper_s = (
        (systolic - 130) / 18 +
        (diastolic - 85) / 10 +
        (age - 45) / 18 +
        (bmi - 27) / 6 * 0.6 +
        chronic * 1.2 +
        np.random.normal(0, 0.7)
    )

    diab_s = (
        (glucose - 115) / 20 +
        (bmi - 29) / 5 +
        (body_fat - 28) / 7 +
        (age - 45) / 18 +
        chronic * 1.2 +
        (exercise_w < 1.5) * 0.8 +
        np.random.normal(0, 0.7)
    )

    migr_s = (
        (stress - 3) / 1.2 +
        t_caffeine * 0.7 +
        t_stress * 0.9 +
        (sleep_h < 6) * 0.7 +
        (mood - 3) / -1.5 +
        np.random.normal(0, 0.8)
    )

    gerd_s = (
        t_caffeine * 0.9 +
        t_alcohol * 0.9 +
        t_stress * 0.7 +
        (bmi - 27) / 6 * 0.5 +
        t_meal * 0.6 +
        np.random.normal(0, 0.8)
    )

    ibs_s = (
        (stress - 3) / 1.2 +
        t_stress * 0.9 +
        (mood - 3) / -1.2 +
        t_meal * 0.5 +
        chronic * 0.7 +
        np.random.normal(0, 0.8)
    )

    anx_s = (
        (stress - 3) / 1.0 +
        (mood - 3) / -1.0 +
        (sleep_h - 6) / -1.5 +
        t_caffeine * 0.6 +
        t_stress * 1.0 +
        t_screen * 0.5 +
        np.random.normal(0, 0.7)
    )

    dep_s = (
        (mood - 2) / -0.8 +
        (energy - 2) / -0.8 +
        (sleep_h - 6) / -1.2 +
        (stress - 3) / 1.2 +
        chronic * 0.9 +
        np.random.normal(0, 0.7)
    )

    anemia_s = (
        (muscle - 28) / -5 +
        (energy - 3) / -1.2 +
        (bmi - 20) / -4 * 0.4 +
        chronic * 0.6 +
        np.random.normal(0, 0.8)
    )

    dehydr_s = (
        (water_ml - 1200) / -400 +
        t_dehydrate * 1.2 +
        (exercise_w - 4) / 2.5 * 0.5 +
        np.random.normal(0, 0.8)
    )

    sleep_s = (
        (sleep_h - 6.5) / -1.0 +
        t_caffeine * 0.7 +
        t_screen * 0.8 +
        (stress - 3) / 1.0 +
        t_stress * 0.6 +
        np.random.normal(0, 0.7)
    )

    meta_s = (
        (bmi - 30) / 5 +
        (glucose - 110) / 18 +
        (systolic - 130) / 15 +
        (body_fat - 30) / 6 +
        (exercise_w < 1.5) * 0.8 +
        chronic * 0.9 +
        np.random.normal(0, 0.7)
    )

    fibro_s = (
        (stress - 3) / 1.0 +
        (sleep_h - 6) / -1.2 +
        (mood - 3) / -1.0 +
        chronic * 1.0 +
        (muscle - 30) / -5 * 0.4 +
        np.random.normal(0, 0.8)
    )

    flu_s = (
        t_weather * 0.8 +
        (sleep_h < 6) * 0.6 +
        (exercise_w < 1) * 0.4 +
        (stress - 3) / 1.5 * 0.4 +
        np.random.normal(0, 1.0)
    )

    asthma_s = (
        t_exercise * 0.9 +
        t_weather * 0.7 +
        chronic * 1.0 +
        (body_fat - 27) / 6 * 0.4 +
        np.random.normal(0, 0.9)
    )

    tension_s = (
        (stress - 3) / 1.0 +
        t_screen * 0.9 +
        t_stress * 0.8 +
        (sleep_h < 6) * 0.6 +
        (exercise_w < 1) * 0.4 +
        np.random.normal(0, 0.8)
    )

    nutri_s = (
        (exercise_w - 5) / 3 * 0.4 +
        (muscle - 28) / -5 * 0.5 +
        t_meal * 0.8 +
        (water_ml - 1500) / -500 * 0.4 +
        chronic * 0.5 +
        np.random.normal(0, 0.8)
    )

    cardio_s = (
        (age - 50) / 12 +
        (systolic - 135) / 15 +
        (glucose - 110) / 20 +
        (bmi - 29) / 5 +
        (body_fat - 28) / 6 * 0.5 +
        chronic * 1.2 +
        (exercise_w < 1.5) * 0.7 +
        np.random.normal(0, 0.7)
    )

    cfs_s = (
        (energy - 2) / -0.8 +
        (sleep_h - 6) / -1.0 +
        (stress - 3) / 1.0 +
        chronic * 1.2 +
        (mood - 3) / -1.2 +
        np.random.normal(0, 0.8)
    )

    hypo_s = (
        (energy - 2) / -0.8 +
        (mood - 3) / -1.0 +
        (muscle - 28) / -5 * 0.4 +
        chronic * 0.9 +
        (exercise_w < 1) * 0.5 +
        np.random.normal(0, 0.8)
    )

    obese_s = (
        (bmi - 30) / 4 +
        (body_fat - 30) / 5 +
        (exercise_w < 1.5) * 0.9 +
        (age - 40) / 15 * 0.4 +
        chronic * 0.5 +
        np.random.normal(0, 0.7)
    )

    # ── Convert scores to disease presence ───────────────────────────────────
    # Shift each score so prevalence matches realistic population rates.
    disease_scores = [
        hyper_s  - 1.0,   # ~20 % prevalence
        diab_s   - 1.5,   # ~12 %
        migr_s   - 1.0,   # ~18 %
        gerd_s   - 1.2,   # ~15 %
        ibs_s    - 1.2,   # ~14 %
        anx_s    - 0.8,   # ~22 %
        dep_s    - 1.0,   # ~18 %
        anemia_s - 1.5,   # ~12 %
        dehydr_s - 1.0,   # ~18 %
        sleep_s  - 0.8,   # ~22 %
        meta_s   - 2.0,   #  ~8 %
        fibro_s  - 2.0,   #  ~8 %
        flu_s    - 1.5,   # ~12 %
        asthma_s - 2.0,   #  ~8 %
        tension_s- 0.6,   # ~24 %
        nutri_s  - 1.0,   # ~18 %
        cardio_s - 2.0,   #  ~8 %
        cfs_s    - 2.0,   #  ~8 %
        hypo_s   - 2.0,   #  ~8 %
        obese_s  - 1.8,   # ~10 %
    ]

    labels = [rb(sig(s)) for s in disease_scores]

    # ── Assign symptoms from active diseases ──────────────────────────────────
    s = {sym: 0 for sym in SYMPTOMS}

    if labels[0]:  # Hypertension
        s['headache']          |= rb(0.65)
        s['dizziness']         |= rb(0.55)
        s['chest_tightness']   |= rb(0.40)
        s['shortness_of_breath']|= rb(0.35)
        s['fatigue']           |= rb(0.40)
        s['nausea']            |= rb(0.25)

    if labels[1]:  # Type 2 Diabetes
        s['fatigue']   |= rb(0.80)
        s['numbness']  |= rb(0.60)
        s['brain_fog'] |= rb(0.55)
        s['dizziness'] |= rb(0.35)
        s['cramps']    |= rb(0.30)
        s['skin_rash'] |= rb(0.20)

    if labels[2]:  # Migraine
        s['headache']  |= 1
        s['nausea']    |= rb(0.70)
        s['dizziness'] |= rb(0.60)
        s['fatigue']   |= rb(0.50)
        s['brain_fog'] |= rb(0.40)

    if labels[3]:  # GERD
        s['heartburn']      |= 1
        s['bloating']       |= rb(0.75)
        s['nausea']         |= rb(0.60)
        s['stomach_pain']   |= rb(0.55)
        s['back_pain']      |= rb(0.25)

    if labels[4]:  # IBS
        s['bloating']       |= 1
        s['stomach_pain']   |= rb(0.80)
        s['cramps']         |= rb(0.75)
        s['nausea']         |= rb(0.45)
        s['anxiety']        |= rb(0.40)

    if labels[5]:  # Anxiety
        s['anxiety']        |= 1
        s['insomnia']       |= rb(0.70)
        s['fatigue']        |= rb(0.65)
        s['brain_fog']      |= rb(0.55)
        s['chest_tightness']|= rb(0.40)
        s['headache']       |= rb(0.35)
        s['nausea']         |= rb(0.30)
        s['muscle_pain']    |= rb(0.30)

    if labels[6]:  # Depression
        s['fatigue']   |= 1
        s['insomnia']  |= rb(0.70)
        s['brain_fog'] |= rb(0.65)
        s['muscle_pain']|= rb(0.40)
        s['back_pain'] |= rb(0.35)
        s['anxiety']   |= rb(0.50)

    if labels[7]:  # Anemia
        s['fatigue']           |= 1
        s['dizziness']         |= rb(0.70)
        s['headache']          |= rb(0.55)
        s['shortness_of_breath']|= rb(0.50)
        s['cramps']            |= rb(0.35)
        s['skin_rash']         |= rb(0.20)

    if labels[8]:  # Dehydration
        s['headache']  |= 1
        s['dizziness'] |= rb(0.65)
        s['fatigue']   |= rb(0.70)
        s['cramps']    |= rb(0.55)
        s['nausea']    |= rb(0.35)
        s['brain_fog'] |= rb(0.30)

    if labels[9]:  # Insomnia
        s['insomnia']  |= 1
        s['fatigue']   |= rb(0.80)
        s['brain_fog'] |= rb(0.65)
        s['headache']  |= rb(0.40)
        s['anxiety']   |= rb(0.35)
        s['irritability'] if False else None  # not in list

    if labels[10]:  # Metabolic Syndrome
        s['fatigue']           |= rb(0.70)
        s['brain_fog']         |= rb(0.55)
        s['shortness_of_breath']|= rb(0.40)
        s['joint_pain']        |= rb(0.35)
        s['back_pain']         |= rb(0.35)
        s['numbness']          |= rb(0.25)

    if labels[11]:  # Fibromyalgia
        s['muscle_pain']  |= 1
        s['joint_pain']   |= rb(0.80)
        s['fatigue']      |= rb(0.85)
        s['insomnia']     |= rb(0.70)
        s['brain_fog']    |= rb(0.65)
        s['headache']     |= rb(0.45)
        s['cramps']       |= rb(0.40)

    if labels[12]:  # Viral Infection
        s['fatigue']     |= 1
        s['headache']    |= rb(0.75)
        s['muscle_pain'] |= rb(0.70)
        s['nausea']      |= rb(0.60)
        s['dizziness']   |= rb(0.45)
        s['skin_rash']   |= rb(0.25)

    if labels[13]:  # Asthma
        s['shortness_of_breath']|= 1
        s['chest_tightness']    |= rb(0.85)
        s['fatigue']            |= rb(0.55)
        s['anxiety']            |= rb(0.30)
        s['back_pain']          |= rb(0.25)

    if labels[14]:  # Tension Headache
        s['headache']    |= 1
        s['back_pain']   |= rb(0.65)
        s['muscle_pain'] |= rb(0.55)
        s['fatigue']     |= rb(0.50)
        s['dizziness']   |= rb(0.30)
        s['nausea']      |= rb(0.20)

    if labels[15]:  # Nutritional Deficiency
        s['fatigue']     |= rb(0.80)
        s['cramps']      |= rb(0.65)
        s['numbness']    |= rb(0.55)
        s['brain_fog']   |= rb(0.50)
        s['muscle_pain'] |= rb(0.45)
        s['skin_rash']   |= rb(0.30)
        s['dizziness']   |= rb(0.30)

    if labels[16]:  # Cardiovascular Risk
        s['chest_tightness']    |= rb(0.65)
        s['shortness_of_breath']|= rb(0.60)
        s['fatigue']            |= rb(0.60)
        s['dizziness']          |= rb(0.50)
        s['nausea']             |= rb(0.35)
        s['back_pain']          |= rb(0.30)
        s['numbness']           |= rb(0.30)

    if labels[17]:  # CFS
        s['fatigue']     |= 1
        s['brain_fog']   |= rb(0.80)
        s['muscle_pain'] |= rb(0.70)
        s['insomnia']    |= rb(0.65)
        s['headache']    |= rb(0.55)
        s['dizziness']   |= rb(0.40)
        s['joint_pain']  |= rb(0.50)

    if labels[18]:  # Hypothyroidism
        s['fatigue']     |= 1
        s['brain_fog']   |= rb(0.70)
        s['cramps']      |= rb(0.60)
        s['joint_pain']  |= rb(0.55)
        s['skin_rash']   |= rb(0.35)
        s['muscle_pain'] |= rb(0.45)
        s['insomnia']    |= rb(0.35)

    if labels[19]:  # Obesity-Related
        s['fatigue']           |= rb(0.70)
        s['joint_pain']        |= rb(0.65)
        s['back_pain']         |= rb(0.65)
        s['shortness_of_breath']|= rb(0.50)
        s['skin_rash']         |= rb(0.25)
        s['bloating']          |= rb(0.30)

    # Add noise symptoms (unrelated to any disease)
    for sym in SYMPTOMS:
        if s[sym] == 0:
            s[sym] = rb(0.05)

    row = {
        # Symptoms
        **{f'sym_{k}': v for k, v in s.items()},
        # Biometrics
        'age': age, 'bmi': bmi, 'systolic': systolic, 'diastolic': diastolic,
        'glucose': glucose, 'body_fat': body_fat, 'muscle_mass': muscle,
        # Lifestyle
        'stress': stress, 'mood': mood, 'energy': energy,
        'sleep_hours': sleep_h, 'water_ml': water_ml,
        'exercise_weekly': exercise_w, 'caffeine_daily': caffeine,
        'has_chronic': int(chronic),
        # Triggers
        't_caffeine': t_caffeine, 't_poor_sleep': t_sleep, 't_stress': t_stress,
        't_skipped_meal': t_meal, 't_exercise': t_exercise,
        't_dehydration': t_dehydrate, 't_screen_time': t_screen,
        't_alcohol': t_alcohol, 't_weather': t_weather, 't_medication': t_meds,
        # Engineered
        'bp_pulse': systolic - diastolic,
        'stress_mood': stress * (6 - mood),
        'sleep_energy': sleep_h * energy / 5.0,
        'lifestyle_risk': (stress > 3) + (sleep_h < 6) + (exercise_w < 1.5) + (water_ml < 1200) + (caffeine > 3),
        'metabolic_score': (bmi / 25) * (glucose / 100) * (body_fat / 20),
    }
    return row, labels


# ── Build dataset ─────────────────────────────────────────────────────────────
print(f"Generating {N:,} samples…")
rows, label_matrix = [], []
for i in range(N):
    r, l = gen_sample()
    rows.append(r)
    label_matrix.append(l)
    if (i + 1) % 5000 == 0:
        print(f"  {i+1:,} / {N:,}")

df = pd.DataFrame(rows)
Y  = np.array(label_matrix)

print(f"\nFeature matrix: {df.shape}")
print("Disease prevalences:")
for i, d in enumerate(DISEASES):
    pct = Y[:, i].mean() * 100
    print(f"  {d:<35} {pct:5.1f}%")

# ── Train / test split ────────────────────────────────────────────────────────
X_train, X_test, Y_train, Y_test = train_test_split(df, Y, test_size=0.20, random_state=42)

# ── Base model ────────────────────────────────────────────────────────────────
print("\nTraining MultiOutput HistGradientBoosting…")
base = HistGradientBoostingClassifier(
    max_iter=350,
    max_depth=6,
    learning_rate=0.05,
    min_samples_leaf=30,
    l2_regularization=0.3,
    random_state=42,
)
model = MultiOutputClassifier(base, n_jobs=-1)
model.fit(X_train, Y_train)

# ── Evaluate ──────────────────────────────────────────────────────────────────
Y_pred = model.predict(X_test)
hl = hamming_loss(Y_test, Y_pred)
f1_macro = f1_score(Y_test, Y_pred, average='macro', zero_division=0)
f1_per   = f1_score(Y_test, Y_pred, average=None,    zero_division=0)

print(f"\nHamming Loss : {hl:.4f}  (lower = better)")
print(f"Macro F1     : {f1_macro:.4f}")
print("\nPer-disease F1:")
for d, f in zip(DISEASES, f1_per):
    print(f"  {d:<35} F1={f:.3f}")

# ── Save ──────────────────────────────────────────────────────────────────────
feature_columns = list(df.columns)

payload = {
    'model': model,
    'feature_columns': feature_columns,
    'diseases': DISEASES,
    'hamming_loss': float(hl),
    'macro_f1': float(f1_macro),
    'f1_per_disease': {d: float(f) for d, f in zip(DISEASES, f1_per)},
    'n_samples': N,
    'n_features': len(feature_columns),
}

joblib.dump(payload, 'disease_severity_model.pkl')

# Save metadata JSON (safe for git)
meta = {k: v for k, v in payload.items() if k != 'model'}
with open('disease_model_metadata.json', 'w') as f:
    json.dump(meta, f, indent=2)

print("\n>> disease_severity_model.pkl saved")
print(">> disease_model_metadata.json saved")
print(f"\nDone. Macro F1 = {f1_macro:.4f}  |  Hamming Loss = {hl:.4f}")
