from fastapi import FastAPI
from app.api.urls import router as api_router

app = FastAPI(title="AI Service")

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)