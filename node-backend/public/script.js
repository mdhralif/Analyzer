document.getElementById('ticketForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const analyzeBtn = document.getElementById('analyzeBtn');
    const loader = document.getElementById('loader');
    const resultBox = document.getElementById('result');
    const jsonOutput = document.getElementById('jsonOutput');

    const ticketId = document.getElementById('ticketId').value;
    const complaint = document.getElementById('complaint').value;
    let transactionHistory = [];

    try {
        const txInput = document.getElementById('transactions').value;
        if (txInput.trim()) {
            transactionHistory = JSON.parse(txInput);
        }
    } catch (err) {
        alert("Invalid JSON format in Transaction History field.");
        return;
    }

    // UI Updates
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    resultBox.classList.add('hidden');
    loader.classList.remove('hidden');
    jsonOutput.textContent = '';

    try {
        const response = await fetch('/analyze-ticket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ticket_id: ticketId,
                complaint: complaint,
                transaction_history: transactionHistory,
                language: 'en',
                channel: 'in_app_chat',
                user_type: 'customer'
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            jsonOutput.textContent = JSON.stringify(data, null, 2);
            jsonOutput.style.color = 'var(--text-white)';
        } else {
            jsonOutput.textContent = JSON.stringify(data, null, 2);
            jsonOutput.style.color = '#ff6b6b';
        }
    } catch (error) {
        jsonOutput.textContent = 'Error connecting to the server.\n' + error.message;
        jsonOutput.style.color = '#ff6b6b';
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze Ticket';
        loader.classList.add('hidden');
        resultBox.classList.remove('hidden');
    }
});
