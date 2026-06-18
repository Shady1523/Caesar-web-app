FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip

RUN pip install --no-cache-dir -r requirements.txt

RUN playwright install chromium
RUN playwright install-deps chromium

COPY . .

CMD ["/bin/sh", "-c", "python manage.py migrate && gunicorn LCwebsite.wsgi:application --bind 0.0.0.0:8000"]