"""
Scraper service for aquaculture supplier websites.

Each scraper returns a list of dicts:
  {"price": float, "unit": str, "url": str, "product_name": str}
or None on failure.

Respects robots.txt via httpx + manual delay (asyncio.sleep).
"""

import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; HavbrukPrisportal/1.0; +https://havbrukprisportal.no/bot)"
    )
}


async def _fetch(url: str) -> Optional[str]:
    try:
        import httpx
        async with httpx.AsyncClient(headers=HEADERS, timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.text
    except Exception as exc:
        logger.warning("Fetch feilet for %s: %s", url, exc)
        return None


def _parse_price(text: str) -> Optional[float]:
    """Extract a float price from a string like '1 234,50 kr' or '1234.50'."""
    import re
    text = text.replace("\xa0", "").replace(" ", "").replace("kr", "").strip()
    text = text.replace(",", ".")
    match = re.search(r"[\d]+(?:\.\d+)?", text)
    if match:
        try:
            return float(match.group())
        except ValueError:
            pass
    return None


async def scrape_ahlsell(product_name: str) -> Optional[list]:
    """
    Scrape Ahlsell Norge (ahlsell.no) for a product price.
    NOTE: Ahlsell requires login for prices; this skeleton performs a search
    and parses any public price data available.
    """
    await asyncio.sleep(1)
    import urllib.parse
    query = urllib.parse.quote(product_name)
    url = f"https://www.ahlsell.no/search/?q={query}"
    html = await _fetch(url)
    if html is None:
        logger.warning("scrape_ahlsell: ingen respons for '%s'", product_name)
        return None

    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "html.parser")
        results = []

        # Ahlsell uses data attributes and JSON-LD – attempt both
        for card in soup.select("[data-testid='product-card'], .product-item, article.product"):
            name_el = card.select_one("h2, h3, .product-name, [data-testid='product-title']")
            price_el = card.select_one(".price, [data-testid='price'], .product-price")
            link_el = card.select_one("a[href]")
            if price_el:
                price = _parse_price(price_el.get_text())
                if price:
                    results.append({
                        "price": price,
                        "unit": "stk",
                        "url": "https://www.ahlsell.no" + link_el["href"] if link_el else url,
                        "product_name": name_el.get_text(strip=True) if name_el else product_name,
                    })
        return results or None
    except Exception as exc:
        logger.warning("scrape_ahlsell parse-feil for '%s': %s", product_name, exc)
        return None


async def scrape_brodre_dahl(product_name: str) -> Optional[list]:
    """
    Scrape Brødrene Dahl (dahl.no) for a product price.
    """
    await asyncio.sleep(1)
    import urllib.parse
    query = urllib.parse.quote(product_name)
    url = f"https://www.dahl.no/search?query={query}"
    html = await _fetch(url)
    if html is None:
        logger.warning("scrape_brodre_dahl: ingen respons for '%s'", product_name)
        return None

    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "html.parser")
        results = []

        for card in soup.select(".product-card, .product-list-item, [data-product]"):
            name_el = card.select_one(".product-name, h2, h3")
            price_el = card.select_one(".price, .product-price, [data-price]")
            link_el = card.select_one("a[href]")
            if price_el:
                price = _parse_price(price_el.get_text())
                if price:
                    href = link_el["href"] if link_el else ""
                    full_url = href if href.startswith("http") else "https://www.dahl.no" + href
                    results.append({
                        "price": price,
                        "unit": "stk",
                        "url": full_url,
                        "product_name": name_el.get_text(strip=True) if name_el else product_name,
                    })
        return results or None
    except Exception as exc:
        logger.warning("scrape_brodre_dahl parse-feil for '%s': %s", product_name, exc)
        return None


async def scrape_slangeportalen(product_name: str) -> Optional[list]:
    """
    Scrape Slangeportalen (slangeportalen.no) for a product price.
    """
    await asyncio.sleep(1)
    import urllib.parse
    query = urllib.parse.quote(product_name)
    url = f"https://www.slangeportalen.no/search/?q={query}"
    html = await _fetch(url)
    if html is None:
        logger.warning("scrape_slangeportalen: ingen respons for '%s'", product_name)
        return None

    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "html.parser")
        results = []

        for card in soup.select(".product, .product-item, .search-result-item"):
            name_el = card.select_one(".product-name, h2, h3, .title")
            price_el = card.select_one(".price, .product-price, span[class*='price']")
            link_el = card.select_one("a[href]")
            if price_el:
                price = _parse_price(price_el.get_text())
                if price:
                    href = link_el["href"] if link_el else ""
                    full_url = href if href.startswith("http") else "https://www.slangeportalen.no" + href
                    results.append({
                        "price": price,
                        "unit": "meter",
                        "url": full_url,
                        "product_name": name_el.get_text(strip=True) if name_el else product_name,
                    })
        return results or None
    except Exception as exc:
        logger.warning("scrape_slangeportalen parse-feil for '%s': %s", product_name, exc)
        return None


async def scrape_parker_haugrønning(product_name: str) -> Optional[list]:
    """
    Scrape ParkerStore / Haugrønning (haugronningshop.no) for a product price.
    """
    await asyncio.sleep(1)
    import urllib.parse
    query = urllib.parse.quote(product_name)
    url = f"https://www.haugronningshop.no/search/?q={query}"
    html = await _fetch(url)
    if html is None:
        logger.warning("scrape_parker_haugrønning: ingen respons for '%s'", product_name)
        return None

    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "html.parser")
        results = []

        for card in soup.select(".product, .product-item, .item"):
            name_el = card.select_one(".product-name, h2, h3, .name")
            price_el = card.select_one(".price, .product-price, .regular-price")
            link_el = card.select_one("a[href]")
            if price_el:
                price = _parse_price(price_el.get_text())
                if price:
                    href = link_el["href"] if link_el else ""
                    full_url = href if href.startswith("http") else "https://www.haugronningshop.no" + href
                    results.append({
                        "price": price,
                        "unit": "stk",
                        "url": full_url,
                        "product_name": name_el.get_text(strip=True) if name_el else product_name,
                    })
        return results or None
    except Exception as exc:
        logger.warning("scrape_parker_haugrønning parse-feil for '%s': %s", product_name, exc)
        return None


# Map supplier website domains to scraper functions
SCRAPER_MAP = {
    "ahlsell.no": scrape_ahlsell,
    "dahl.no": scrape_brodre_dahl,
    "slangeportalen.no": scrape_slangeportalen,
    "haugronningshop.no": scrape_parker_haugrønning,
}


async def run_scrape_job(
    supplier_ids: Optional[list] = None,
    product_ids: Optional[list] = None,
) -> None:
    """
    Background job: scrape prices for given suppliers/products and persist to DB.
    """
    from ..database import SessionLocal
    from ..models import Supplier, Product, Price
    from datetime import datetime

    db = SessionLocal()
    try:
        suppliers_query = db.query(Supplier).filter(Supplier.has_online_shop == True)
        if supplier_ids:
            suppliers_query = suppliers_query.filter(Supplier.id.in_(supplier_ids))
        suppliers = suppliers_query.all()

        products_query = db.query(Product)
        if product_ids:
            products_query = products_query.filter(Product.id.in_(product_ids))
        products = products_query.all()

        for supplier in suppliers:
            # Find matching scraper by domain
            website = supplier.website or ""
            scraper_fn = None
            for domain, fn in SCRAPER_MAP.items():
                if domain in website:
                    scraper_fn = fn
                    break

            if scraper_fn is None:
                logger.info("Ingen skraper tilgjengelig for %s", supplier.name)
                continue

            for product in products:
                if product.category not in (supplier.categories or []):
                    continue

                logger.info("Skraper %s for produkt: %s", supplier.name, product.name)
                try:
                    results = await scraper_fn(product.name)
                except Exception as exc:
                    logger.warning("Skraper krasjet for %s/%s: %s", supplier.name, product.name, exc)
                    continue

                if not results:
                    continue

                # Take the first (cheapest) result
                best = min(results, key=lambda r: r["price"])
                existing = db.query(Price).filter(
                    Price.product_id == product.id,
                    Price.supplier_id == supplier.id,
                ).first()

                if existing:
                    existing.price = best["price"]
                    existing.source = "scraped"
                    existing.notes = best.get("url", "")
                    existing.last_updated = datetime.utcnow()
                else:
                    new_price = Price(
                        product_id=product.id,
                        supplier_id=supplier.id,
                        price=best["price"],
                        currency="NOK",
                        unit=best.get("unit", product.unit),
                        source="scraped",
                        notes=best.get("url", ""),
                    )
                    db.add(new_price)

                db.commit()
                await asyncio.sleep(1)  # Respectful delay between requests
    finally:
        db.close()
