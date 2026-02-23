import sys
import traceback

try:
    from backend.reset_admin import reset_admin
    reset_admin()
except BaseException as e:
    with open("error.txt", "w") as f:
        traceback.print_exc(file=f)
