from django.db.models import Avg
from .models import ScrapedStore

#Returns every item in the database, newest first
def get_all_items():
    return ScrapedStore.objects.all().order_by('-scraped_at')

#Returns only items from a specific store address
def get_stores_by_location(location_name):
    return ScrapedStore.objects.filter(zip_and_address=location_name)

#Returns items cheaper than or equal to the given price
def get_items_under_price(max_price):
    # __lte means "Less Than or Equal to"
    return ScrapedStore.objects.filter(item_price__lte=max_price).order_by('item_price')

#Returns items with fewer calories than the limit
def get_items_under_calories(max_cal):
    return ScrapedStore.objects.filter(item_cal__lte=max_cal).order_by('item_cal')

#A dynamic query builder. It starts with all stores, and applies 
#filters one by one only if the user asked for them.
def advanced_store_search(near_zip_locations=None, location=None, max_price=None, max_cal=None, sort_by=None, item_name=None):
    if near_zip_locations:
        results = ScrapedStore.objects.values(zip_and_address__in=near_zip_locations)
    else:
        results = ScrapedStore.objects.all()

    if item_name:
        results = results.filter(item_name__icontains=item_name)

    if location and location != "ALL":
        results = results.filter(zip_and_address__icontains=location)

    if max_price:
        results = results.filter(item_price__lte=max_price)

    if max_cal:
        results = results.filter(item_cal__lte=max_cal)

    if sort_by == 'price_low':
        results = results.order_by('item_price')
    elif sort_by == 'price_high':
        results = results.order_by('-item_price')
    elif sort_by == 'cal_low':
        results = results.order_by('item_cal')
    elif sort_by == 'cal_high':
        results = results.order_by('-item_cal')
    else:
        results = results.order_by('-scraped_at')

    return results

#Returns the number of unique locations
def unique_locations():
    return ScrapedStore.objects.values_list('zip_and_address', flat=True).distinct()

#Takes any filtered list of stores and calculates the math for the UI cards
def get_dashboard_metrics(queryset):
    total_items = queryset.count()
    unique_locations = queryset.values_list('zip_and_address', flat=True).distinct()
    
    cheapest_data = queryset.values('zip_and_address').annotate(
        avg_price=Avg('item_price')
    ).order_by('avg_price').first()

    return {
        "total_items": total_items,
        "unique_locations": unique_locations,
        "cheapest_name": cheapest_data['zip_and_address'] if cheapest_data else "No Data",
        "cheapest_price": round(cheapest_data['avg_price'], 2) if cheapest_data else 0.00,
    }