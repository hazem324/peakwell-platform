from fastapi import FastAPI
from pydantic import BaseModel
import joblib

# Load models
model = joblib.load("model.pkl")
tfidf = joblib.load("tfidf.pkl")
mlb = joblib.load("mlb.pkl")

app = FastAPI()

class MealRequest(BaseModel):
    text: str

def predict_with_confidence(text):
    vec = tfidf.transform([text])
    
    probs = [clf.predict_proba(vec)[0][1] for clf in model.estimators_]
    
    allergens = []
    confidence = []

    for i, p in enumerate(probs):
        if p > 0.5:
            allergens.append(mlb.classes_[i])
            confidence.append(float(p))

    return allergens, confidence

@app.post("/predict-allergens")
def predict_allergens(request: MealRequest):
    allergens, confidence = predict_with_confidence(request.text)

    return {
        "predictedAllergens": allergens,
        "confidence": confidence
    }