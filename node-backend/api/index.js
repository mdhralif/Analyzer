const express = require("express");
const cors = require("cors");
const { HfInference } = require("@huggingface/inference");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const hf = new HfInference(process.env.HF_TOKEN);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/analyze-ticket", async (req, res) => {
  try {
    const { ticket_id, complaint, transaction_history } = req.body;

    if (!ticket_id || !complaint) {
      return res.status(400).json({ error: "Missing ticket_id or complaint" });
    }

    const prompt = `You are an AI SupportOps Copilot for a digital finance platform.
Analyze the following customer complaint and transaction history.
Your job is to determine the ground truth by comparing the complaint with the transaction history (if provided).
Never request sensitive credentials (PIN, OTP, password) in the customer reply.
Never confirm a refund or reversal unconditionally. Instead say "any eligible amount will be returned through official channels".
Direct customers only to official support channels.

Ticket ID: ${ticket_id}
Complaint: ${complaint}
Transaction History: ${JSON.stringify(transaction_history || [])}

Output ONLY valid JSON matching this schema:
{
  "ticket_id": "${ticket_id}",
  "relevant_transaction_id": "string or null",
  "evidence_verdict": "consistent | inconsistent | insufficient_data",
  "case_type": "wrong_transfer | payment_failed | refund_request | duplicate_payment | merchant_settlement_delay | agent_cash_in_issue | phishing_or_social_engineering | other",
  "severity": "low | medium | high | critical",
  "department": "customer_support | dispute_resolution | payments_ops | merchant_operations | agent_operations | fraud_risk",
  "agent_summary": "1-2 sentence summary",
  "recommended_next_action": "Suggested operational next step",
  "customer_reply": "Safe official reply respecting safety rules",
  "human_review_required": boolean,
  "confidence": number between 0 and 1,
  "reason_codes": ["array", "of", "strings"]
}`;

    const response = await hf.chatCompletion({
      model: "meta-llama/Meta-Llama-3-8B-Instruct",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.1,
      provider: "hf-inference"
    });

    const replyContent = response.choices[0].message.content;

    // Try to parse the JSON output from the model
    let jsonResponse;
    try {
      // Find JSON block in case there's extra text
      const jsonMatch = replyContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : replyContent;
      jsonResponse = JSON.parse(jsonStr);

      // Ensure ticket_id matches
      jsonResponse.ticket_id = ticket_id;
    } catch (parseError) {
      console.error("Failed to parse LLM output as JSON:", replyContent);
      return res
        .status(500)
        .json({ error: "Failed to generate valid response from LLM" });
    }

    res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Error analyzing ticket:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
