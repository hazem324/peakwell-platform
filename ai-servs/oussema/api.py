"""
PeakWell — Symptom AI  FastAPI microservice
Run:  uvicorn api:app --host 0.0.0.0 --port 8000 --reload
"""

import json
import math
from pathlib import Path
from typing import List, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Startup ───────────────────────────────────────────────────────

app = FastAPI(title="PeakWell Symptom AI", version="2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

model = joblib.load("symptom_severity_model.pkl")
with open("model_metadata.json") as f:
    META = json.load(f)

# ── Disease model (loaded lazily so the API starts even if not trained yet) ──
_disease_payload = None

def _load_disease_model():
    global _disease_payload
    if _disease_payload is None and Path("disease_severity_model.pkl").exists():
        _disease_payload = joblib.load("disease_severity_model.pkl")
    return _disease_payload

FEATURE_COLS   = META["feature_columns"]
SYMPTOM_TYPES  = META["symptom_types"]
SEVERITY_LABELS = {1: "Mild", 2: "Light", 3: "Moderate", 4: "Severe", 5: "Very Severe"}
TIME_MAP = {"morning": 0, "afternoon": 1, "evening": 2, "night": 3}
TRIGGER_KEYS = [
    "caffeine", "poor_sleep", "stress", "skipped_meal", "exercise",
    "dehydration", "screen_time", "alcohol", "weather", "medication",
]
# Map Angular display names → internal keys
TRIGGER_INPUT_MAP = {
    "Caffeine": "caffeine", "Poor sleep": "poor_sleep", "Stress": "stress",
    "Skipped meal": "skipped_meal", "Exercise": "exercise", "Dehydration": "dehydration",
    "Screen time": "screen_time", "Alcohol": "alcohol", "Weather": "weather",
    "Medication": "medication",
}

# ── Request / Response schemas ─────────────────────────────────────

class PredictionRequest(BaseModel):
    stressLevel: int = 3
    mood: int = 3
    energyLevel: int = 3
    sleepHours: float = 7.0
    waterIntakeMl: int = 2000
    timeOfDay: str = "morning"
    symptoms: List[str]
    triggers: List[str] = []
    age: int = 30
    bmi: float = 24.0
    hasChronicCondition: bool = False
    exerciseHoursWeekly: float = 3.0
    caffeineCupsDaily: int = 2
    # Biometric fields — None means user hasn't recorded them yet; defaults are healthy baselines
    systolicBp: Optional[float] = None
    diastolicBp: Optional[float] = None
    bodyFatPercent: Optional[float] = None
    muscleMassKg: Optional[float] = None
    glucoseMgDl: Optional[float] = None

# ── Feature engineering ────────────────────────────────────────────

def _build_row(req: PredictionRequest, symptom: str) -> dict:
    stress        = req.stressLevel
    mood          = req.mood
    energy        = req.energyLevel
    sleep         = req.sleepHours
    water         = req.waterIntakeMl
    tod           = TIME_MAP.get(req.timeOfDay.lower(), 0)
    sym_idx       = SYMPTOM_TYPES.index(symptom) if symptom in SYMPTOM_TYPES else 0
    bmi           = req.bmi
    age           = req.age
    has_chronic   = int(req.hasChronicCondition)
    exercise_hrs  = req.exerciseHoursWeekly
    caffeine_cups = req.caffeineCupsDaily

    # Biometric defaults (healthy baseline used when user hasn't entered data)
    systolic  = req.systolicBp    if req.systolicBp    is not None else 120.0
    diastolic = req.diastolicBp   if req.diastolicBp   is not None else 80.0
    body_fat  = req.bodyFatPercent if req.bodyFatPercent is not None else 20.0
    muscle    = req.muscleMassKg   if req.muscleMassKg   is not None else 35.0
    glucose   = req.glucoseMgDl    if req.glucoseMgDl    is not None else 90.0

    # Trigger binary flags
    active = {TRIGGER_INPUT_MAP.get(t, t.lower().replace(" ", "_")) for t in req.triggers}
    trig   = {k: int(k in active) for k in TRIGGER_KEYS}
    tc     = sum(trig.values())

    # Engineered
    stress_mood   = stress * (6 - mood)
    sleep_energy  = round(sleep / (energy + 0.5), 2)
    trig_sev      = round(tc * stress * 0.1, 2)
    wellness      = round((mood + energy + sleep / 2) / 3, 2)
    dehydration   = round((1500 - water) / 1000, 3) if water < 1500 else 0.0
    lf_risk       = round((bmi / 25) + (6 - exercise_hrs) / 5 + has_chronic * 0.5, 2)
    bp_risk       = round(
        (1.0 if systolic >= 140 else 0.5 if systolic >= 130 else 0.0) +
        (0.5 if diastolic >= 90 else 0.25 if diastolic >= 80 else 0.0), 2)
    metab_risk    = round(
        (1.0 if glucose >= 126 else 0.5 if glucose >= 100 else 0.0) +
        (0.5 if body_fat > 30 else 0.25 if body_fat > 25 else 0.0), 2)
    pulse_pressure = round(systolic - diastolic, 1)

    return {
        "stress_level": stress, "mood": mood, "energy_level": energy,
        "sleep_hours": sleep, "water_intake_ml": water,
        "time_of_day": tod, "symptom_type": sym_idx,
        "trigger_caffeine": trig["caffeine"], "trigger_poor_sleep": trig["poor_sleep"],
        "trigger_stress": trig["stress"], "trigger_skipped_meal": trig["skipped_meal"],
        "trigger_exercise": trig["exercise"], "trigger_dehydration": trig["dehydration"],
        "trigger_screen_time": trig["screen_time"], "trigger_alcohol": trig["alcohol"],
        "trigger_weather": trig["weather"], "trigger_medication": trig["medication"],
        "trigger_count": tc,
        "age": age, "bmi": bmi, "has_chronic_condition": has_chronic,
        "exercise_hours_weekly": exercise_hrs, "caffeine_cups_daily": caffeine_cups,
        "systolic_bp": systolic, "diastolic_bp": diastolic,
        "body_fat_percent": body_fat, "muscle_mass_kg": muscle,
        "glucose_mg_dl": glucose,
        "stress_mood_interaction": stress_mood, "sleep_energy_ratio": sleep_energy,
        "trigger_severity_score": trig_sev, "wellness_index": wellness,
        "dehydration_score": dehydration, "lifestyle_risk": lf_risk,
        "bp_risk": bp_risk, "metabolic_risk": metab_risk,
        "pulse_pressure": pulse_pressure,
    }

# ── Risk factor analysis ───────────────────────────────────────────

def _risk_factors(req: PredictionRequest, symptom_count: int) -> List[str]:
    risks = []
    if symptom_count >= 3:
        risks.append(f"{symptom_count} concurrent symptoms — elevated overall risk")
    if req.stressLevel >= 4:
        risks.append(f"High stress ({req.stressLevel}/5) — top severity predictor")
    if req.mood <= 2:
        risks.append(f"Low mood ({req.mood}/5) — strongly linked to severity")
    if req.energyLevel <= 2:
        risks.append(f"Low energy ({req.energyLevel}/5) — amplifies symptoms")
    if req.sleepHours < 5.5:
        risks.append(f"Sleep deficit ({req.sleepHours}h) — major feature")
    if req.waterIntakeMl < 1200:
        risks.append(f"Dehydration risk ({req.waterIntakeMl} ml)")
    if req.age > 55:
        risks.append(f"Age ({req.age}) — higher baseline risk")
    if req.bmi > 30:
        risks.append(f"BMI {req.bmi} — obesity increases severity")
    if req.hasChronicCondition:
        risks.append("Chronic condition present")
    if req.exerciseHoursWeekly < 1:
        risks.append(f"Sedentary ({req.exerciseHoursWeekly}h/week)")
    if req.caffeineCupsDaily > 3:
        risks.append(f"High caffeine ({req.caffeineCupsDaily} cups/day)")
    # Biometric risks
    if req.systolicBp and req.systolicBp >= 140:
        risks.append(f"High blood pressure ({req.systolicBp}/{req.diastolicBp} mmHg)")
    if req.glucoseMgDl and req.glucoseMgDl >= 126:
        risks.append(f"Elevated glucose ({req.glucoseMgDl} mg/dL)")
    if req.bodyFatPercent and req.bodyFatPercent > 30:
        risks.append(f"High body fat ({req.bodyFatPercent}%)")
    if req.muscleMassKg and req.muscleMassKg < 22:
        risks.append(f"Low muscle mass ({req.muscleMassKg} kg)")
    if req.systolicBp and req.diastolicBp and (req.systolicBp - req.diastolicBp) > 60:
        risks.append(f"Elevated pulse pressure ({req.systolicBp - req.diastolicBp} mmHg)")
    if len(req.triggers) >= 3:
        risks.append(f"{len(req.triggers)} active triggers — cumulative effect")
    if not risks:
        risks.append("No major risk factors detected")
    return risks

def _multi_warning(symptoms: List[str], severities: List[int]) -> Optional[str]:
    severe_count = sum(1 for s in severities if s >= 4)
    n = len(symptoms)
    if severe_count >= 2:
        return ("Multiple severe symptoms detected simultaneously. "
                "This combination may indicate a systemic issue. Seek medical consultation.")
    if n >= 4:
        return (f"You are experiencing {n} symptoms at once. "
                "Multiple concurrent symptoms may indicate an underlying condition.")
    if n >= 2 and severe_count >= 1:
        return ("One or more symptoms predicted as severe. "
                "Monitor closely and consult your healthcare provider if they persist.")
    if n >= 2:
        return ("Multiple symptoms present. "
                "Track their progression — consult your doctor if severity increases.")
    return None

# ── Endpoints ──────────────────────────────────────────────────────

@app.get("/predict/status")
def status():
    dp = _load_disease_model()
    return {
        "modelLoaded": True,
        "modelType": META.get("best_model"),
        "accuracy": META.get("best_accuracy"),
        "nFeatures": len(FEATURE_COLS),
        "nSamples": META.get("n_samples"),
        "symptomTypes": SYMPTOM_TYPES,
        "triggerNames": TRIGGER_KEYS,
        "severityLabels": SEVERITY_LABELS,
        "diseaseModelLoaded": dp is not None,
    }

@app.post("/predict/severity")
def predict_severity(req: PredictionRequest):
    if not req.symptoms:
        return {"error": "No symptoms provided"}

    rows = [_build_row(req, s) for s in req.symptoms]
    X = pd.DataFrame(rows)[FEATURE_COLS]

    raw_preds = model.predict(X)
    probas    = model.predict_proba(X)
    # model.classes_ is [1..5] (or [0..4] wrapped back to 1..5 via XGBWrapper)
    class_labels = [SEVERITY_LABELS[int(c)] for c in model.classes_]

    predictions = []
    severities  = []
    for i, symptom in enumerate(req.symptoms):
        sev  = int(raw_preds[i])
        prob = probas[i]
        conf = round(float(prob.max()) * 100, 1)
        prob_dict = {
            lbl: round(float(p) * 100, 1)
            for lbl, p in zip(class_labels, prob)
        }
        predictions.append({
            "symptom": symptom,
            "predictedSeverity": sev,
            "severityLabel": SEVERITY_LABELS[sev],
            "confidence": conf,
            "probabilities": prob_dict,
        })
        severities.append(sev)

    n           = len(severities)
    worst_idx   = int(np.argmax(severities))
    avg_sev     = round(float(np.mean(severities)), 1)
    avg_conf    = round(float(np.mean([p["confidence"] for p in predictions])), 1)
    max_sev     = int(max(severities))

    # Overall severity: 40% average + 60% worst, then bump for symptom count
    overall = int(round(avg_sev * 0.4 + max_sev * 0.6))
    overall = max(1, min(5, overall))
    if n >= 3 and overall < 5: overall = min(5, overall + 1)

    model_label = META.get("best_model", "ML Model")
    acc_pct     = round(META.get("best_accuracy", 0) * 100, 1)

    return {
        "overallSeverity":      overall,
        "overallSeverityLabel": SEVERITY_LABELS[overall],
        "averageSeverity":      avg_sev,
        "averageConfidence":    avg_conf,
        "symptomCount":         n,
        "worstSymptom":         req.symptoms[worst_idx],
        "worstSeverity":        max_sev,
        "worstSeverityLabel":   SEVERITY_LABELS[max_sev],
        "predictions":          predictions,
        "modelType":            f"{model_label} ({acc_pct}% accuracy, {len(FEATURE_COLS)} features)",
        "riskFactors":          _risk_factors(req, n),
        "multiSymptomWarning":  _multi_warning(req.symptoms, severities),
    }


# ── Disease prediction ─────────────────────────────────────────────────────────

# Rich metadata for each disease (description, urgency, recommendation)
DISEASE_META = {
    'Hypertension': {
        'description': 'Persistently elevated blood pressure that strains the heart and arteries.',
        'urgency': 'high',
        'recommendation': 'Monitor BP regularly. Reduce sodium, increase exercise, consult a doctor.',
        'specialty': 'Cardiologist / GP',
    },
    'Type 2 Diabetes': {
        'description': 'Chronic condition affecting blood sugar regulation due to insulin resistance.',
        'urgency': 'high',
        'recommendation': 'Check fasting glucose. Reduce refined carbs, increase activity, see a doctor.',
        'specialty': 'Endocrinologist / GP',
    },
    'Migraine': {
        'description': 'Recurring moderate-to-severe headaches often with nausea and sensitivity.',
        'urgency': 'medium',
        'recommendation': 'Identify and avoid triggers. Rest in a dark room. Consult a neurologist if frequent.',
        'specialty': 'Neurologist',
    },
    'GERD / Acid Reflux': {
        'description': 'Stomach acid flows back into the oesophagus causing heartburn and discomfort.',
        'urgency': 'low',
        'recommendation': 'Avoid spicy/fatty foods, caffeine, and alcohol. Eat smaller meals. Elevate head while sleeping.',
        'specialty': 'Gastroenterologist',
    },
    'Irritable Bowel Syndrome': {
        'description': 'A functional gut disorder causing cramping, bloating, and altered bowel habits.',
        'urgency': 'low',
        'recommendation': 'Manage stress, follow a low-FODMAP diet, stay hydrated. See a gastroenterologist.',
        'specialty': 'Gastroenterologist',
    },
    'Anxiety Disorder': {
        'description': 'Excessive, persistent worry and physical tension that interferes with daily life.',
        'urgency': 'medium',
        'recommendation': 'Practice mindfulness or CBT. Reduce caffeine. Consider speaking to a mental health professional.',
        'specialty': 'Psychiatrist / Psychologist',
    },
    'Depression': {
        'description': 'A mood disorder causing persistent sadness, low energy, and loss of interest.',
        'urgency': 'high',
        'recommendation': 'Seek professional support. Maintain social connections, exercise regularly, and sleep consistently.',
        'specialty': 'Psychiatrist / Psychologist',
    },
    'Anemia': {
        'description': 'Low red blood cell count reducing oxygen delivery to tissues.',
        'urgency': 'medium',
        'recommendation': 'Increase iron-rich foods (meat, legumes). Check B12 and folate. Get a blood panel.',
        'specialty': 'Hematologist / GP',
    },
    'Dehydration': {
        'description': 'Insufficient fluid intake causing decreased blood volume and cognitive impairment.',
        'urgency': 'low',
        'recommendation': 'Drink at least 2 litres of water daily. Increase intake during exercise or heat.',
        'specialty': 'GP / Self-care',
    },
    'Insomnia / Sleep Disorder': {
        'description': 'Difficulty falling or staying asleep affecting cognitive and physical performance.',
        'urgency': 'medium',
        'recommendation': 'Follow sleep hygiene practices. Reduce screen time before bed. Consider CBT-I.',
        'specialty': 'Sleep Specialist',
    },
    'Metabolic Syndrome': {
        'description': 'A cluster of conditions (high BP, high glucose, excess fat) raising cardiovascular risk.',
        'urgency': 'high',
        'recommendation': 'Lifestyle overhaul: weight loss, low-GI diet, 150 min/week exercise. Medical supervision required.',
        'specialty': 'Endocrinologist / Cardiologist',
    },
    'Fibromyalgia': {
        'description': 'Widespread musculoskeletal pain with fatigue, sleep, and cognitive difficulties.',
        'urgency': 'medium',
        'recommendation': 'Regular low-impact exercise, stress management, and sleep optimisation. See a rheumatologist.',
        'specialty': 'Rheumatologist',
    },
    'Viral Infection (Flu)': {
        'description': 'Acute infection by influenza or similar viruses causing systemic symptoms.',
        'urgency': 'medium',
        'recommendation': 'Rest, stay hydrated, take antipyretics if needed. See a doctor if symptoms worsen.',
        'specialty': 'GP',
    },
    'Asthma': {
        'description': 'Chronic airway inflammation causing episodes of wheezing and shortness of breath.',
        'urgency': 'high',
        'recommendation': 'Avoid known triggers. Use prescribed inhalers. Seek emergency care if severe.',
        'specialty': 'Pulmonologist',
    },
    'Tension Headache': {
        'description': 'Dull, pressure-like head pain often linked to stress and muscle tension.',
        'urgency': 'low',
        'recommendation': 'Manage stress, improve posture, take breaks from screens, stay hydrated.',
        'specialty': 'GP / Neurologist',
    },
    'Nutritional Deficiency': {
        'description': 'Inadequate intake or absorption of essential vitamins or minerals.',
        'urgency': 'medium',
        'recommendation': 'Get a blood panel (iron, B12, D3, magnesium). Adjust diet or supplement accordingly.',
        'specialty': 'GP / Nutritionist',
    },
    'Cardiovascular Risk': {
        'description': 'Elevated likelihood of heart attack or stroke based on multiple risk factors.',
        'urgency': 'urgent',
        'recommendation': 'Immediate cardiology consultation. Monitor BP and cholesterol. Do not ignore chest symptoms.',
        'specialty': 'Cardiologist',
    },
    'Chronic Fatigue Syndrome': {
        'description': 'Persistent, unexplained fatigue not relieved by rest, lasting 6+ months.',
        'urgency': 'medium',
        'recommendation': 'Pace activity carefully. Sleep optimisation, gentle exercise, and specialist support.',
        'specialty': 'Internal Medicine / Immunologist',
    },
    'Hypothyroidism': {
        'description': 'Underactive thyroid gland causing slowed metabolism and widespread symptoms.',
        'urgency': 'medium',
        'recommendation': 'Get TSH/T4 blood test. If confirmed, thyroid hormone replacement is effective.',
        'specialty': 'Endocrinologist',
    },
    'Obesity-Related Disorder': {
        'description': 'Weight-driven complications including joint stress, sleep apnea, and metabolic issues.',
        'urgency': 'medium',
        'recommendation': 'Structured weight-loss programme: caloric deficit, increased activity, dietitian support.',
        'specialty': 'Nutritionist / Bariatric Specialist',
    },
}

TRIGGER_NAME_MAP = {
    "Caffeine": "t_caffeine", "Poor sleep": "t_poor_sleep", "Stress": "t_stress",
    "Skipped meal": "t_skipped_meal", "Exercise": "t_exercise", "Dehydration": "t_dehydration",
    "Screen time": "t_screen_time", "Alcohol": "t_alcohol", "Weather": "t_weather",
    "Medication": "t_medication",
}

SYMPTOM_COL_MAP = {
    'Headache': 'headache', 'Fatigue': 'fatigue', 'Nausea': 'nausea',
    'Dizziness': 'dizziness', 'Insomnia': 'insomnia', 'Bloating': 'bloating',
    'Joint Pain': 'joint_pain', 'Muscle Pain': 'muscle_pain', 'Anxiety': 'anxiety',
    'Brain Fog': 'brain_fog', 'Chest Tightness': 'chest_tightness',
    'Shortness of Breath': 'shortness_of_breath', 'Back Pain': 'back_pain',
    'Stomach Pain': 'stomach_pain', 'Heartburn': 'heartburn', 'Cramps': 'cramps',
    'Numbness': 'numbness', 'Skin Rash': 'skin_rash',
}

def _build_disease_row(req: PredictionRequest, feature_cols: list) -> pd.DataFrame:
    s = {col: 0 for col in [f'sym_{v}' for v in SYMPTOM_COL_MAP.values()]}
    for sym in req.symptoms:
        col = 'sym_' + SYMPTOM_COL_MAP.get(sym, sym.lower().replace(' ', '_'))
        if col in s:
            s[col] = 1

    active_triggers = {TRIGGER_NAME_MAP.get(t, t) for t in req.triggers}

    systolic  = req.systolicBp    if req.systolicBp    is not None else 122.0
    diastolic = req.diastolicBp   if req.diastolicBp   is not None else 80.0
    glucose   = req.glucoseMgDl   if req.glucoseMgDl   is not None else 97.0
    body_fat  = req.bodyFatPercent if req.bodyFatPercent is not None else 22.0
    muscle    = req.muscleMassKg   if req.muscleMassKg   is not None else 35.0

    row = {
        **s,
        'age': req.age, 'bmi': req.bmi,
        'systolic': systolic, 'diastolic': diastolic,
        'glucose': glucose, 'body_fat': body_fat, 'muscle_mass': muscle,
        'stress': req.stressLevel, 'mood': req.mood, 'energy': req.energyLevel,
        'sleep_hours': req.sleepHours, 'water_ml': req.waterIntakeMl,
        'exercise_weekly': req.exerciseHoursWeekly, 'caffeine_daily': req.caffeineCupsDaily,
        'has_chronic': int(req.hasChronicCondition),
        't_caffeine':    int('t_caffeine'    in active_triggers),
        't_poor_sleep':  int('t_poor_sleep'  in active_triggers),
        't_stress':      int('t_stress'      in active_triggers),
        't_skipped_meal':int('t_skipped_meal'in active_triggers),
        't_exercise':    int('t_exercise'    in active_triggers),
        't_dehydration': int('t_dehydration' in active_triggers),
        't_screen_time': int('t_screen_time' in active_triggers),
        't_alcohol':     int('t_alcohol'     in active_triggers),
        't_weather':     int('t_weather'     in active_triggers),
        't_medication':  int('t_medication'  in active_triggers),
        'bp_pulse':      systolic - diastolic,
        'stress_mood':   req.stressLevel * (6 - req.mood),
        'sleep_energy':  req.sleepHours * req.energyLevel / 5.0,
        'lifestyle_risk': (
            int(req.stressLevel > 3) + int(req.sleepHours < 6) +
            int(req.exerciseHoursWeekly < 1.5) + int(req.waterIntakeMl < 1200) +
            int(req.caffeineCupsDaily > 3)
        ),
        'metabolic_score': (req.bmi / 25) * (glucose / 100) * (body_fat / 20),
    }
    df = pd.DataFrame([row])
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0
    return df[feature_cols]


@app.post("/predict/diseases")
def predict_diseases(req: PredictionRequest):
    dp = _load_disease_model()
    if dp is None:
        return {"error": "Disease model not loaded. Run disease_model.py first."}

    dm            = dp['model']
    feature_cols  = dp['feature_columns']
    diseases      = dp['diseases']

    X = _build_disease_row(req, feature_cols)

    # Each estimator in MultiOutputClassifier predicts one disease (binary)
    probs = []
    for est in dm.estimators_:
        p = est.predict_proba(X)[0]
        classes = list(est.classes_)
        prob_positive = float(p[classes.index(1)]) if 1 in classes else 0.0
        probs.append(prob_positive)

    # Map symptoms to internal column names for matching
    user_sym_cols = {'sym_' + SYMPTOM_COL_MAP.get(s, s.lower().replace(' ', '_'))
                     for s in req.symptoms}

    # Which symptom columns correlate with each disease?
    DISEASE_SYMPTOMS = {
        'Hypertension':             ['sym_headache','sym_dizziness','sym_chest_tightness','sym_shortness_of_breath','sym_fatigue'],
        'Type 2 Diabetes':          ['sym_fatigue','sym_numbness','sym_brain_fog','sym_dizziness','sym_cramps'],
        'Migraine':                 ['sym_headache','sym_nausea','sym_dizziness','sym_fatigue','sym_brain_fog'],
        'GERD / Acid Reflux':       ['sym_heartburn','sym_bloating','sym_nausea','sym_stomach_pain'],
        'Irritable Bowel Syndrome': ['sym_bloating','sym_stomach_pain','sym_cramps','sym_nausea','sym_anxiety'],
        'Anxiety Disorder':         ['sym_anxiety','sym_insomnia','sym_fatigue','sym_brain_fog','sym_chest_tightness'],
        'Depression':               ['sym_fatigue','sym_insomnia','sym_brain_fog','sym_muscle_pain','sym_anxiety'],
        'Anemia':                   ['sym_fatigue','sym_dizziness','sym_headache','sym_shortness_of_breath','sym_cramps'],
        'Dehydration':              ['sym_headache','sym_dizziness','sym_fatigue','sym_cramps','sym_nausea'],
        'Insomnia / Sleep Disorder':['sym_insomnia','sym_fatigue','sym_brain_fog','sym_headache','sym_anxiety'],
        'Metabolic Syndrome':       ['sym_fatigue','sym_brain_fog','sym_shortness_of_breath','sym_joint_pain'],
        'Fibromyalgia':             ['sym_muscle_pain','sym_joint_pain','sym_fatigue','sym_insomnia','sym_brain_fog'],
        'Viral Infection (Flu)':    ['sym_fatigue','sym_headache','sym_muscle_pain','sym_nausea','sym_dizziness'],
        'Asthma':                   ['sym_shortness_of_breath','sym_chest_tightness','sym_fatigue'],
        'Tension Headache':         ['sym_headache','sym_back_pain','sym_muscle_pain','sym_fatigue'],
        'Nutritional Deficiency':   ['sym_fatigue','sym_cramps','sym_numbness','sym_brain_fog','sym_muscle_pain'],
        'Cardiovascular Risk':      ['sym_chest_tightness','sym_shortness_of_breath','sym_fatigue','sym_dizziness','sym_numbness'],
        'Chronic Fatigue Syndrome': ['sym_fatigue','sym_brain_fog','sym_muscle_pain','sym_insomnia','sym_joint_pain'],
        'Hypothyroidism':           ['sym_fatigue','sym_brain_fog','sym_cramps','sym_joint_pain','sym_muscle_pain'],
        'Obesity-Related Disorder': ['sym_fatigue','sym_joint_pain','sym_back_pain','sym_shortness_of_breath'],
    }

    results = []
    for i, disease in enumerate(diseases):
        prob = probs[i]
        if prob < 0.08:  # Skip very unlikely diseases
            continue
        meta = DISEASE_META.get(disease, {})
        related_sym_cols = set(DISEASE_SYMPTOMS.get(disease, []))
        matched = [
            s for s in req.symptoms
            if ('sym_' + SYMPTOM_COL_MAP.get(s, '')) in (related_sym_cols & user_sym_cols)
        ]
        results.append({
            'disease': disease,
            'probability': round(prob * 100, 1),
            'description': meta.get('description', ''),
            'urgency': meta.get('urgency', 'low'),
            'recommendation': meta.get('recommendation', ''),
            'specialty': meta.get('specialty', 'GP'),
            'matchedSymptoms': matched,
            'matchCount': len(matched),
        })

    results.sort(key=lambda x: x['probability'], reverse=True)
    top = results[:8]  # Return top 8

    return {
        'predictions': top,
        'totalScreened': len(diseases),
        'symptomsAnalyzed': req.symptoms,
        'modelInfo': f"Multi-label HistGBT · {dp.get('n_samples', 0):,} samples · {dp.get('n_features', 0)} features",
        'macroF1': round(dp.get('macro_f1', 0) * 100, 1),
    }
