import os

log_path = 'backend_log.txt'
if os.path.exists(log_path):
    try:
        with open(log_path, 'r', encoding='utf-16le') as f:
            lines = f.readlines()
            print("--- LOG FILE TAIL ---")
            for line in lines[-40:]:
                print(line.strip())
    except Exception as e:
        print(f"Failed to read as utf-16le: {e}")
        try:
            with open(log_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                print("--- LOG FILE TAIL (UTF-8) ---")
                for line in lines[-40:]:
                    print(line.strip())
        except Exception as e2:
            print(f"Failed to read as utf-8: {e2}")
else:
    print(f"File {log_path} not found")
