from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class Transaction(BaseModel):
    id: str
    amount: float
    merchant: str
    category: Optional[str] = None
    date: str

class CategorizationRequest(BaseModel):
    transactions: List[Transaction]

class AnomalyRequest(BaseModel):
    transactions: List[Transaction]

class ForecastRequest(BaseModel):
    transactions: List[Transaction]
    budget_limit: float
    days_in_month: int = 30

# --- Categorization ---
CATEGORY_KEYWORDS = {
    "FOOD_AND_DRINK": ["restaurant", "cafe", "coffee", "pizza", "burger", "kfc", "mcdonald", "starbucks", "food", "drink", "tim hortons"],
    "TRANSPORTATION": ["uber", "lyft", "taxi", "gas", "fuel", "parking", "transit", "subway", "bus"],
    "ENTERTAINMENT": ["netflix", "spotify", "cinema", "movie", "game", "steam"],
    "RENT_AND_UTILITIES": ["rent", "hydro", "electric", "water", "internet", "rogers", "bell", "telus"],
    "PERSONAL_CARE": ["pharmacy", "drugstore", "salon", "barber", "shoppers"],
    "GENERAL_MERCHANDISE": ["amazon", "walmart", "costco", "target", "bestbuy"],
    "TRAVEL": ["hotel", "airbnb", "flight", "airline", "airfare"],
}

def categorize(merchant: str, existing_category: Optional[str]) -> str:
    if existing_category and existing_category != "Other":
        return existing_category
    merchant_lower = merchant.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in merchant_lower for kw in keywords):
            return category
    return "OTHER"

@app.post("/categorize")
def categorize_transactions(req: CategorizationRequest):
    results = []
    for txn in req.transactions:
        results.append({
            "id": txn.id,
            "category": categorize(txn.merchant, txn.category)
        })
    return {"results": results}

# --- Anomaly Detection ---
@app.post("/detect-anomalies")
def detect_anomalies(req: AnomalyRequest):
    if not req.transactions:
        return {"anomalies": []}

    amounts = [t.amount for t in req.transactions]
    avg = sum(amounts) / len(amounts)
    threshold = avg * 2.5

    anomalies = []
    seen = {}

    for txn in req.transactions:
        # Flag if amount is 2.5x above average
        if txn.amount > threshold:
            anomalies.append({
                "id": txn.id,
                "reason": f"Unusually large charge of ${txn.amount:.2f} (avg is ${avg:.2f})"
            })
            continue

        # Flag duplicate charges
        key = f"{txn.merchant}_{txn.amount}_{txn.date[:10]}"
        if key in seen:
            anomalies.append({
                "id": txn.id,
                "reason": f"Possible duplicate charge from {txn.merchant}"
            })
        else:
            seen[key] = True

    return {"anomalies": anomalies}

# --- Budget Forecasting ---
@app.post("/forecast")
def forecast_budget(req: ForecastRequest):
    if not req.transactions:
        return {"on_track": True, "projected_spending": 0, "message": "No transactions yet"}

    today = datetime.now()
    day_of_month = today.day
    total_spent = sum(t.amount for t in req.transactions if t.amount > 0)

    daily_rate = total_spent / day_of_month if day_of_month > 0 else 0
    projected = daily_rate * req.days_in_month

    on_track = projected <= req.budget_limit
    message = (
        f"On track! Projected spending: ${projected:.2f}"
        if on_track
        else f"Warning! Projected to spend ${projected:.2f}, over budget by ${projected - req.budget_limit:.2f}"
    )

    return {
        "on_track": on_track,
        "projected_spending": round(projected, 2),
        "daily_rate": round(daily_rate, 2),
        "message": message
    }

@app.get("/health")
def health():
    return {"status": "ok"}