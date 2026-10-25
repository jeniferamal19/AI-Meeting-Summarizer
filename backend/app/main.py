from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.meetings import router
from app.routers.export import router as export_router
from app.routers.history import router as history_router
from app.routers.email import router as email_router
from app.db.database import engine
from app.db import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(router)
app.include_router(export_router)
app.include_router(history_router)
app.include_router(email_router)

@app.get("/")
def home():
    return {"message": "AI Meeting Summarizer API Running"}