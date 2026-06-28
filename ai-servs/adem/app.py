from flask import Flask, request, jsonify
import joblib
import pandas as pd
import re
import os
from unidecode import unidecode
from rapidfuzz import process, fuzz
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MODEL_PATH = "model_v2.pkl"
LABEL_ENCODER_PATH = "label_encoder.pkl"
BASE_DATASET_PATH = "dataset_event_v2.csv"
REAL_DATASET_PATH = "dataset_event_real.csv"


# =========================
# NORMALIZE TEXT
# =========================
def normalize_text(text):
    if not text:
        return ""
    text = str(text).lower().strip()
    text = unidecode(text)
    text = re.sub(r"\s+", " ", text)
    text = text.replace("lac1", "lac 1").replace("lac2", "lac 2")
    return text


# =========================
# LOAD MODEL + LABEL ENCODER
# =========================
model = joblib.load(MODEL_PATH)
label_encoder = joblib.load(LABEL_ENCODER_PATH)


# =========================
# LOAD LOCATION MAPPING
# =========================
mapping_df = pd.read_csv("location_mapping.csv")
mapping_df.columns = mapping_df.columns.str.strip()

mapping_df["alias"] = mapping_df["alias"].astype(str).apply(normalize_text)
mapping_df["governorate"] = mapping_df["governorate"].astype(str).str.strip()

mapping_dict = dict(zip(mapping_df["alias"], mapping_df["governorate"]))

known_governorates = [
    "Tunis", "Ariana", "Ben Arous", "Manouba",
    "Nabeul", "Zaghouan", "Bizerte", "Beja",
    "Jendouba", "Kef", "Siliana", "Kairouan",
    "Kasserine", "Sidi Bouzid", "Sousse", "Monastir",
    "Mahdia", "Sfax", "Gabes", "Medenine",
    "Tataouine", "Gafsa", "Tozeur", "Kebili"
]

normalized_governorates = {normalize_text(x): x for x in known_governorates}


# =========================
# RESOLVE LOCATION -> GOVERNORATE
# =========================
def resolve_governorate(user_input):
    normalized = normalize_text(user_input)

    normalized = re.sub(r"\b(tunisie|tunisia)\b", "", normalized).strip()

    gov_match = re.search(r"gouvernorat\s+([a-zA-Z\s]+)", normalized)
    if gov_match:
        extracted = gov_match.group(1).strip()
        extracted = extracted.split(",")[0].strip()

        if extracted in normalized_governorates:
            return normalized_governorates[extracted]

        gov_candidates = list(normalized_governorates.keys())
        match = process.extractOne(extracted, gov_candidates, scorer=fuzz.ratio)
        if match and match[1] >= 80:
            return normalized_governorates[match[0]]

    if normalized in mapping_dict:
        candidate = mapping_dict[normalized]
        normalized_candidate = normalize_text(candidate)
        if normalized_candidate in normalized_governorates:
            return normalized_governorates[normalized_candidate]

    for alias, gov in mapping_dict.items():
        if re.search(rf"\b{re.escape(alias)}\b", normalized):
            normalized_candidate = normalize_text(gov)
            if normalized_candidate in normalized_governorates:
                return normalized_governorates[normalized_candidate]

    for norm_gov, original_gov in normalized_governorates.items():
        if re.search(rf"\b{re.escape(norm_gov)}\b", normalized):
            return original_gov

    candidates = list(mapping_dict.keys()) + list(normalized_governorates.keys())
    match = process.extractOne(normalized, candidates, scorer=fuzz.ratio)

    if match and match[1] >= 85:
        best = match[0]

        if best in mapping_dict:
            candidate = mapping_dict[best]
            normalized_candidate = normalize_text(candidate)
            if normalized_candidate in normalized_governorates:
                return normalized_governorates[normalized_candidate]

        if best in normalized_governorates:
            return normalized_governorates[best]

    return None


# =========================
# EXTRACT DATE FEATURES
# =========================
def extract_date_features(event_date_str):
    try:
        dt = pd.to_datetime(event_date_str)
        return {
            "hour": int(dt.hour),
            "dayOfWeek": int(dt.dayofweek),
            "month": int(dt.month)
        }
    except Exception:
        return None


# =========================
# LOAD DATASETS
# =========================
def load_combined_dataset():
    df_base = pd.read_csv(BASE_DATASET_PATH, sep=";", encoding="utf-8")

    if os.path.exists(REAL_DATASET_PATH):
        try:
            df_real = pd.read_csv(REAL_DATASET_PATH, encoding="utf-8")
            if not df_real.empty:
                df = pd.concat([df_base, df_real], ignore_index=True)
            else:
                df = df_base.copy()
        except pd.errors.EmptyDataError:
            df = df_base.copy()
    else:
        df = df_base.copy()

    df = df.dropna()

    required_columns = [
        "category",
        "governorate",
        "hour",
        "dayOfWeek",
        "month",
        "maxParticipants",
        "success_level"
    ]

    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in dataset: {missing}")

    return df


# =========================
# RETRAIN MODEL
# =========================
def retrain_model():
    global model, label_encoder

    df = load_combined_dataset()

    X = df[["category", "governorate", "hour", "dayOfWeek", "month", "maxParticipants"]]
    y = df["success_level"]

    from sklearn.compose import ColumnTransformer
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OneHotEncoder, LabelEncoder
    from sklearn.linear_model import LogisticRegression

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    categorical = ["category", "governorate"]
    numeric = ["hour", "dayOfWeek", "month", "maxParticipants"]

    preprocessor = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
        ("num", "passthrough", numeric)
    ])

    model = Pipeline([
        ("prep", preprocessor),
        ("clf", LogisticRegression(max_iter=2000))
    ])

    model.fit(X, y_encoded)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(label_encoder, LABEL_ENCODER_PATH)


# =========================
# PREDICT ENDPOINT
# =========================
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        required_fields = [
            "category",
            "location",
            "eventDate",
            "maxParticipants"
        ]

        missing = [field for field in required_fields if field not in data or data[field] in [None, ""]]
        if missing:
            return jsonify({
                "error": f"Missing fields: {missing}"
            }), 400

        category = str(data["category"]).strip().upper()
        location = str(data["location"]).strip()
        event_date = str(data["eventDate"]).strip()

        try:
            max_participants = int(data["maxParticipants"])
        except Exception:
            return jsonify({
                "error": "maxParticipants must be an integer"
            }), 400

        valid_categories = ["SPORT", "CINEMA", "KARAOKE", "CEREMONY", "OTHER"]
        if category not in valid_categories:
            return jsonify({
                "error": f"Invalid category. Must be one of {valid_categories}"
            }), 400

        resolved_governorate = resolve_governorate(location)
        if not resolved_governorate:
            return jsonify({
                "error": "Location not recognized",
                "input": location
            }), 400

        date_features = extract_date_features(event_date)
        if not date_features:
            return jsonify({
                "error": "Invalid eventDate format"
            }), 400

        df = pd.DataFrame([{
            "category": category,
            "governorate": resolved_governorate,
            "hour": date_features["hour"],
            "dayOfWeek": date_features["dayOfWeek"],
            "month": date_features["month"],
            "maxParticipants": max_participants
        }])

        pred = model.predict(df)
        result = label_encoder.inverse_transform(pred)[0]

        response = {
            "prediction": result,
            "resolved_governorate": resolved_governorate,
            "features_used": {
                "category": category,
                "hour": date_features["hour"],
                "dayOfWeek": date_features["dayOfWeek"],
                "month": date_features["month"],
                "maxParticipants": max_participants
            }
        }

        if hasattr(model, "predict_proba"):
            try:
                proba = model.predict_proba(df)[0]
                confidence = float(max(proba))
                response["confidence"] = round(confidence, 4)
            except Exception:
                pass

        return jsonify(response)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# =========================
# ADD REAL EVENT TO REAL DATASET
# =========================
@app.route("/add-real-event", methods=["POST"])
def add_real_event():
    try:
        data = request.json

        required_fields = [
            "category",
            "governorate",
            "hour",
            "dayOfWeek",
            "month",
            "maxParticipants",
            "success_level"
        ]

        missing = [field for field in required_fields if field not in data or data[field] in [None, ""]]
        if missing:
            return jsonify({"error": f"Missing fields: {missing}"}), 400

        category = str(data["category"]).strip().upper()
        governorate = str(data["governorate"]).strip()
        hour = int(data["hour"])
        day_of_week = int(data["dayOfWeek"])
        month = int(data["month"])
        max_participants = int(data["maxParticipants"])
        success_level = str(data["success_level"]).strip().upper()

        valid_categories = ["SPORT", "CINEMA", "KARAOKE", "CEREMONY", "OTHER"]
        if category not in valid_categories:
            return jsonify({"error": f"Invalid category: {category}"}), 400

        valid_success = ["LOW", "MEDIUM", "HIGH"]
        if success_level not in valid_success:
            return jsonify({"error": f"Invalid success_level: {success_level}"}), 400

        if governorate not in known_governorates:
            return jsonify({"error": f"Invalid governorate: {governorate}"}), 400

        new_row = pd.DataFrame([{
            "category": category,
            "governorate": governorate,
            "hour": hour,
            "dayOfWeek": day_of_week,
            "month": month,
            "maxParticipants": max_participants,
            "success_level": success_level
        }])

        if os.path.exists(REAL_DATASET_PATH):
            try:
                df_existing = pd.read_csv(REAL_DATASET_PATH, encoding="utf-8")
                df_all = pd.concat([df_existing, new_row], ignore_index=True)
            except pd.errors.EmptyDataError:
                df_all = new_row
        else:
            df_all = new_row

        df_all.to_csv(REAL_DATASET_PATH, index=False, encoding="utf-8")

        return jsonify({
            "message": "Real event added successfully"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# MANUAL RETRAIN ENDPOINT
# =========================
@app.route("/retrain", methods=["POST"])
def retrain():
    try:
        retrain_model()
        return jsonify({
            "message": "Model retrained successfully"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# HEALTH CHECK
# =========================
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Event Success Prediction API is running"
    })


# =========================
# RUN
# =========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8004, debug=True)