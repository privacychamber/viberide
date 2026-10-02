const https = require('https');

function request(method, url, data = null) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
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

async function trigger() {
    const email = "weareonetechnation@gmail.com";
    
    console.log("1. Registering on viberide.in...");
    const regRes = await request("POST", "https://viberide.in/api/process/r/index.php", {
        name: "Antigravity Superadmin",
        email: email,
        phone: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        password: "AdminPassword123!"
    });
    console.log(`Registration Response: ${regRes.status} -> ${regRes.body}`);

    console.log("2. Triggering OTP Resend...");
    const resendRes = await request("POST", "https://viberide.in/api/process/v/index.php", {
        action: "resend", email
    });
    console.log(`Resend Response: ${resendRes.status} -> ${resendRes.body}`);
}

trigger().catch(console.error);
