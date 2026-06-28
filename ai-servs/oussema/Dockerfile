FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Only runtime artifacts — exclude training scripts and raw datasets
COPY api.py .
COPY symptom_severity_model.pkl .
COPY disease_severity_model.pkl .
COPY model_metadata.json .
COPY disease_model_metadata.json .

EXPOSE 8002

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8002"]
