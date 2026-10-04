const fs = require('fs');

async function testPayouts() {
    console.log("==================================================");
    console.log("PHASE 6D - COMMISSION AND PAYOUT REGRESSION TEST");
    console.log("==================================================\n");

    const BASE_URL = 'https://viberide.in';
    const TEST_ADMIN = { phone: '8888800000', password: 'password123' };

    async function login(credentials) {
        const res = await fetch(`${BASE_URL}/api/auth/login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const data = await res.json();
        return { status: res.status, data };
    }

    try {
        const adminLogin = await login(TEST_ADMIN);
        if (adminLogin.status !== 200) throw new Error("Admin login failed");
        const adminToken = adminLogin.data.token;
        console.log("✅ Admin Login OK");

        // Test fetching admin stats
        let res = await fetch(`${BASE_URL}/api/admin/index.php`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        let data = await res.json();
        if (data.stats && data.stats.totalCommissions !== undefined) {
            console.log("✅ Admin stats include totalCommissions: ₹" + data.stats.totalCommissions);
        } else {
            console.error("❌ Admin stats missing totalCommissions");
        }

        // Test fetching admin bookings
        res = await fetch(`${BASE_URL}/api/admin/bookings.php`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        data = await res.json();
        if (data.length > 0) {
            const b = data[0];
            if (b.commissionAmount !== undefined && b.ownerPayout !== undefined && b.payoutStatus !== undefined) {
                console.log(`✅ Admin bookings include commission info (ID: ${b.id}, Fee: ₹${b.commissionAmount}, Payout: ₹${b.ownerPayout}, Status: ${b.payoutStatus})`);
                
                // Test marking payout as paid (if completed)
                if (b.status === 'completed' && b.payoutStatus !== 'paid') {
                    const patchRes = await fetch(`${BASE_URL}/api/admin/bookings.php?id=${b.id}`, {
                        method: 'PATCH',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${adminToken}`
                        },
                        body: JSON.stringify({ payout_status: 'paid' })
                    });
                    if (patchRes.ok) {
                        console.log("✅ Successfully marked payout as paid via API");
                    } else {
                        console.error(`❌ Failed to update payout status: ${patchRes.status}`);
                    }
                }
            } else {
                console.error("❌ Admin bookings missing commission/payout fields");
            }
        } else {
            console.log("⚠️ No bookings found to test payout fields");
        }

    } catch (e) {
        console.error("Error during regression test:", e);
    }
}

testPayouts();
