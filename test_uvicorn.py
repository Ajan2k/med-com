import subprocess
import time

try:
    process = subprocess.Popen(["python", "-m", "uvicorn", "backend.app:app", "--host", "127.0.0.1", "--port", "8000"],
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE,
                               text=True)
    time.sleep(3)
    if process.poll() is not None:
        out, err = process.communicate()
        with open("uvicorn_test.txt", "w") as f:
            f.write(f"Crashed with RC: {process.returncode}\nOUT: {out}\nERR: {err}")
    else:
        process.terminate()
        out, err = process.communicate()
        with open("uvicorn_test.txt", "w") as f:
            f.write(f"Ran successfully for 3s.\nOUT: {out}\nERR: {err}")
except Exception as e:
    with open("uvicorn_test.txt", "w") as f:
        f.write(f"Exception: {e}")
