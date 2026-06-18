FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip

RUN pip install --no-cache-dir -r requirements.txt

RUN python -m playwright install webkit && \
    python -m playwright install-deps webkit

COPY . .

CMD ["/bin/sh", "-c", "python manage.py migrate && gunicorn --config gunicorn.conf.py LCwebsite.wsgi:application"]