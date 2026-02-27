import os

log_path = 'backend_log.txt'
out_path = 'backend_log_tail.txt'
if os.path.exists(log_path):
    with open(log_path, 'r', encoding='utf-16le') as f:
        # read and remove BOM if present
        content = f.read()
        if content.startswith('\ufeff'):
            content = content[1:]
        lines = content.split('\n')
        with open(out_path, 'w', encoding='utf-8') as out:
            for line in lines[-100:]:
                out.write(line + '\n')
    print("Wrote tail to backend_log_tail.txt")
