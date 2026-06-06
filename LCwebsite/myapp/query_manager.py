from django.db.models import Avg
from .models import ScrapedStore

def get_all_items():
    """Returns every item in the database, newest first."""
    return ScrapedStore.objects.all().order_by('-scraped_at')

def get_stores_by_location(location_name):
    """Returns only items from a specific store address."""
    return ScrapedStore.objects.filter(zip_and_address=location_name)

def get_items_under_price(max_price):
    """Returns items cheaper than or equal to the given price."""
    # __lte means "Less Than or Equal to"
    return ScrapedStore.objects.filter(item_price__lte=max_price).order_by('item_price')

def get_items_under_calories(max_cal):
    """Returns items with fewer calories than the limit."""
    return ScrapedStore.objects.filter(item_cal__lte=max_cal).order_by('item_cal')

def advanced_store_search(near_zip_locations=None, location=None, max_price=None, max_cal=None, sort_by=None):
    """
    A dynamic query builder. It starts with all stores, and applies 
    filters one by one only if the user asked for them.
    """
    # Start by grabbing everything
    if near_zip_locations:
        results = ScrapedStore.objects.values(zip_and_address__in=near_zip_locations)
    else:
        results = ScrapedStore.objects.all()

    # If a location was provided, filter the results down
    if location and location != "ALL":
        results = results.filter(zip_and_address=location)

    # If a max price was provided, filter them down further
    if max_price:
        results = results.filter(item_price__lte=max_price)

    # If a max calorie count was provided, filter them down again
    if max_cal:
        results = results.filter(item_cal__lte=max_cal)

    # Finally, sort the remaining data if a sort method was provided
    if sort_by == 'price_low':
        results = results.order_by('item_price')
    elif sort_by == 'price_high':
        results = results.order_by('-item_price')
    elif sort_by == 'cal_low':
        results = results.order_by('item_cal')
    elif sort_by == 'cal_high':
        results = results.order_by('-item_cal')
    else:
        # Default sorting by newest scraped
        results = results.order_by('-scraped_at')

    return results

def unique_locations():
    return ScrapedStore.objects.values_list('zip_and_address', flat=True).distinct()

def get_dashboard_metrics(queryset):
    """
    Takes any filtered list of stores and calculates the math for the UI cards.
    """
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