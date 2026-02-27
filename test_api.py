import urllib.request
import json
import traceback

def test_api():
    endpoints = [
        "http://localhost:8000/admin/appointments",
        "http://localhost:8000/admin/pharmacy_queue",
        "http://localhost:8000/pharmacy/medicines"
    ]
    for url in endpoints:
        print(f"Testing {url}...")
        try:
            resp = urllib.request.urlopen(url)
            data = resp.read()
            parsed = json.loads(data)
            print(f"SUCCESS: received {len(parsed)} items")
            if len(parsed) > 0:
                print(f"Sample: {str(parsed[0])[:150]}")
        except Exception as e:
            print(f"FAILED: {e}")
            traceback.print_exc()

if __name__ == "__main__":
    test_api()
