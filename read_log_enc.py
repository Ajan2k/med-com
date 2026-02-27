import os

log_file = 'backend_log.txt'
if os.path.exists(log_file):
    try:
        # Try different encodings
        for enc in ['utf-16', 'utf-16-le', 'utf-8']:
            try:
                with open(log_file, 'r', encoding=enc) as f:
                    content = f.read()
                    print(f"--- Log ({enc}) ---\n")
                    # Print last 50 lines
                    lines = content.splitlines()
                    for line in lines[-50:]:
                        print(line)
                break
            except Exception:
                continue
    except Exception as e:
        print(f"Error reading log: {e}")
else:
    print(f"Log file {log_file} not found.")
