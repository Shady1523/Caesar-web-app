from django.db import models

# Create your models here.
class ScrapedStore(models.Model):
    zip_and_address = models.CharField()
    item_name = models.CharField()
    item_price = models.FloatField()
    item_cal = models.FloatField()
    store_id = models.CharField()
    scraped_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['zip_and_address', 'item_name'], 
                name='unique_store_item'
            )
        ]

    def __str__(self):
        return f"Store {self.zip_and_address} - {self.item_name} - {self.item_price}"