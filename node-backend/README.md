# QueueStorm Investigator AI Copilot

This project is a solution for the QueueStorm Investigator challenge. It provides an AI/API SupportOps copilot for classifying, routing, and explaining digital finance support tickets safely.

## Tech Stack
- **Backend Framework**: Node.js with Express
- **AI Integration**: Hugging Face Inference API (`@huggingface/inference`)
- **Deployment**: Configured for Vercel Serverless Functions (`vercel.json` provided).

## Setup Instructions

### 1. Prerequisites
- Node.js (v18 or higher)
- A Hugging Face account and API token.

### 2. Local Installation
Clone the repository (or copy the files) and run the following in your terminal:

```bash
cd node-backend
npm install
```

### 3. Environment Variables
Copy the `.env.example` file to `.env` and fill in your secrets.

```bash
cp .env.example .env
```
Ensure you provide a valid `HF_TOKEN`. You can generate one from Hugging Face Settings -> Access Tokens. Make sure the token has read permissions.

### 4. Running the Server Locally
```bash
node api/index.js
```
The server will start on port 3000 by default. You can test the health endpoint at `http://localhost:3000/health`.

## Deployment Setup (Vercel)
1. Install the Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root (`node-backend`).
3. Follow the CLI prompts to deploy.
4. Go to your Vercel project dashboard and add `HF_TOKEN` in the Environment Variables section.
5. Deploy to production using `vercel --prod`.

## MODELS
**Model Used**: `meta-llama/Meta-Llama-3-8B-Instruct`
**Where it runs**: Hugging Face Serverless Inference API.
**Why it was chosen**: 
- Fast, reliable, and capable of generating structured JSON responses.
- Excellent instruction-following capabilities, making it easy to enforce strict safety guardrails via prompt engineering.
- Cost-effective (free tier on Hugging Face covers basic testing).

## Architecture Walkthrough & Safety Guardrails
- **API Flow**: The Express app receives a POST request at `/analyze-ticket`.
- **Evidence Reasoning**: The AI model is provided with the `complaint` and the `transaction_history` and is instructed to cross-reference them to determine ground truth (verdict, case type, department).
- **Safety Guardrails**: 
  - The model prompt explicitly forbids requesting PIN/OTP/passwords.
  - The model is instructed to NEVER confirm a refund unconditionally and to use safe language like "any eligible amount will be returned through official channels".
  - It escalates ambiguous or risky cases by marking `human_review_required: true`.
- **Limitations**:
  - The prompt is static and assumes English/Banglish inputs are understood well by Llama-3.
  - The serverless function relies on external API latency; if HF API is overloaded, responses may occasionally time out near the 30s limit.

## Testing Locally
You can use `curl` to test the API locally:

```bash
curl -X POST http://localhost:3000/analyze-ticket \
-H "Content-Type: application/json" \
-d '{
  "ticket_id": "TKT-001",
  "complaint": "I sent 5000 taka to a wrong number around 2pm today...",
  "transaction_history": [
    {
      "transaction_id": "TXN-9101",
      "timestamp": "2026-04-14T14:08:22Z",
      "type": "transfer",
      "amount": 5000,
      "counterparty": "+8801719876543",
      "status": "completed"
    }
  ]
}'
```
