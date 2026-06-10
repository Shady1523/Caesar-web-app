import asyncio
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
import re
from ..models import ScrapedStore
import random
from playwright_stealth import Stealth
import logging
from logging.handlers import RotatingFileHandler
from asgiref.sync import sync_to_async

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
def timeout_slow(): return random.uniform(2.0, 3.7)
def timeout_fast(): return random.uniform(1.0, 2.2)

#MAIN Function that is used to extract prices, calories, and food names from a given store.
#Once extracted, it adds the information to a database.
async def extract_product_prices(page, zip_code, address):
    price_pattern = re.compile(r"\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?")
    calorie_pattern = re.compile(r"\d{3,4}\s*Cal(?:ories)?", re.IGNORECASE)
    menu_pattern = re.compile( r'^.+?(?=\s*\d+\s*Cal)', re.IGNORECASE)

    menu = []

    #So that the page loads and the menu elements appear
    await asyncio.sleep(2)

    menu_elements = await page.locator('xpath=//div[@role="group"]').filter(has_text=price_pattern).filter(has_text=calorie_pattern).filter(has_text=menu_pattern).all()

    if menu_elements:
        for element in menu_elements:
            text = await element.text_content()
            menu.append(text)

        for item in menu:
            price_match = price_pattern.search(item)
            cal_match = calorie_pattern.search(item)
            name_match = menu_pattern.search(item)

            if not all([price_match, cal_match, name_match]):
                logging.warning(f"Skipping malformed item: {item[:80]}")
                continue

            price = price_match.group()
            cal = cal_match.group()
            name = name_match.group()

            clean_price = float(price.replace("$", "").strip())
            clean_cal = float(cal.split()[0])
            store_name = zip_code + " | " + address

            await ScrapedStore.objects.acreate(
                zip_and_address = store_name,
                item_name = name,
                item_price = clean_price,
                item_cal = clean_cal
            )
            logger.info(f"Store {store_name} was successfully added to the database.")

    else:
        logger.warning(f"No matches found.")

#HELPER function that is used to launch the browser and page to avoid redundancy
async def new_stealth_context(browser, **kwargs):
    context = await browser.new_context(
        user_agent=random.choice(USER_AGENTS),
        viewport={"width": 1920, "height": 1080},
        **kwargs
    )
    page = await context.new_page()
    return context, page

#HELPER function used in "scrape_based_on_zip_code" main function that grabs every
#store given after searching a given zip code.
#Specifically, it takes the store's URL and zip code and returns them in a list,
#where the number of returned elements is limited to a certain number.
async def url_scraper(page, NUMBER_OF_STORES_TO_SCRAPE):

    stores_to_scrape = []

    ul_with_store_ids = await page.get_by_test_id("locator__storeslist").locator("li").all()
    logger.debug(f"Found {len(ul_with_store_ids)} stores near the given zip code")

    for store in ul_with_store_ids[:NUMBER_OF_STORES_TO_SCRAPE]:
        store_id = await store.get_attribute("data-testid")
        if store_id:
            store_id = store_id.split("-")[-1]
            store_url = f"https://littlecaesars.com/en-us/order/pickup/stores/{store_id}/menu/"
            zip_code_field = await store.get_by_test_id(f"locator__cityStateZip-{store_id}").inner_text()
            zip_code = zip_code_field.split()[-1]
            address = await store.get_by_test_id(f"locator__streetAddress-{store_id}").inner_text()
            stores_to_scrape.append((zip_code, store_url, address))
            logger.info(f"Store {store_id} was successfully added.")
        else:
            logger.warning("The store id for this store was not found.")

    logger.info(f"Successfully extracted {len(stores_to_scrape)} store urls.")

    return stores_to_scrape

#HELPER function that goes to the given URL and scrapes the menu.
#Used in the "scrape_based_on_zip_code" main function
async def process_store_directly(browser, url_to_scrape, zip_code, address):
    logger.info(f"Worker launched for store {url_to_scrape}")
    context, page = None, None

    try:
        context, page = await new_stealth_context(browser)
        await page.goto(url_to_scrape)
        await asyncio.sleep(timeout_fast())
        await extract_product_prices(page, zip_code, address)

    except Exception as e:
        logger.exception(f"Scraper failed on {url_to_scrape}: {e}.")

    finally:
        if context:
            await context.close()

#MAIN function that opens a browser to scrape multiple stores near a given zip_code.
async def scrape_based_on_zip_code(website, zip_code, check_if_in_db=False):
    if not zip_code:
        logger.warning("You did not enter a zip code.")
        return

    logger.info("Opening chromium.")

    async with Stealth().use_async(async_playwright()) as p:
        browser = await p.chromium.launch(headless=True)
        context, page = None, None

        try:
            context, page = await new_stealth_context(browser)
            await page.goto(website)
            await page.get_by_text("Pickup").click()
            await page.fill("//input[@type='text']", zip_code)
            await asyncio.sleep(timeout_fast())
            await page.get_by_text(zip_code).click()
            await asyncio.sleep(timeout_slow())

            stores_to_scrape = await url_scraper(page, NUM_STORES_TO_SCRAPE)
            if not stores_to_scrape:
                logger.warning("There are no urls to scrape.")
                logger.warning("Unfortunately your area does not have any locations within a reasonable radius.")
                return

            tasks = []

            #only useful when check_if_in_db is True
            zip_and_addresses = []

            for store in stores_to_scrape:
                if check_if_in_db:
                    is_in_db = ScrapedStore.objects.filter(zip_and_address__icontains=store[2]).aexists()
                    if is_in_db:
                        zip_and_addresses.append(f"{store[0]} | {store[2]}")
                    elif not is_in_db:
                        tasks.append(process_store_directly(browser, store[1], store[0], store[2]))
                        zip_and_addresses.append(f"{store[0]} | {store[2]}")
                else:
                    tasks.append(process_store_directly(browser, store[1], store[0], store[2]))
            
            if zip_and_addresses and not tasks:
                return zip_and_addresses
            
            elif tasks:
                logger.debug(f"Firing off {len(tasks)} tasks at once.")
                await asyncio.gather(*tasks)
                if zip_and_addresses:
                    return zip_and_addresses

        except Exception as e:
            logger.exception(f"The task failed: {e}")
        finally:
            if context:
                await context.close()
            await browser.close()

    logger.info("All tasks are completed.")

    return f"Successfully scraped stores near ZIP: {zip_code}"

if __name__ == "__main__":
    logging_setup()
    logger.info("Logger initialized.")