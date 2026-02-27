import requests

try:
    url = "http://localhost:8000/admin/update_status"
    params = {
        "item_type": "appointment",
        "item_id": 13,
        "new_status": "processing"
    }
    r = requests.post(url, params=params)
    print(r.status_code)
    print(r.text)
except Exception as e:
    print(e)
