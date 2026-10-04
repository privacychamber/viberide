const fs = require('fs');

async function testSuspension() {
    console.log("==================================================");
    console.log("PHASE 6C - USER SUSPENSION REGRESSION TEST");
    console.log("==================================================\n");

    const BASE_URL = 'https://viberide.in';
    const TEST_ADMIN = { phone: '8888800000', password: 'password123' };
    const TEST_RENTER = { phone: '9999900002', password: 'password123' };

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
        const adminId = adminLogin.data.user.id;
        console.log("✅ Admin Login OK");

        const renterLogin = await login(TEST_RENTER);
        if (renterLogin.status !== 200) throw new Error("Renter login failed");
        const renterToken = renterLogin.data.token;
        const renterId = renterLogin.data.user.id;
        console.log("✅ Renter Login OK\n");

        // Test 1: Admin self-suspension (should fail)
        let res = await fetch(`${BASE_URL}/api/admin/users.php?id=${adminId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}` 
            },
            body: JSON.stringify({ suspended: true })
        });
        if (res.status === 400) {
            console.log("✅ Admin self-suspension correctly blocked (400)");
        } else {
            console.error(`❌ Admin self-suspension failed. Status: ${res.status}`);
        }

        // Test 2: Admin suspends Renter
        res = await fetch(`${BASE_URL}/api/admin/users.php?id=${renterId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}` 
            },
            body: JSON.stringify({ suspended: true })
        });
        if (res.ok) {
            console.log("✅ Renter suspended successfully");
        } else {
            console.error(`❌ Renter suspension failed. Status: ${res.status}`);
        }

        // Test 3: Renter attempts to access API while suspended
        res = await fetch(`${BASE_URL}/api/profile/index.php`, {
            headers: { 'Authorization': `Bearer ${renterToken}` }
        });
        if (res.status === 403) {
            console.log("✅ Suspended renter correctly blocked from API (403)");
        } else {
            console.error(`❌ Suspended renter API block failed. Status: ${res.status}`);
        }

        // Test 4: Renter attempts to login while suspended
        const suspendedLogin = await login(TEST_RENTER);
        if (suspendedLogin.status === 403) {
            console.log("✅ Suspended renter correctly blocked from login (403)");
        } else {
            console.error(`❌ Suspended renter login block failed. Status: ${suspendedLogin.status}`);
        }

        // Cleanup: Admin unsuspends Renter
        res = await fetch(`${BASE_URL}/api/admin/users.php?id=${renterId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}` 
            },
            body: JSON.stringify({ suspended: false })
        });
        if (res.ok) {
            console.log("✅ Renter unsuspended successfully (Cleanup)");
        } else {
            console.error(`❌ Renter unsuspension failed. Status: ${res.status}`);
        }

    } catch (e) {
        console.error("Error during regression test:", e);
    }
}

testSuspension();
