from django.shortcuts import render
from django.http import HttpResponse
from .scraper import script
from .models import ScrapedStore
from asgiref.sync import async_to_sync
from . import query_manager
from django.db.models import Avg
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt

# Create your views here.

#View for the Scraper page
@csrf_exempt
def scraper_api(request):
    if request.method == "POST":
        
        try:
            body_unicode = request.body.decode('utf-8')
            body_data = json.loads(body_unicode)
            
            target_zip = body_data.get("zip_code") 
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)

        locations_to_query = async_to_sync(script.scrape_based_on_zip_code)("https://littlecaesars.com/en-us/", target_zip, True)

        scraped_items_queryset = ScrapedStore.objects.filter(zip_and_address__in=locations_to_query)
        scraped_items_list = list(scraped_items_queryset.values('zip_and_address', 'item_name', 'item_price', 'item_cal', 'store_id'))
        
        total_stores = scraped_items_queryset.values('zip_and_address').distinct().count()

        return JsonResponse({
            "status": "success",
            "message": f"Successfully scraped {total_stores} stores.",
            "results": scraped_items_list
        })

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