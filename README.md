🔐 Vault — Personal Finance Manager
The modern replacement for Mint. Connect your bank, track spending automatically, and get AI-powered insights into your financial life.
What Is Vault?
Vault is a full-stack personal finance platform that syncs your bank transactions, categorizes spending via a Python microservice, detects anomalies, forecasts budgets, and lets you ask AI questions about your finances in plain English.
Features
	∙	🏦 Bank connectivity via Plaid API
	∙	🏷️ Auto transaction categorization (Python microservice)
	∙	📊 Spending dashboard with charts
	∙	💰 Budget tracking with overspending alerts
	∙	🎯 Savings goals tracker
	∙	👨‍👩‍👧 Family shared budget mode
	∙	🤖 Anomaly detection — flags unusual charges and duplicates
	∙	📈 Budget forecasting — warns before you overspend
	∙	🧠 AI-powered insights via OpenAI
	∙	💳 Stripe subscription (free + premium)
Tech Stack
Frontend: Next.js 14, TypeScript, Tailwind CSS, Redux Toolkit, Recharts
Backend: Node.js, Express, TypeScript, JWT auth, Redis
Database: PostgreSQL, Prisma ORM
Python Microservice: FastAPI, anomaly detection, categorization, forecasting
Infrastructure: Docker, GitHub Actions, AWS S3
AI: OpenAI API