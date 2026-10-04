const fs = require('fs');

async function testAdminBookings() {
    console.log("==================================================");
    console.log("PHASE 6B - ADMIN BOOKING MANAGEMENT REGRESSION TEST");
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
        if (!res.ok) throw new Error(`Login failed for ${credentials.phone}`);
        const data = await res.json();
        return data.token;
    }

    try {
        const adminToken = await login(TEST_ADMIN);
        console.log("✅ Admin Login OK");

        const renterToken = await login(TEST_RENTER);
        console.log("✅ Renter Login OK\n");

        // Test 1: Renter trying to access admin endpoint (401/403 expected)
        let res = await fetch(`${BASE_URL}/api/admin/bookings.php?status=all`, {
            headers: { 'Authorization': `Bearer ${renterToken}` }
        });
        if (res.status === 401 || res.status === 403) {
            console.log("✅ Renter -> admin endpoint correctly blocked (401/403)");
        } else {
            console.error(`❌ Renter -> admin endpoint failed. Status: ${res.status}`);
        }

        // Test 2: Admin GET bookings
        res = await fetch(`${BASE_URL}/api/admin/bookings.php?status=all`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.ok) {
            const bookings = await res.json();
            console.log(`✅ Admin GET bookings passed. Retrieved ${bookings.length} bookings.`);
            
            if (bookings.length > 0) {
                const b = bookings[0];
                if (b.id && b.renter?.name && b.vehicle?.title) {
                    console.log("✅ Booking data integrity OK (has renter and vehicle joins)");
                } else {
                    console.error("❌ Booking data integrity failed: Missing joined fields");
                }
            }
        } else {
            console.error(`❌ Admin GET bookings failed. Status: ${res.status}`);
        }

        // Test 3: Invalid Booking ID
        res = await fetch(`${BASE_URL}/api/admin/bookings.php?id=9999999`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}` 
            },
            body: JSON.stringify({ status: 'cancelled' })
        });
        if (res.status === 404 || res.status === 400) {
            console.log("✅ Invalid booking ID correctly handled (404/400)");
        } else {
            console.error(`❌ Invalid booking ID failed. Status: ${res.status}`);
        }

        // (We won't actually cancel a real booking here to avoid breaking production data state during standard regression)
        // But we will test the completed override rejection if possible, assuming we find a completed booking
        res = await fetch(`${BASE_URL}/api/admin/bookings.php?status=all`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const allBookings = await res.json();
        const completedBooking = allBookings.find(b => b.status === 'completed');
        
        if (completedBooking) {
            res = await fetch(`${BASE_URL}/api/admin/bookings.php?id=${completedBooking.id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}` 
                },
                body: JSON.stringify({ status: 'cancelled' })
            });
            if (res.status === 400) {
                console.log("✅ Completed booking override correctly rejected (400)");
            } else {
                console.error(`❌ Completed booking override test failed. Status: ${res.status}`);
            }
        } else {
            console.log("⚠️ No completed booking found to test override rejection.");
        }

    } catch (e) {
        console.error("Error during regression test:", e);
    }
}

testAdminBookings();
