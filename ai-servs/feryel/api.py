"""
FastAPI microservice for PeakWell ML predictions.

Endpoints:
  POST /predict/booking   → will the patient book within 14 days?
  POST /predict/dropout   → dropout type (active / discouraged / healed)
  GET  /health            → service health check
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os

BASE_DIR = os.path.dirname(__file__)

app = FastAPI(title="PeakWell ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load models ────────────────────────────────────────────────────

booking_model = joblib.load(os.path.join(BASE_DIR, "booking_model.pkl"))
dropout_model = joblib.load(os.path.join(BASE_DIR, "dropout_model.pkl"))

FEATURE_ORDER = [
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

DROPOUT_LABELS = {
    0: "active",
    1: "discouraged",
    2: "healed",
}

DROPOUT_ACTIONS = {
    "active": "Patient is engaged — no immediate action needed.",
    "discouraged": "Patient is losing motivation. Consider: revising goals downward, "
                   "proposing a shorter follow-up interval, sending an encouraging message.",
    "healed": "Patient is doing well and may stop coming. Consider: proposing a quarterly "
              "maintenance check-up to prevent relapse.",
}


# ── Request / Response models ─────────────────────────────────────

class PatientFeatures(BaseModel):
    age: float
    gender: float
    weight_trend: float
    bmi_trend: float
    bp_systolic_trend: float
    bp_diastolic_trend: float
    glucose_trend: float
    body_fat_trend: float
    weight_current: float
    bmi_current: float
    bp_systolic_current: float
    glucose_current: float
    days_since_last_consultation: float
    total_consultations: float
    cancel_rate: float
    avg_consultation_gap_days: float
    avg_rating: float
    symptoms_improved: float
    advice_followed: float
    would_recommend: float
    goal_progress_pct: float
    goal_achieved: float
    num_active_goals: float
    symptom_count_30d: float
    avg_symptom_severity: float
    avg_mood: float
    avg_energy: float
    avg_stress: float
    biometric_entries_last_30d: float


class BookingResponse(BaseModel):
    will_book: bool
    probability: float
    confidence: str  # LOW / MEDIUM / HIGH


class DropoutResponse(BaseModel):
    dropout_type: str       # active / discouraged / healed
    dropout_label: int      # 0 / 1 / 2
    confidence: float
    probabilities: dict     # {active: 0.x, discouraged: 0.x, healed: 0.x}
    recommended_action: str


# ── Helper ─────────────────────────────────────────────────────────

def to_array(data: PatientFeatures) -> np.ndarray:
    return np.array([[getattr(data, f) for f in FEATURE_ORDER]])


def confidence_label(prob: float) -> str:
    if prob >= 0.8:
        return "HIGH"
    if prob >= 0.6:
        return "MEDIUM"
    return "LOW"


# ── Endpoints ──────────────────────────────────────────────────────

@app.post("/predict/booking", response_model=BookingResponse)
def predict_booking(data: PatientFeatures):
    X = to_array(data)
    proba = booking_model.predict_proba(X)[0]
    book_prob = float(proba[1])
    return BookingResponse(
        will_book=book_prob >= 0.5,
        probability=round(book_prob * 100, 1),
        confidence=confidence_label(max(proba)),
    )


@app.post("/predict/dropout", response_model=DropoutResponse)
def predict_dropout(data: PatientFeatures):
    X = to_array(data)
    proba = dropout_model.predict_proba(X)[0]
    pred_class = int(np.argmax(proba))
    label = DROPOUT_LABELS[pred_class]
    return DropoutResponse(
        dropout_type=label,
        dropout_label=pred_class,
        confidence=round(float(proba[pred_class]) * 100, 1),
        probabilities={
            "active": round(float(proba[0]) * 100, 1),
            "discouraged": round(float(proba[1]) * 100, 1),
            "healed": round(float(proba[2]) * 100, 1),
        },
        recommended_action=DROPOUT_ACTIONS[label],
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": True,
        "features_count": len(FEATURE_ORDER),
    }
