FROM mcr.microsoft.com/playwright/python:v1.42.0-jammy

ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN playwright install chromium

COPY . .

CMD ["/bin/sh", "-c", "python manage.py migrate && gunicorn LCwebsite.wsgi:application --bind 0.0.0.0:8000"]