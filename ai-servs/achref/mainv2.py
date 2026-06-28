from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import re
from scipy.sparse import hstack


bundle = joblib.load("full_model.pkl")

model = bundle["model"]
tfidf_word = bundle["tfidf_word"]
tfidf_char = bundle["tfidf_char"]
mlb = bundle["mlb"]

app = FastAPI()


class MealRequest(BaseModel):
    text: str   # ex: "tuna pasta eggs"

def predict_meal(text, threshold=0.7):
    words = re.findall(r'\b\w+\b', text.lower())

    all_preds = {}

    for w in words:
        # vectorize each word
        Xw = tfidf_word.transform([w])
        Xc = tfidf_char.transform([w])
        vec = hstack([Xw, Xc])

        # probabilities
        probs = [
            clf.predict_proba(vec)[0][1]
            for clf in model.estimators_
        ]

        for i, p in enumerate(probs):
            if p > threshold:
                label = mlb.classes_[i]

                # keep max confidence per label
                if label not in all_preds or p > all_preds[label]:
                    all_preds[label] = float(p)

    return all_preds

@app.post("/predict-allergens")
def predict(request: MealRequest):

    predictions = predict_meal(request.text)

    return {
        "predictedAllergens": list(predictions.keys()), 
        "confidence": predictions
    }