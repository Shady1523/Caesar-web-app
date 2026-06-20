import asyncio
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
import re
from ..models import ScrapedStore
import random
from playwright_stealth import Stealth
import logging
from logging.handlers import RotatingFileHandler
from datetime import timedelta
from django.utils import timezone
import gc

#REGEX patterns for extracting information
PRICE_PATTERN = re.compile(r"\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?")
CALORIE_PATTERN = re.compile(r"\d{3,4}\s*Cal(?:ories)?", re.IGNORECASE)
MENU_PATTERN = re.compile( r'^.+?(?=\s*\d+\s*Cal)', re.IGNORECASE)

#Number of allowed concurrent scrapers
NUM_SEMAPHORE = 3

#Number of stores to scrape
NUM_STORES_TO_SCRAPE = 5

logger = logging.getLogger(__name__)
def logging_setup():
    file_handler = RotatingFileHandler(
    "scraper_pipeline.log",
    maxBytes=5 * 1024 * 1024,
    backupCount=3
    )
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
        handlers=[file_handler, logging.StreamHandler()]
    )

#User agents for rotation
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
]

#Timeout time for slower and faster page elements
def timeout_slow(): return random.uniform(4.0, 4.5)
def timeout_fast(): return random.uniform(1.0, 2.2)

#HELPER function that extracts product prices, calories, and food names from a given store.
async def extract_product_prices(page, zip_code):
    
    menu_texts = []
    menu_locator = page.locator('xpath=//div[@role="group"]')

    try:
        # This will pause the script UNTIL the menu element physically exists on the page (up to 15 seconds)
        await menu_locator.first.wait_for(state="visible", timeout=15000)
        # Now that we know it's visible, extract all of them
        menu_elements = await menu_locator.filter(has_text=PRICE_PATTERN).filter(has_text=CALORIE_PATTERN).filter(has_text=MENU_PATTERN).all()
        for element in menu_elements:
            menu_texts.append(await element.text_content())

    except PlaywrightTimeoutError:
        logger.warning(f"Menu items failed to load for {zip_code} within 15 seconds.")
        return

    return menu_texts

#HELPER function that saves the scraped menu items to the database
async def database_save(raw_menu_items, zip_and_addresses, store_ids):
    if zip_and_addresses:
        for i in range(len(zip_and_addresses)):
            zip_and_address = zip_and_addresses[i]
            store_id = store_ids[i]
            raw_menu = raw_menu_items[i]

            try:
                saved_count = 0

                data_to_update = []

                for item in raw_menu:
                    price_match = PRICE_PATTERN.search(item)
                    cal_match = CALORIE_PATTERN.search(item)
                    name_match = MENU_PATTERN.search(item)

                    if not all([price_match, cal_match, name_match]):
                        logging.warning(f"Skipping malformed item: {item[:80]}")
                        continue

                    price = price_match.group()
                    cal = cal_match.group()
                    
                    clean_price = float(price.replace("$", "").strip())
                    clean_cal = float(cal.split()[0])
                    name = name_match.group().strip()

                    data_object = ScrapedStore(
                        zip_and_address = zip_and_address,
                        item_name = name,
                        item_price = clean_price,
                        item_cal = clean_cal,
                        store_id = store_id
                    )

                    saved_count += 1
                    data_to_update.append(data_object)

                if data_to_update:
                    await ScrapedStore.objects.abulk_create(
                        data_to_update,
                        update_conflicts = True,
                        unique_fields = ["zip_and_address", "item_name"],
                        update_fields = ["item_price", "item_cal", "store_id"]
                    )

                logger.info(f"Successfully processed and saved {saved_count} items for store {zip_and_address}.")
            
            except Exception as e:
                logger.warning(f"Database save failed for {zip_and_address}: {e}")

    else:
        logger.warning("No zip codes provided for database save.")

#HELPER function that blocks heavy resources from loading to speed up the scraping process
async def block_heavy_resources(route):
    if route.request.resource_type in ["image", "stylesheet", "font", "media"]:
        await route.abort()
    else:
        await route.continue_()

#HELPER function that is used to launch the browser and page to avoid redundancy
async def new_stealth_context(browser, **kwargs):
    context = await browser.new_context(
        user_agent=random.choice(USER_AGENTS),
        viewport={"width": 1024, "height": 768},
        **kwargs
    )
    page = await context.new_page()
    await page.route("**/*", block_heavy_resources)
    return context, page

#HELPER function used in "scrape_based_on_zip_code" main function that grabs every
#store given after searching a given zip code.
#Specifically, it takes the store's URL and zip code and returns them in a list,
#where the number of returned elements is limited to a certain number.
async def url_scraper(page, NUMBER_OF_STORES_TO_SCRAPE):
    
    stores_to_scrape = []

    try:
        await page.wait_for_url("**/menu/**", timeout=2500)
        logger.info("Auto-redirected directly to a single store menu!")
        # Extract the store ID right out of the URL
        store_id = page.url.split("/stores/")[1].split("/")[0]
        # We have to guess the zip code and address since we skipped the list page
        stores_to_scrape.append(("Auto-Zip", page.url, "Auto-Selected Location", store_id))
        return stores_to_scrape
    
    except PlaywrightTimeoutError:
        pass

    store_list = page.get_by_test_id("locator__storeslist")
    await store_list.wait_for(state="visible", timeout=15000)

    # 2. Now scroll to the bottom to trigger the lazy load
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

    # 3. Wait for the background network requests to finish fetching the new stores
    try:
        await page.wait_for_load_state("networkidle", timeout=5000)
    except PlaywrightTimeoutError:
        pass # Ignore timeout if networkidle takes too long, DOM is likely loaded anyway

    # 4. Now grab the stores
    ul_with_store_ids = await store_list.locator("li").all()
    logger.debug(f"Found {len(ul_with_store_ids)} stores near the given zip code")

    if ul_with_store_ids is not None:
        for store in ul_with_store_ids[:NUMBER_OF_STORES_TO_SCRAPE]:
            store_id = await store.get_attribute("data-testid")
            if store_id:
                store_id = store_id.split("-")[-1]
                store_url = f"https://littlecaesars.com/en-us/order/pickup/stores/{store_id}/menu/"
                zip_code_field = await store.get_by_test_id(f"locator__cityStateZip-{store_id}").inner_text()
                zip_code = zip_code_field.split()[-1]
                address = await store.get_by_test_id(f"locator__streetAddress-{store_id}").inner_text()
                stores_to_scrape.append((zip_code, store_url, address, store_id))
                logger.info(f"Store {store_id} was successfully added.")
            else:
                logger.warning("The store id for this store was not found.")
    else:
        logger.warning("No stores found.")

    logger.info(f"Successfully extracted {len(stores_to_scrape)} store urls.")

    return stores_to_scrape

#HELPER function that extract prices, calories, and food names from a given store.
#Once extracted, it adds the information to a database.
#Used in the "scrape_based_on_zip_code" main function
async def process_store_directly(browser, url_to_scrape, zip_code, address, store_id):
    logger.info(f"Worker launched for store {url_to_scrape}")
    context, page = None, None
    raw_menu_items = []

    try:
        context, page = await new_stealth_context(browser)
        await page.goto(url_to_scrape)
        await asyncio.sleep(timeout_fast())
        raw_menu_items = await extract_product_prices(page, zip_code)

    except Exception as e:
        logger.exception(f"Scraper failed on {url_to_scrape}: {e}.")

    finally:
        if context:
            await asyncio.wait_for(context.close(), timeout=1.0)

    if raw_menu_items:
        return raw_menu_items
    
    else:
        logger.warning(f"No matches found.")
        return None

#To limit the number of concurrent scraping tasks so the server CPU usage is kept in check.
scraper_semaphore = asyncio.Semaphore(NUM_SEMAPHORE)

#HELPER function that wraps the actual scraping function and limits the number of concurrent tasks.
async def process_store_safely(browser, url_to_scrape, zip_code, address, store_id):
    async with scraper_semaphore:
        return await process_store_directly(browser, url_to_scrape, zip_code, address, store_id)

#MAIN function that opens a browser to scrape multiple stores near a given zip_code.
async def scrape_based_on_zip_code(website, zip_code, check_if_in_db=False):
    if not zip_code:
        logger.warning("You did not enter a zip code.")
        return
    elif len(zip_code) != 5:
        logger.warning("Invalid Zip Code.")
        return

    logger.info("Opening chromium.")

    async with Stealth().use_async(async_playwright()) as p:
        browser = await p.chromium.launch(headless=True, args=[
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-accelerated-2d-canvas',
        '--disable-accelerated-jpeg-decoding',
        '--disable-accelerated-mjpeg-decode',
        '--disable-accelerated-video-decode',
    ])
        context, page = None, None

        try:
            context, page = await new_stealth_context(browser)
            await page.goto(f"{website}order/pickup/")
            await asyncio.sleep(timeout_fast())
            await page.fill("//input[@type='text']", zip_code)
            dropdown_option = page.get_by_text(zip_code).first
            await dropdown_option.wait_for(state="visible", timeout=10000)
            await dropdown_option.first.click()

            stores_to_scrape = await url_scraper(page, NUM_STORES_TO_SCRAPE)
            if not stores_to_scrape:
                logger.warning("There are no urls to scrape.")
                logger.warning("Unfortunately your area does not have any locations within a reasonable radius.")
                return

            tasks = []

            #only useful when check_if_in_db is True
            zip_and_addresses = []
            store_ids = []

            if stores_to_scrape is not None:
                for store in stores_to_scrape:
                    store_identifier = f"{store[0]} | {store[2]}"
                    if check_if_in_db:
                        fresh_entry = await ScrapedStore.objects.filter(zip_and_address__icontains=store_identifier, scraped_at__gte=timezone.now()-timedelta(days=7)).aexists()
                        if fresh_entry:
                            zip_and_addresses.append(store_identifier)
                        else:
                            await ScrapedStore.objects.filter(zip_and_address__icontains=store_identifier).adelete()
                            tasks.append(process_store_safely(browser, store[1], store[0], store[2], store[3]))
                            store_ids.append(store[3])
                            zip_and_addresses.append(store_identifier)
                    else:
                        tasks.append(process_store_safely(browser, store[1], store[0], store[2], store[3]))
                        store_ids.append(store[3])
            else:
                logger.warning("No stores to scrape.")
                return
            
            if zip_and_addresses and not tasks:
                return zip_and_addresses
            
            elif tasks:
                logger.debug(f"Firing off {len(tasks)} tasks at once.")
                scrape_results = await asyncio.gather(*tasks)

                gc.collect()
                logger.debug("Garbage collection completed after scraping tasks.")

                await database_save(scrape_results, zip_and_addresses, store_ids)

                if zip_and_addresses:
                    return zip_and_addresses

        except Exception as e:
            logger.exception(f"The task failed: {e}")
            return []
        finally:
            if page:
                await asyncio.wait_for(page.close(), timeout=1.0)
            if context:
                await asyncio.wait_for(context.close(), timeout=1.0)
            if browser:
                await asyncio.wait_for(browser.close(), timeout=1.0)
            
            gc.collect()
            logger.debug("Garbage collection performed after browser cleanup.")

    logger.info("All tasks are completed.")

if __name__ == "__main__":
    logging_setup()
    logger.info("Logger initialized.")