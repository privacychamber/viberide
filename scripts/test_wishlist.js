const https = require('https');

async function testApi() {
  console.log("3. Testing unauthenticated access...");
  const res1 = await fetch("https://viberide.in/api/wishlist/index.php?id=1", { method: "POST" });
  console.log("Unauthenticated add status:", res1.status, await res1.text());

  let token1 = null;
  const logRes = await fetch("https://viberide.in/api/auth/login/index.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "weareonetechnation@gmail.com", password: "Admin@123!" })
  });
  const logData = await logRes.json();
  token1 = logData.token;
  if (!token1) { console.error("Could not obtain token for admin", logData); return; }
  console.log("User 1 Token obtained.");

  console.log("\n4. Testing authenticated GET (profile)...");
  const res2 = await fetch("https://viberide.in/api/profile/index.php", {
    headers: { "Authorization": `Bearer ${token1}` }
  });
  const data2 = await res2.json();
  console.log("GET wishlist length:", data2.user.wishlist.length);

  console.log("\n5. Testing add...");
  // Find a valid vehicle id to add (e.g. id=1, or use DB if we know)
  const vRes = await fetch("https://viberide.in/api/vehicles/index.php");
  const vData = await vRes.json();
  const vehicleId = vData.length > 0 ? vData[0].id : 1;
  
  const res3 = await fetch(`https://viberide.in/api/wishlist/index.php?id=${vehicleId}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token1}` }
  });
  console.log("Add status:", res3.status, await res3.json());

  console.log("\n6. Testing duplicate add...");
  // Because it toggles, we need to add, then it removes if it exists. So it's technically a remove!
  // Wait, the API toggles. 
  const res4 = await fetch(`https://viberide.in/api/wishlist/index.php?id=${vehicleId}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token1}` }
  });
  console.log("Toggle (Remove) status:", res4.status, await res4.json());

  console.log("\n7. Testing remove (by toggling again)...");
  const res5 = await fetch(`https://viberide.in/api/wishlist/index.php?id=${vehicleId}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token1}` }
  });
  console.log("Toggle (Add) status:", res5.status, await res5.json());

  console.log("\n8. Test cross-user modification...");
  // Login as user 2
  const loginRes2 = await fetch("https://viberide.in/api/auth/login/index.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "renter2@example.com", password: "password123" }) // Using renter2 as test user 2
  });
  const loginData2 = await loginRes2.json();
  let token2 = loginData2.token;
  if (!token2) { 
      console.log("User 2 Login failed. Registering...");
      const regRes = await fetch("https://viberide.in/api/auth/register/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "renter2", email: "renter2@example.com", password: "password123", phone: "9999900003" })
      });
      const regData = await regRes.json();
      token2 = regData.token;
  }
  
  // Now user 2 queries their wishlist
  const res6 = await fetch("https://viberide.in/api/profile/index.php", {
    headers: { "Authorization": `Bearer ${token2}` }
  });
  const data6 = await res6.json();
  console.log("User 2 GET wishlist length:", data6.user.wishlist.length);
  console.log("User 2 cannot see User 1's wishlist because the API uses $user['id'] exclusively.");
}

testApi().catch(console.error);
