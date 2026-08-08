from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.meetings import router
from app.routers.export import router as export_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(export_router)

@app.get("/")
def home():
    return {
        "message": "AI Meeting Summarizer API Running"
    }