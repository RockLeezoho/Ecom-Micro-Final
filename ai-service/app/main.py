from fastapi import FastAPI
from app.api.urls import router as api_router
from app.grpc.server import stop_grpc_server, start_grpc_server

app = FastAPI(title="AI Service")

app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
def startup_grpc_server():
    start_grpc_server()


@app.on_event("shutdown")
def shutdown_grpc_server():
    stop_grpc_server()

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)