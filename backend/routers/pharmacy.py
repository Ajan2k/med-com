from fastapi import APIRouter, Query
import json
import os
from pathlib import Path

router = APIRouter(prefix="/pharmacy", tags=["pharmacy"])

# Load mock_medicine.json at startup
MEDICINES_PATH = Path(__file__).parent.parent / "mock_medicine.json"

def load_medicines():
    try:
        with open(MEDICINES_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        # Add index field
        for i, item in enumerate(data):
            item["index"] = i + 1
        return data
    except Exception as e:
        print(f"Failed to load medicines: {e}")
        return []

MEDICINES_DB = load_medicines()
ORDERS_DB = []  # In-memory orders store


def extract_pack_size(product_name: str) -> tuple[str, str]:
    """Extract pack size from parentheses in product name.
    e.g. 'Vicks VapoRub (Pack of 1)' -> ('Vicks VapoRub', 'Pack of 1')
    """
    import re
    match = re.search(r'\(([^)]+)\)$', product_name.strip())
    if match:
        pack_size = match.group(1)
        base_name = product_name[:match.start()].strip()
        return base_name, pack_size
    # Try to find any parenthetical content
    match = re.search(r'\(([^)]+)\)', product_name)
    if match:
        pack_size = match.group(1)
        base_name = re.sub(r'\s*\([^)]+\)', '', product_name).strip()
        return base_name, pack_size
    return product_name, ""


def map_medicine(m: dict) -> dict:
    discount = 0
    if m.get("market_price", 0) > m.get("sale_price", 0):
        discount = round(((m["market_price"] - m["sale_price"]) / m["market_price"]) * 100)
    product_name = m.get("product_name", "")
    base_name, pack_size = extract_pack_size(product_name)
    return {
        "id": m.get("index", 0),
        "name": product_name,
        "baseName": base_name,
        "packSize": pack_size,
        "brand": m.get("brand", ""),
        "category": m.get("category", ""),
        "subCategory": m.get("sub_category", ""),
        "price": m.get("sale_price", 0),
        "originalPrice": m.get("market_price", 0),
        "image": m.get("image_url", f"https://placehold.co/400?text={base_name}"),
        "rating": m.get("ratings", 4.0),
        "stock": m.get("stock", 25), # Fallback stock
        "expiryDate": m.get("expiry_date", "12/2026"), # Fallback expiry
        "discount": discount,
        "selectedWeight": pack_size or "Std",
        "unitType": "unit",
        "perUnitSellingPrice": m.get("sale_price", 0),
        "perUnitOriginalPrice": m.get("market_price", 0),
    }


@router.get("/medicines")
def get_medicines(
    search: str = Query(None),
    category: str = Query(None),
    sub_category: str = Query(None),
    limit: int = Query(50)
):
    results = MEDICINES_DB

    if category:
        results = [m for m in results if m.get("category", "").lower() == category.lower()]

    if sub_category:
        results = [m for m in results if m.get("sub_category", "").lower() == sub_category.lower()]

    if search:
        search_terms = search.lower().split()
        results = [
            m for m in results
            if all(
                any(term in m.get(field, "").lower() for field in ["product_name", "brand", "category", "sub_category"])
                for term in search_terms
            )
        ]

    return [map_medicine(m) for m in results[:limit]]


@router.get("/categories")
def get_categories():
    cats = list({m.get("category", "") for m in MEDICINES_DB if m.get("category")})
    return sorted(cats)


@router.get("/subcategories")
def get_subcategories(category: str = Query(None)):
    if category:
        subs = list({m.get("sub_category", "") for m in MEDICINES_DB if m.get("category", "").lower() == category.lower() and m.get("sub_category")})
    else:
        subs = list({m.get("sub_category", "") for m in MEDICINES_DB if m.get("sub_category")})
    return sorted(subs)


@router.post("/orders")
def create_order(order_data: dict):
    import random
    order_id = random.randint(1000, 9999)
    order = {"id": order_id, **order_data}
    ORDERS_DB.append(order)
    return order


@router.get("/orders/{user_id}")
def get_orders(user_id: str):
    return [o for o in ORDERS_DB if o.get("user_id") == user_id]
