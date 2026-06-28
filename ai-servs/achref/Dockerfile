FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY mainv2.py .
COPY full_model.pkl .

EXPOSE 8003

CMD ["uvicorn", "mainv2:app", "--host", "0.0.0.0", "--port", "8003"]
