const baseUrl = 'http://localhost:3000/api/users';

async function testValidationError() {
  console.log('--- Testing Validation Handling (9-digit phone) ---');

  const userData = {
    email: `val_test_${Date.now()}@example.com`,
    name: 'Validation Test User',
    phone: '123456789', // Invalid: only 9 digits
    password: 'password123'
  };

  console.log('Attempting to create user with 9-digit phone...');
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

  if (res.status === 200 && result.error === true && result.errorCode === 400) {
    console.log('✅ SUCCESS: Error returned correctly as 200 OK with errorCode: 400.');
    if (result.message && result.message.includes('10 digits')) {
      console.log('✅ SUCCESS: Validation message correctly mentions 10 digits.');
    } else {
      console.error('❌ FAILURE: Validation message does not mention 10 digits.');
    }
  } else {
    console.error('❌ FAILURE: Error handling not as expected.');
  }
}

testValidationError().catch(console.error);
