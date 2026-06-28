FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Only copy what the API needs at runtime — exclude training scripts and data
COPY api.py .
COPY features.txt .
COPY booking_model.pkl .
COPY dropout_model.pkl .

EXPOSE 8001

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8001"]
