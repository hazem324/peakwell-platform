import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix


BASE_DATASET = "dataset_event_v2.csv"
REAL_DATASET = "dataset_event_real.csv"


def load_combined_dataset():
    df_base = pd.read_csv(BASE_DATASET, sep=";", encoding="utf-8")

    if os.path.exists(REAL_DATASET):
        try:
            df_real = pd.read_csv(REAL_DATASET, encoding="utf-8")
            if not df_real.empty:
                df = pd.concat([df_base, df_real], ignore_index=True)
            else:
                df = df_base.copy()
        except pd.errors.EmptyDataError:
            df = df_base.copy()
    else:
        df = df_base.copy()

    # nettoyer
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


def train_and_save():
    df = load_combined_dataset()

    X = df[["category", "governorate", "hour", "dayOfWeek", "month", "maxParticipants"]]
    y = df["success_level"]

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

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded,
        test_size=0.2,
        random_state=42,
        stratify=y_encoded
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    print("Accuracy:", accuracy_score(y_test, y_pred))
    print("\nClassification Report:\n")
    print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))
    print("\nConfusion Matrix:\n")
    print(confusion_matrix(y_test, y_pred))

    joblib.dump(model, "model_v2.pkl")
    joblib.dump(label_encoder, "label_encoder.pkl")

    print("\nModel saved successfully!")


if __name__ == "__main__":
    train_and_save()