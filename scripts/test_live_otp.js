const https = require('https');

function request(method, url, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log("1. Creating mail.tm account...");
    const domainRes = await request('GET', 'https://api.mail.tm/domains');
    const domains = JSON.parse(domainRes.body)['hydra:member'];
    const domain = domains[0].domain;

    const email = `test_${Math.floor(Math.random()*100000)}@${domain}`;
    const password = "Password123!";

    const createRes = await request('POST', 'https://api.mail.tm/accounts', { address: email, password });
    if (createRes.status !== 201) throw new Error("Failed to create email");

    const tokenRes = await request('POST', 'https://api.mail.tm/token', { address: email, password });
    const token = JSON.parse(tokenRes.body).token;
    console.log(`Temp email generated: ${email}`);

    console.log("2. Registering on viberide.in...");
    const regRes = await request("POST", "https://viberide.in/api/process/r/index.php", {
        name: "Antigravity Test",
        email: email,
        phone: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        password: "TestPassword123!"
    });
    console.log(`Registration Response: ${regRes.status} -> ${regRes.body}`);

    console.log("3. Triggering OTP Resend...");
    const resendRes = await request("POST", "https://viberide.in/api/process/v/index.php", {
        action: "resend", email
    });
    console.log(`Resend Response: ${resendRes.status} -> ${resendRes.body}`);

    console.log("4. Polling inbox for the email...");
    let messageId = null;
    for (let i = 0; i < 20; i++) {
        await sleep(3000);
        const checkRes = await request('GET', 'https://api.mail.tm/messages', null, token);
        const messages = JSON.parse(checkRes.body)['hydra:member'];
        if (messages.length > 0) {
            messageId = messages[0].id;
            break;
        }
        console.log(`Waiting... (${i+1}/20)`);
    }

    if (!messageId) {
        console.log("FAILED: Email never arrived in the inbox. Ensure PHP mail() works properly on cPanel.");
        return;
    }

    console.log("5. Reading email and extracting OTP...");
    const msgRes = await request('GET', `https://api.mail.tm/messages/${messageId}`, null, token);
    const msg = JSON.parse(msgRes.body);
    
    // Extract 6-digit OTP
    const otpMatch = msg.text.match(/\b\d{6}\b/);
    if (!otpMatch) {
        console.log("FAILED: Could not find 6-digit OTP in the email body.");
        console.log("Email body:", msg.text);
        return;
    }
    const otp = otpMatch[0];
    console.log(`SUCCESS: Extracted OTP from email: ${otp}`);

    console.log("6. Verifying the OTP...");
    const verifyRes = await request("POST", "https://viberide.in/api/process/v/index.php", {
        action: "verify", email, otp
    });
    
    console.log(`Verification Response: ${verifyRes.status} -> ${verifyRes.body}`);
    
    if (verifyRes.status === 200 && verifyRes.body.includes("token")) {
        console.log("====================================");
        console.log("✅ FULL E2E OTP FLOW PROVEN SUCCESSFUL");
        console.log("====================================");
    } else {
        console.log("❌ OTP Verification failed or invalid response.");
    }
}

run().catch(console.error);
