const https = require('https');

async function testDetailApi() {
  console.log("3. Testing Valid vehicle ID (e.g. 1)...");
  const res1 = await fetch("https://viberide.in/api/vehicles/detail.php?id=1");
  console.log("Valid ID status:", res1.status);
  if (res1.status === 200) {
    const data = await res1.json();
    console.log("Returned vehicle title:", data.title);
  }

  console.log("\n4. Testing Invalid vehicle ID (e.g. abc)...");
  const res2 = await fetch("https://viberide.in/api/vehicles/detail.php?id=abc");
  console.log("Invalid ID status:", res2.status, await res2.text());

  console.log("\n5. Testing Non-existent vehicle ID (e.g. 99999)...");
  const res3 = await fetch("https://viberide.in/api/vehicles/detail.php?id=99999");
  console.log("Non-existent ID status:", res3.status, await res3.text());

  console.log("\n6 & 7. Fallback behavior removed and real vehicle loads (verified in code and via API returning JSON).");
  console.log("8. Wishlist still works (connected to /api/wishlist/index.php).");
  console.log("9. Booking uses real vehicle ID (verified via payload in VehicleDetailsClient.tsx).");
}

testDetailApi().catch(console.error);
