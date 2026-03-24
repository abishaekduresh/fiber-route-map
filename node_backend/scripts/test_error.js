const baseUrl = 'http://localhost:3000/api/users';

async function testError() {
  console.log('--- Testing Error Handling (Expecting 200 OK with error: true) ---');

  const userData = {
    email: `error_test_${Date.now()}@example.com`,
    name: 'Error Test User',
    phone: '9980704002', // This number exists in the DB based on previous check
    password: 'password123'
  };

  console.log('Attempting to create user with duplicate phone...');
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Version': 'v1'
    },
    body: JSON.stringify(userData)
  });

  const result = await res.json();
  console.log('Response HTTP Status:', res.status);
  console.log('Response Body:', JSON.stringify(result, null, 2));

  if (res.status === 200 && result.error === true && result.errorCode === 409) {
    console.log('✅ SUCCESS: Error returned correctly as 200 OK with error: true and errorCode: 409.');
    if (result.help && result.help.includes('phone number')) {
      console.log('✅ SUCCESS: Dynamic help message is present and relevant.');
    } else {
      console.error('❌ FAILURE: Help message is missing or not dynamic.');
    }
  } else {
    console.error('❌ FAILURE: Error handling not as expected.');
  }
}

testError().catch(console.error);
