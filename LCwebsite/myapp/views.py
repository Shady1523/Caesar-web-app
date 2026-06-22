from .scraper import script
from .models import ScrapedStore
from asgiref.sync import async_to_sync
from . import query_manager
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
from rest_framework.decorators import api_view
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)

# Create your views here.

#Utility function to get client IP address
def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

#API endpoint to check if the user can scrape based on their IP address
@api_view(['GET'])
def check_scrape_status(request):
    ip = get_client_ip(request)
    count = cache.get(f"scrape_count_{ip}", 0)
    
    return Response({
    "can_scrape": count < 5,
    "remaining_scrapes": 5 - count
    })

#View for the Scraper page
@csrf_exempt
def scraper_api(request):
    if request.method == "POST":

        ip = get_client_ip(request)
        count = cache.get(f"scrape_count_{ip}", 0)
        
        if count >= 5:
            return JsonResponse({"error": "Daily limit reached."}, status=429)
        
        try:
            body_unicode = request.body.decode('utf-8')
            body_data = json.loads(body_unicode)
            
            target_zip = body_data.get("zip_code") 
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)
    
        try:

            locations_to_query = async_to_sync(script.scrape_based_on_zip_code)("https://littlecaesars.com/en-us/", target_zip)

            cache.set(f"scrape_count_{ip}", count + 1, timeout=86400)

            scraped_items_queryset = ScrapedStore.objects.filter(zip_and_address__in=locations_to_query)
            scraped_items_list = list(scraped_items_queryset.values('zip_and_address', 'item_name', 'item_price', 'item_cal', 'store_id'))
            
            total_stores = scraped_items_queryset.values('zip_and_address').distinct().count()

            return JsonResponse({
                "status": "success",
                "message": f"Successfully fetched {total_stores} stores.",
                "results": scraped_items_list
            })
        
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            logger.exception("Scraper failed") 
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

#View for the Database page
@csrf_exempt
def dashboard_api(request):
    location_input = request.GET.get('location')
    max_price_input = request.GET.get('max_price')
    max_cal_input = request.GET.get('max_cal')
    item_name_input = request.GET.get('item_name')
    
    max_price = float(max_price_input) if max_price_input else None
    max_cal = float(max_cal_input) if max_cal_input else None

    filtered_entries = query_manager.advanced_store_search(
        location=location_input, 
        max_price=max_price,
        max_cal=max_cal,
        item_name=item_name_input
    )

    data_list = list(filtered_entries.values(
        'item_name', 
        'item_price', 
        'item_cal', 
        'zip_and_address',
        'scraped_at'
    ))

    return JsonResponse({
        "status": "success",
        "count": len(data_list),
        "filters_applied": {
            "location": location_input,
            "max_price": max_price,
            "max_cal": max_cal,
            "item_name":item_name_input
        },
        "results": data_list
    })

# Grab the very last item added to the database
def get_db_version(request):
    latest_item = ScrapedStore.objects.order_by('-id').first()
    
    if latest_item:
        return JsonResponse({"latest_scraped_at": latest_item.id})
    else:
        return JsonResponse({"latest_scraped_at": 0})