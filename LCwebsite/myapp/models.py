from django.db import models

# Create your models here.

#Database table named ScrapedStore to store the scraped data from the stores witht the following fields:
class ScrapedStore(models.Model):
    zip_and_address = models.CharField()
    item_name = models.CharField()
    item_price = models.FloatField()
    item_cal = models.FloatField()
    store_id = models.CharField()
    scraped_at = models.DateTimeField(auto_now_add=True)

    # Prevents duplicate items fom being added to the database for the same store
    class Meta:
        constraints = [
            models.UniqueConstraint(
                # what fields are not allowed to be the same for an entry in the database.
                # In this case, we don't want the same item name to be added for the same store.
                fields=['zip_and_address', 'item_name'], 
                # The internal name for the constraint, which can be used for debugging.
                name='unique_store_item'
            )
        ]

    # String representation of the model, so instead of seeing "ScrapedStore object (1)"
    # in the admin panel, we will see the store's zip code and address, item name, and item price.
    # Helps with debugging and identifying the items in the database.
    def __str__(self):
        return f"Store {self.zip_and_address} - {self.item_name} - {self.item_price}"