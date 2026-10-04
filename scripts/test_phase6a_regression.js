const https = require('https');

async function runTests() {
  const BASE_URL = 'https://viberide.in';
  
  console.log("==================================================");
  console.log("PHASE 6A - BOOKING LIFECYCLE REGRESSION TEST");
  console.log("==================================================");

  let renterToken = '';
  let ownerToken = '';
  
  // 1. Login Renter
  let renterRes = await fetch(`${BASE_URL}/api/process/l/index.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999900009', password: 'password123' })
  });
  const renterData = await renterRes.json();
  renterToken = renterData.token;
  if (renterToken) console.log("✅ Renter Login OK");
  else { console.log("❌ Renter Login Failed"); return; }
  
  // 2. Login Owner
  let ownerRes = await fetch(`${BASE_URL}/api/process/l/index.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999900001', password: 'password123' })
  });
  const ownerData = await ownerRes.json();
  ownerToken = ownerData.token;
  if (ownerToken) console.log("✅ Owner Login OK");
  else { console.log("❌ Owner Login Failed"); return; }
  
  // 3. Find a vehicle to book
  const ownerApiRes = await fetch(`${BASE_URL}/api/owner/index.php`, { headers: { "Authorization": `Bearer ${ownerToken}` }});
  const ownerApiData = await ownerApiRes.json();
  const vehicle = (ownerApiData.vehicles || []).find(v => v.status === 'approved' && v.availability == 1);
  if (!vehicle) {
    console.log("❌ No approved vehicle found. Aborting.");
    return;
  }
  
  // Helper to create booking
  async function createBooking() {
    const fromDate = new Date(); fromDate.setDate(fromDate.getDate() + 40);
    const toDate = new Date(); toDate.setDate(toDate.getDate() + 42);
    const bookRes = await fetch(`${BASE_URL}/api/bookings/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${renterToken}` },
      body: JSON.stringify({ vehicleId: vehicle.id || vehicle._id, fromDate: fromDate.toISOString().split('T')[0], toDate: toDate.toISOString().split('T')[0] })
    });
    return await bookRes.json();
  }

  // --- SCENARIO 1: Renter Cancels Pending Booking ---
  console.log("\n--- SCENARIO 1: Renter Cancels Pending Booking ---");
  const b1 = await createBooking();
  if (b1.id) {
    const cancelRes = await fetch(`${BASE_URL}/api/bookings/index.php?id=${b1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${renterToken}` },
      body: JSON.stringify({ status: 'cancelled' })
    });
    if (cancelRes.status === 200) console.log(`✅ Renter successfully cancelled pending booking ${b1.id}`);
    else console.log(`❌ Renter failed to cancel pending booking. Status: ${cancelRes.status}`);
  } else {
    console.log("❌ Failed to create booking 1");
  }

  // --- SCENARIO 2: Renter Cancels Approved Booking ---
  console.log("\n--- SCENARIO 2: Renter Cancels Approved Booking ---");
  const b2 = await createBooking();
  if (b2.id) {
    // Owner approves
    const appRes = await fetch(`${BASE_URL}/api/owner/bookings.php?id=${b2.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
      body: JSON.stringify({ status: 'approved' })
    });
    if (appRes.status === 200) {
      // Renter cancels
      const cancelRes = await fetch(`${BASE_URL}/api/bookings/index.php?id=${b2.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${renterToken}` },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (cancelRes.status === 200) console.log(`✅ Renter successfully cancelled approved booking ${b2.id}`);
      else console.log(`❌ Renter failed to cancel approved booking. Status: ${cancelRes.status}`);
    }
  }

  // --- SCENARIO 3: Owner Completes Approved Booking ---
  console.log("\n--- SCENARIO 3: Owner Completes Approved Booking ---");
  const b3 = await createBooking();
  if (b3.id) {
    // Owner approves
    await fetch(`${BASE_URL}/api/owner/bookings.php?id=${b3.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
      body: JSON.stringify({ status: 'approved' })
    });
    // Owner completes
    const compRes = await fetch(`${BASE_URL}/api/owner/bookings.php?id=${b3.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
      body: JSON.stringify({ status: 'completed' })
    });
    if (compRes.status === 200) console.log(`✅ Owner successfully completed approved booking ${b3.id}`);
    else console.log(`❌ Owner failed to complete booking. Status: ${compRes.status}`);
  }

  // --- SCENARIO 4: Owner Cancels Approved Booking ---
  console.log("\n--- SCENARIO 4: Owner Cancels Approved Booking ---");
  const b4 = await createBooking();
  if (b4.id) {
    // Owner approves
    await fetch(`${BASE_URL}/api/owner/bookings.php?id=${b4.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
      body: JSON.stringify({ status: 'approved' })
    });
    // Owner cancels
    const canRes = await fetch(`${BASE_URL}/api/owner/bookings.php?id=${b4.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
      body: JSON.stringify({ status: 'cancelled' })
    });
    if (canRes.status === 200) console.log(`✅ Owner successfully cancelled approved booking ${b4.id}`);
    else console.log(`❌ Owner failed to cancel booking. Status: ${canRes.status}`);
  }

  // --- SCENARIO 5: Invalid Transition (Complete a pending booking) ---
  console.log("\n--- SCENARIO 5: Invalid Transition (Complete pending) ---");
  const b5 = await createBooking();
  if (b5.id) {
    const invRes = await fetch(`${BASE_URL}/api/owner/bookings.php?id=${b5.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
      body: JSON.stringify({ status: 'completed' })
    });
    if (invRes.status === 400) console.log(`✅ System correctly rejected invalid transition (pending -> completed). Status: 400`);
    else console.log(`❌ System allowed invalid transition. Status: ${invRes.status}`);
  }

}

runTests().catch(console.error);
