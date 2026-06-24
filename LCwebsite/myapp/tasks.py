import logging
from celery import shared_task
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

# Import your scraper script and models
from .scraper import script
from .models import ScrapedStore

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def run_pizza_scraper(self, target_zip):
    try:
        locations_to_query = async_to_sync(script.scrape_based_on_zip_code)("https://littlecaesars.com/en-us/", target_zip)

        scraped_items_queryset = ScrapedStore.objects.filter(zip_and_address__in=locations_to_query)
        scraped_items_list = list(scraped_items_queryset.values('zip_and_address', 'item_name', 'item_price', 'item_cal', 'store_id'))
        total_stores = scraped_items_queryset.values('zip_and_address').distinct().count()

        final_data = {
            "status": "success",
            "message": f"Successfully fetched {total_stores} stores.",
            "results": scraped_items_list
        }

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'scrape_{self.request.id}',
            {
                'type': 'scrape_complete',
                'message': 'Scraping successful!',
                'data': final_data
            }
        )

        return "Complete"

    except Exception as e:
        logger.exception(f"Scraper task failed for zip {target_zip}: {str(e)}")
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'scrape_{self.request.id}',
            {
                'type': 'scrape_complete',
                'message': 'Scraping failed.',
                'data': {"error": str(e)}
            }
        )
        return "Failed"