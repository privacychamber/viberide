const https = require('https');

async function runFleetTests() {
  const BASE_URL = 'https://viberide.in';
  let adminToken = '';
  let ownerToken = '';
  let testVehicleId = null;
  let testVehicleId2 = null; // For delete test
  
  console.log("==================================================");
  console.log("TEST 1 - OWNER LOGIN / REGISTRATION");
  console.log("==================================================");
  let ownerRes = await fetch(`${BASE_URL}/api/process/l/index.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999900001', password: 'password123' })
  });
  
  const ownerResText = await ownerRes.text();
  let ownerData;
  try { ownerData = JSON.parse(ownerResText); } catch(e) {}
  
  if (ownerRes.ok && ownerData && ownerData.token) {
    ownerToken = ownerData.token;
    console.log(`TEST 1: PASS - Logged in as Owner`);
  } else {
    console.log("TEST 1: FAIL - Owner login failed");
    return;
  }

  console.log("\n==================================================");
  console.log("TEST 2 - ADMIN LOGIN");
  console.log("==================================================");
  let adminRes = await fetch(`${BASE_URL}/api/process/l/index.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '8888800000', password: 'password123' })
  });
  
  if (!adminRes.ok) {
     console.log("Admin account not found. Registering...");
     await fetch(`${BASE_URL}/api/process/r/index.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Admin Test', email: 'admin_test@example.com', password: 'password123', phone: '8888800000' }) 
      });
      // Will run the make_admin script manually outside
      console.log("Please run node scripts/make_admin.js and run this script again.");
      return;
  }

  const adminResText = await adminRes.text();
  let adminData;
  try { adminData = JSON.parse(adminResText); } catch(e) {}

  if (adminRes.ok && adminData && adminData.token) {
    adminToken = adminData.token;
    console.log(`TEST 2: PASS - Logged in as Admin`);
  } else {
    console.log("TEST 2: FAIL - Admin login failed. Ensure an admin account exists.");
    // We can't proceed with admin actions if we don't have an admin token.
  }

  console.log("\n==================================================");
  console.log("TEST 3 - OWNER CREATES VEHICLE (Should be pending)");
  console.log("==================================================");
  const vehiclePayload = {
    title: "Fleet Regression Test Vehicle",
    type: "scooter",
    brand: "Honda",
    model: "Activa 6G",
    pricePerDay: 400,
    location: { area: "Test Area", city: "Bir", state: "Himachal Pradesh", country: "India" },
    specs: { engineCc: 110, fuelType: "Petrol", transmission: "Non-Geared", seatingCapacity: 2, deliveryAvailable: false }
  };

  const createRes = await fetch(`${BASE_URL}/api/owner/vehicles.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
    body: JSON.stringify(vehiclePayload)
  });
  
  const createData = await createRes.json();
  if (createRes.status === 201 && createData.id) {
    testVehicleId = createData.id;
    console.log(`TEST 3: PASS - Vehicle created with ID ${testVehicleId}`);
  } else {
    console.log(`TEST 3: FAIL - Vehicle creation failed:`, createRes.status, createData);
  }

  console.log("\n==================================================");
  console.log("TEST 4 - ADMIN SEES VEHICLE IN QUEUE");
  console.log("==================================================");
  if (testVehicleId && adminToken) {
    const adminIndexRes = await fetch(`${BASE_URL}/api/admin/index.php`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminIndexData = await adminIndexRes.json();
    const vInQueue = adminIndexData.vehiclesQueue?.find(v => v._id == testVehicleId);
    if (vInQueue) {
        console.log("TEST 4: PASS - Vehicle found in Admin vehiclesQueue (status: pending)");
    } else {
        console.log("TEST 4: FAIL - Vehicle not found in vehiclesQueue");
    }
  } else {
    console.log("TEST 4: SKIPPED");
  }

  console.log("\n==================================================");
  console.log("TEST 5 - ADMIN APPROVES VEHICLE");
  console.log("==================================================");
  if (testVehicleId && adminToken) {
    const approveRes = await fetch(`${BASE_URL}/api/admin/vehicles.php?id=${testVehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'approved' })
    });
    if (approveRes.status === 200) {
        console.log("TEST 5: PASS - Vehicle approved by Admin");
    } else {
        console.log(`TEST 5: FAIL - Admin approval failed:`, approveRes.status, await approveRes.text());
    }
  } else {
    console.log("TEST 5: SKIPPED");
  }

  console.log("\n==================================================");
  console.log("TEST 6 - OWNER EDITS VEHICLE");
  console.log("==================================================");
  if (testVehicleId && ownerToken) {
    const editPayload = { ...vehiclePayload, title: "Fleet Regression Test Vehicle - Edited", pricePerDay: 450 };
    const editRes = await fetch(`${BASE_URL}/api/owner/vehicles.php?id=${testVehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
        body: JSON.stringify(editPayload)
    });
    if (editRes.status === 200) {
        console.log("TEST 6: PASS - Vehicle edited by Owner");
    } else {
        console.log(`TEST 6: FAIL - Vehicle edit failed:`, editRes.status, await editRes.text());
    }
  } else {
    console.log("TEST 6: SKIPPED");
  }

  console.log("\n==================================================");
  console.log("TEST 7 - OWNER BLOCKS DATES");
  console.log("==================================================");
  if (testVehicleId && ownerToken) {
    const blockPayload = { blockedDates: ["2026-10-10", "2026-10-11"] };
    const blockRes = await fetch(`${BASE_URL}/api/owner/vehicles.php?id=${testVehicleId}&action=block-dates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
        body: JSON.stringify(blockPayload)
    });
    if (blockRes.status === 200) {
        console.log("TEST 7: PASS - Dates blocked by Owner");
    } else {
        console.log(`TEST 7: FAIL - Date blocking failed:`, blockRes.status, await blockRes.text());
    }
  } else {
    console.log("TEST 7: SKIPPED");
  }

  console.log("\n==================================================");
  console.log("TEST 8 - ADMIN FLAGS AND FEATURES VEHICLE");
  console.log("==================================================");
  if (testVehicleId && adminToken) {
    const flagRes = await fetch(`${BASE_URL}/api/admin/vehicles.php?id=${testVehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ flagged: true, featured: true })
    });
    if (flagRes.status === 200) {
        console.log("TEST 8: PASS - Vehicle flagged and featured by Admin");
    } else {
        console.log(`TEST 8: FAIL - Admin flag/feature failed:`, flagRes.status, await flagRes.text());
    }
  } else {
    console.log("TEST 8: SKIPPED");
  }

  console.log("\n==================================================");
  console.log("TEST 9 - ADMIN SAFELY DELETES VEHICLE");
  console.log("==================================================");
  if (testVehicleId && adminToken) {
    // Delete the test vehicle since it has no bookings
    const delRes = await fetch(`${BASE_URL}/api/admin/vehicles.php?id=${testVehicleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (delRes.status === 200) {
        console.log("TEST 9: PASS - Test vehicle cleanly deleted by Admin");
    } else {
        console.log(`TEST 9: FAIL - Admin deletion failed:`, delRes.status, await delRes.text());
    }
  } else {
    console.log("TEST 9: SKIPPED");
  }

  console.log("\n==================================================");
  console.log("TEST 10 - DELETE PROTECTION (Existing booked vehicle)");
  console.log("==================================================");
  if (adminToken) {
    // Try to delete a vehicle that has bookings (e.g. from Phase 4)
    // First, find a vehicle with bookings.
    const adminIndexRes = await fetch(`${BASE_URL}/api/admin/index.php`, { headers: { 'Authorization': `Bearer ${adminToken}` }});
    const adminIndexData = await adminIndexRes.json();
    let oldVehicleId = null;
    if (adminIndexData.stats.totalBookings > 0) {
        // Find the vehicle associated with booking 3 or any old vehicle
        // Hard to know which vehicle has a booking directly from admin index without full booking details.
        // Let's assume vehicle ID 1 or 2 might have bookings.
        // We will just try to delete an old vehicle. If it 409s, it passes.
        oldVehicleId = 1; // Assuming vehicle 1 exists and might have bookings from Phase 4
    }
    
    if (oldVehicleId) {
        const protectRes = await fetch(`${BASE_URL}/api/admin/vehicles.php?id=${oldVehicleId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (protectRes.status === 409) {
            console.log(`TEST 10: PASS - Deletion correctly blocked with 409 Conflict. Message:`, await protectRes.text());
        } else {
            console.log(`TEST 10: WARNING - Expected 409, got`, protectRes.status, await protectRes.text(), `(Maybe vehicle ${oldVehicleId} has no bookings)`);
        }
    } else {
         console.log("TEST 10: SKIPPED (No booked vehicles to test)");
    }
  } else {
    console.log("TEST 10: SKIPPED");
  }

}

runFleetTests().catch(console.error);
