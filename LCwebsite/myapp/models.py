from django.db import models

# Create your models here.
class ScrapedStore(models.Model):
    zip_and_address = models.CharField()
    item_name = models.CharField()
    item_price = models.FloatField()
    item_cal = models.FloatField()
    store_id = models.CharField()
    scraped_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Store {self.zip_and_address} - {self.item_name} - {self.item_price}"