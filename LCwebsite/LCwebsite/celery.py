import os
from celery import Celery
from celery.signals import task_failure
import sentry_sdk
from sentry_sdk.integrations.celery import CeleryIntegration


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'LCwebsite.settings')

sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN"),
    # Add data like request headers and IP for users,
    # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
    send_default_pii=True,
    # Enable sending logs to Sentry
    enable_logs=True,
    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for tracing.
    traces_sample_rate=1.0,
    # Set profile_session_sample_rate to 1.0 to profile 100%
    # of profile sessions.
    profile_session_sample_rate=1.0,
    # Set profile_lifecycle to "trace" to automatically
    # run the profiler on when there is an active transaction
    profile_lifecycle="trace",
)

app = Celery('LCwebsite')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()