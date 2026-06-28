FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Runtime files only — exclude training/generation scripts
COPY app.py .
COPY model_v2.pkl .
COPY label_encoder.pkl .
COPY location_mapping.csv .
COPY dataset_event_real.csv .
COPY dataset_event_v2.csv .

EXPOSE 8004

# Gunicorn replaces Flask's dev server — never use app.run() in production
CMD ["gunicorn", "--bind", "0.0.0.0:8004", "--workers", "2", "--timeout", "120", "app:app"]
