

async function run() {
  const adminEmail = 'weareonetechnation@gmail.com';
  const adminPassword = 'Admin@123!';

  console.log('1. Logging in as Admin...');
  const res = await fetch('https://viberide.in/api/auth/login.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999998', password: adminPassword })
  });
  const data = await res.json();
  const token = data.token;
  if (!token) {
    console.log('Login failed. Response:', data);
    return;
  }
  console.log('Admin Token:', 'SUCCESS');

  console.log('\n2. Testing GET /api/admin/index.php');
  const getRes = await fetch('https://viberide.in/api/admin/index.php', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const textRes = await getRes.text();
  console.log('Raw Response:', textRes.slice(0, 500));
  const getData = JSON.parse(textRes);
  console.log('Admin Dashboard Stats:', getData.stats);

  const pendingUsers = getData.usersQueue;
  console.log('Pending KYC Users:', pendingUsers.length);
  
  let targetUser = pendingUsers.length > 0 ? pendingUsers[0] : null;
  
  if (!targetUser) {
    targetUser = getData.allUsers[0];
    console.log(`No pending users. Using fallback user ${targetUser.name} (${targetUser._id})`);
  }

  const targetId = targetUser._id;

  console.log(`\n3. Testing KYC Reject on User ${targetId}`);
  const rejectRes = await fetch(`https://viberide.in/api/admin/users.php?id=${targetId}`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ action: 'reject' })
  });
  console.log('Reject Status:', rejectRes.status, await rejectRes.text());

  console.log(`\n4. Testing KYC Verify on User ${targetId}`);
  const verifyRes = await fetch(`https://viberide.in/api/admin/users.php?id=${targetId}`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ action: 'verify' })
  });
  console.log('Verify Status:', verifyRes.status, await verifyRes.text());

  console.log(`\n5. Testing Flagging on User ${targetId}`);
  const flagRes = await fetch(`https://viberide.in/api/admin/users.php?id=${targetId}`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ flagged: true })
  });
  console.log('Flag Status:', flagRes.status, await flagRes.text());
  
  // Unflag
  const unflagRes = await fetch(`https://viberide.in/api/admin/users.php?id=${targetId}`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ flagged: false })
  });
  console.log('Unflag Status:', unflagRes.status, await unflagRes.text());
  
  console.log('\n6. Fetching Renter JWT and testing 403 Forbidden');
  // Need to log in as a regular user. Let's just create a dummy one or use the existing test user.
  const testEmail = 'weareonetechnation+test' + Date.now() + '@gmail.com';
  const testPhone = '000' + Date.now().toString().slice(0, 7);
  await fetch('https://viberide.in/api/auth/register.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', email: testEmail, phone: testPhone, password: 'Password@123' })
  });
  const rRes = await fetch('https://viberide.in/api/auth/login.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testPhone, password: 'Password@123' })
  });
  const rData = await rRes.json();
  const renterToken = rData.token;
  
  const failRes = await fetch('https://viberide.in/api/admin/index.php', {
    headers: { 'Authorization': `Bearer ${renterToken}` }
  });
  console.log('Renter Access Status:', failRes.status, await failRes.text());
}
run();
