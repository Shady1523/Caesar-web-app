from django.shortcuts import render
from django.http import HttpResponse
from .scraper import script
from .models import ScrapedStore
from asgiref.sync import async_to_sync
from . import query_manager
from django.db.models import Avg
from django.http import JsonResponse

# Create your views here.

def database_view(request):
    selected_location = request.GET.get('location')
    max_price_input = request.GET.get('max_price')
    max_cal_input = request.GET.get('max_cal')
    sort_choice = request.GET.get('sort_by')

    max_price = float(max_price_input) if max_price_input else None
    max_cal = float(max_cal_input) if max_cal_input else None

    total_database_items = ScrapedStore.objects.count()
    
    filtered_entries = query_manager.advanced_store_search(
        location=selected_location, 
        max_price=max_price, 
        max_cal=max_cal, 
        sort_by=sort_choice
    )

    unique_locations = query_manager.unique_locations()

    cheapest_location_data = ScrapedStore.objects.values('zip_and_address').annotate(avg_price=Avg('item_price')).order_by('avg_price').first()

    cheapest_store_name = cheapest_location_data['zip_and_address'] if cheapest_location_data else "No Data"
    cheapest_avg_price = round(cheapest_location_data['avg_price'], 2) if cheapest_location_data else 0.00

    # Pass both the status message and the database rows to the HTML template
    return render(request, "django_app/total_stores.html", {
        "total_database_items": total_database_items,
        "unique_locations": unique_locations,
        "cheapest_name": cheapest_store_name,
        "cheapest_price": cheapest_avg_price,
        "filtered_entries": filtered_entries,
    })

def home_page_view(request):
    message = None

    context = {
        "result": None,
        "total_stores_near_zip": 0,
        "total_items_near_zip": 0,
        "cheapest_name": "No Data",
        "cheapest_price": 0.00,
        "locations_to_query": []
    }

    if request.method == "POST":
        target_zip = request.POST.get("user_zip")
        locations_to_query = async_to_sync(script.scrape_based_on_zip_code)("https://littlecaesars.com/en-us/", target_zip, True)
        total_stores_near_zip = ScrapedStore.objects.filter(zip_and_address__in=locations_to_query).values('zip_and_address').distinct().count()
        cheapest_location_data = ScrapedStore.objects.values('zip_and_address').annotate(avg_price=Avg('item_price')).order_by('avg_price').first()
        total_items_near_zip = ScrapedStore.objects.values(zip_and_address__in=locations_to_query).count()

        context["total_stores_near_zip"] = total_stores_near_zip
        context["total_items_near_zip"] = total_items_near_zip
        context["cheapest_name"] = cheapest_location_data['zip_and_address'] if cheapest_location_data else "No Data"
        context["cheapest_price"] = round(cheapest_location_data['avg_price'], 2) if cheapest_location_data else 0.00
        context["locations_to_query"] = locations_to_query

        # Pass both the status message and the database rows to the HTML template
    return render(request, "django_app/index.html", context)

def api_view(request):
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