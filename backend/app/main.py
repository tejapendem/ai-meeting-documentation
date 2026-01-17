from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="AI Meeting to Documentation")

# ✅ CORS CONFIG (THIS FIXES YOUR ERROR)
app.add_middleware(
    CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",  # dev
            "http://localhost:3000",
            "http://localhost"        # Electron
        ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
