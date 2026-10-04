const https = require('https');

async function runTests() {
  const BASE_URL = 'https://viberide.in';
  let ownerToken = '';
  let renterToken = '';
  let testVehicleId = null;
  let testBookingId = null;
  let owner2Token = ''; // For security testing
  let renterId = null;
  
  console.log("==================================================");
  console.log("TEST 1 - RENTER LOGIN");
  console.log("==================================================");
  let renterRes = await fetch(`${BASE_URL}/api/process/l/index.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999900009', password: 'password123' })
  });
  
  if (!renterRes.ok) {
    console.log("Renter account not found. Attempting registration...");
    renterRes = await fetch(`${BASE_URL}/api/process/r/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Renter Test Regression', email: 'renter_reg_regression@example.com', password: 'password123', phone: '9999900009' })
    });
  }
  
  const renterResText = await renterRes.text();
  let renterData;
  try {
    renterData = JSON.parse(renterResText);
  } catch(e) {
    console.log("Failed to parse JSON for renter:", renterResText);
  }
  
  if (renterRes.ok && renterData && renterData.token) {
    renterToken = renterData.token;
    // We can decode JWT parts directly or just check if it works.
    const profileRes = await fetch(`${BASE_URL}/api/profile/index.php`, { headers: { "Authorization": `Bearer ${renterToken}` }});
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      renterId = profileData.user.id;
      console.log(`TEST 1: PASS - Logged in as Renter ID ${renterId}`);
    } else {
      console.log("TEST 1: FAIL - JWT not valid for profile");
    }
  } else {
    console.log("TEST 1: FAIL - Renter login failed", renterData);
  }

  console.log("\n==================================================");
  console.log("TEST 2 - OWNER LOGIN");
  console.log("==================================================");
  let ownerRes = await fetch(`${BASE_URL}/api/process/l/index.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999900001', password: 'password123' })
  });
  const ownerResText = await ownerRes.text();
  let ownerData;
  try {
      ownerData = JSON.parse(ownerResText);
  } catch(e) {
      console.log("Failed to parse JSON for owner:", ownerResText);
  }
  
  if (ownerRes.ok && ownerData && ownerData.token) {
    ownerToken = ownerData.token;
    const ownerApiRes = await fetch(`${BASE_URL}/api/owner/index.php`, { headers: { "Authorization": `Bearer ${ownerToken}` }});
    if (ownerApiRes.ok) {
      console.log("TEST 2: PASS - Logged in as Owner and accessed owner API");
    } else {
      console.log("TEST 2: FAIL - Owner cannot access owner API", ownerApiRes.status);
    }
  } else {
    console.log("TEST 2: FAIL - Owner login failed", ownerData);
  }

  console.log("\n==================================================");
  console.log("TEST 3 - VEHICLE VALIDATION");
  console.log("==================================================");
  const ownerApiRes = await fetch(`${BASE_URL}/api/owner/index.php`, { headers: { "Authorization": `Bearer ${ownerToken}` }});
  const ownerApiData = await ownerApiRes.json();
  const vehicles = ownerApiData.vehicles || [];
  let vehicle = vehicles.find(v => v.status === 'approved' && v.availability == 1);
  
  if (vehicle) {
    testVehicleId = vehicle.id || vehicle._id;
    console.log(`TEST 3: PASS - Found vehicle ID ${testVehicleId}, Title: ${vehicle.title}`);
  } else {
    console.log("TEST 3: FAIL - No approved/available vehicle found for owner.");
    // Wait, let's check if there are any vehicles
    console.log("Vehicles:", vehicles);
  }

  console.log("\n==================================================");
  console.log("TEST 4 - CREATE REAL BOOKING");
  console.log("==================================================");
  if (testVehicleId && renterToken) {
    // Need dates
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() + 30);
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + 32);
    
    const fStr = fromDate.toISOString().split('T')[0];
    const tStr = toDate.toISOString().split('T')[0];
    
    const bookRes = await fetch(`${BASE_URL}/api/bookings/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${renterToken}` },
      body: JSON.stringify({ vehicleId: testVehicleId, fromDate: fStr, toDate: tStr })
    });
    
    const bookData = await bookRes.json();
    if (bookRes.status === 201 && bookData.id) {
      testBookingId = bookData.id;
      console.log(`TEST 4: PASS - Booking created with ID ${testBookingId}`);
    } else {
      console.log(`TEST 4: FAIL - Booking failed:`, bookRes.status, bookData);
    }
  } else {
    console.log("TEST 4: SKIPPED (Missing prerequisite)");
  }

  console.log("\n==================================================");
  console.log("TEST 5 - RENTER BOOKING VISIBILITY");
  console.log("==================================================");
  if (testBookingId && renterToken) {
    const pRes = await fetch(`${BASE_URL}/api/profile/index.php`, { headers: { "Authorization": `Bearer ${renterToken}` }});
    const pData = await pRes.json();
    const b = pData.bookings?.find(b => b._id == testBookingId);
    if (b && b.status === 'pending') {
      console.log("TEST 5: PASS - Booking visible to renter as pending");
    } else {
      console.log("TEST 5: FAIL - Booking not found or status not pending");
    }
  } else {
    console.log("TEST 5: SKIPPED");
  }

  console.log("\n==================================================");
  console.log("TEST 6 - OWNER BOOKING VISIBILITY");
  console.log("==================================================");
  if (testBookingId && ownerToken) {
    const oRes = await fetch(`${BASE_URL}/api/owner/index.php`, { headers: { "Authorization": `Bearer ${ownerToken}` }});
    const oData = await oRes.json();
    const b = oData.bookings?.find(b => b._id == testBookingId);
    if (b && b.status === 'pending') {
      console.log("TEST 6: PASS - Booking visible to owner as pending");
    } else {
      console.log("TEST 6: FAIL - Booking not found for owner or not pending");
    }
  } else {
    console.log("TEST 6: SKIPPED");
  }

  console.log("\n==================================================");
  console.log("TEST 10 - RENTER SECURITY TEST (Attempting before approval)");
  console.log("==================================================");
  if (testBookingId && renterToken) {
    const sRes = await fetch(`${BASE_URL}/api/owner/bookings.php?id=${testBookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${renterToken}` },
      body: JSON.stringify({ status: 'approved' })
    });
    if (sRes.status === 401 || sRes.status === 403) {
      console.log("TEST 10: PASS - Renter rejected with", sRes.status);
    } else {
      console.log("TEST 10: FAIL - Renter got status", sRes.status, await sRes.text());
    }
  } else {
    console.log("TEST 10: SKIPPED");
  }
  
  console.log("\n==================================================");
  console.log("TEST 9 - OWNER SECURITY TEST");
  console.log("==================================================");
  if (testBookingId) {
    // Generate a second owner
    let regORes = await fetch(`${BASE_URL}/api/process/r/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Owner 2 Regression', email: 'owner2_reg_regression@example.com', password: 'password123', phone: '9999900008' })
    });
    const regOResText = await regORes.text();
    let regOData;
    try { regOData = JSON.parse(regOResText); } catch(e) {}
    owner2Token = regOData?.token;
    if (!owner2Token) {
      let logORes = await fetch(`${BASE_URL}/api/process/l/index.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '9999900008', password: 'password123' })
      });
      const logOResText = await logORes.text();
      try { regOData = JSON.parse(logOResText); } catch(e) {}
      owner2Token = regOData?.token;
    }
    
    // Attempt approval
    const sRes2 = await fetch(`${BASE_URL}/api/owner/bookings.php?id=${testBookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${owner2Token}` },
      body: JSON.stringify({ status: 'approved' })
    });
    if (sRes2.status === 401 || sRes2.status === 403) {
      console.log("TEST 9: PASS - Other owner rejected with", sRes2.status);
    } else {
      console.log("TEST 9: FAIL - Other owner got status", sRes2.status, await sRes2.text());
    }
  } else {
    console.log("TEST 9: SKIPPED");
  }

  console.log("\n==================================================");
  console.log("TEST 11 - BOOKING CONFLICT TEST");
  console.log("==================================================");
  if (testVehicleId && renterToken) {
    const fStr = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0];
    const tStr = new Date(new Date().setDate(new Date().getDate() + 32)).toISOString().split('T')[0];
    
    const bookRes2 = await fetch(`${BASE_URL}/api/bookings/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${renterToken}` },
      body: JSON.stringify({ vehicleId: testVehicleId, fromDate: fStr, toDate: tStr })
    });
    if (bookRes2.status === 409) {
      console.log("TEST 11: PASS - Conflict rejected with 409");
    } else {
      console.log("TEST 11: FAIL - Expected 409, got", bookRes2.status, await bookRes2.text());
    }
  } else {
    console.log("TEST 11: SKIPPED");
  }

  console.log("\n==================================================");
  console.log("TEST 7 - OWNER APPROVAL");
  console.log("==================================================");
  if (testBookingId && ownerToken) {
    const patchRes = await fetch(`${BASE_URL}/api/owner/bookings.php?id=${testBookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
      body: JSON.stringify({ status: 'approved' })
    });
    if (patchRes.status === 200) {
      console.log("TEST 7: PASS - Booking approved");
    } else {
      console.log("TEST 7: FAIL - Booking approval failed", patchRes.status, await patchRes.text());
    }
  } else {
    console.log("TEST 7: SKIPPED");
  }

  console.log("\n==================================================");
  console.log("TEST 8 - RENTER STATUS REFRESH");
  console.log("==================================================");
  if (testBookingId && renterToken) {
    const pRes = await fetch(`${BASE_URL}/api/profile/index.php`, { headers: { "Authorization": `Bearer ${renterToken}` }});
    const pData = await pRes.json();
    const b = pData.bookings?.find(b => b._id == testBookingId);
    if (b && b.status === 'approved') {
      console.log("TEST 8: PASS - Renter sees booking as approved");
    } else {
      console.log("TEST 8: FAIL - Renter sees status:", b ? b.status : 'not found');
    }
  } else {
    console.log("TEST 8: SKIPPED");
  }

  console.log("\n==================================================");
  console.log("TEST 12 - DATABASE PERSISTENCE");
  console.log("==================================================");
  if (testBookingId && renterToken) {
    // Simulate re-login
    let reloginRes = await fetch(`${BASE_URL}/api/process/l/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999900009', password: 'password123' })
    });
    let relogData = await reloginRes.json();
    if (relogData.token) {
      const pRes = await fetch(`${BASE_URL}/api/profile/index.php`, { headers: { "Authorization": `Bearer ${relogData.token}` }});
      const pData = await pRes.json();
      const b = pData.bookings?.find(b => b._id == testBookingId);
      if (b && b.status === 'approved') {
        console.log("TEST 12: PASS - Status persisted after fresh login");
      } else {
        console.log("TEST 12: FAIL - Status not persisted");
      }
    } else {
      console.log("TEST 12: FAIL - Relogin failed");
    }
  } else {
    console.log("TEST 12: SKIPPED");
  }

  console.log("\n==================================================");
  console.log("TEST 13 - CLEANUP");
  console.log("==================================================");
  // There's no safe API endpoint to delete bookings currently created. The requirement says:
  // "If cleanup is not safely possible through the existing API: DO NOT invent a dangerous deletion endpoint."
  console.log("TEST 13: N/A - Test booking retained because no safe production cleanup mechanism exists.");

}

runTests().catch(console.error);
