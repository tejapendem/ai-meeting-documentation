import uvicorn
import os
import sys
import multiprocessing
from dotenv import load_dotenv

# 🟢 FIX: Add standard Mac paths so the App can find FFmpeg
# This tells the app to look in Homebrew folders
os.environ["PATH"] += os.pathsep + "/usr/local/bin" + os.pathsep + "/opt/homebrew/bin"

# 🟢 PROOF OF LIFE LOG
print("--- PYTHON BACKEND IS STARTING ---", flush=True)

# 1. Setup path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# 2. Load .env
if getattr(sys, 'frozen', False):
    application_path = os.path.dirname(sys.executable)
else:
    application_path = os.path.dirname(os.path.abspath(__file__))

env_path = os.path.join(application_path, '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)

# 3. Import app
from app.main import app

if __name__ == "__main__":
    multiprocessing.freeze_support()
    # Force logs to show immediately
    uvicorn.run(app, host="127.0.0.1", port=8000, workers=1, log_level="info")