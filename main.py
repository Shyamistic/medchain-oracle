from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "MedChain Oracle Backend - Live", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "medchain-oracle-api"}

@app.post("/verify")
async def verify_drug(file: UploadFile = File(...)):
    # Mock ML inference - replace with real model later
    confidence = random.uniform(0.55, 0.95)
    is_authentic = confidence > 0.5
    
    return {
        "authentic": is_authentic,
        "confidence": round(confidence * 100, 1),
        "risk_level": "LOW" if is_authentic else "HIGH",
        "anomaly_score": round(random.uniform(0.1, 0.5), 3),
        "blockchain_hash": f"0x{random.randint(10**63, 10**64-1):064x}"
    }

@app.get("/shortage-prediction")
def predict_shortage():
    return {
        "drug": "Insulin Glargine 100U/mL",
        "location": "Mumbai Central",
        "risk_score": 85.0,
        "recommendation": "URGENT: Order 259 units immediately"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
