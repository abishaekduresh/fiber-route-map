const baseUrl = 'http://localhost:3000/api/users';

async function testPasswordValidation() {
  console.log('--- Testing Password Validation ---');

  // 1. Passwords don't match
  console.log('1. Testing mismatched passwords...');
  const res1 = await fetch(baseUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Version': 'v1'
    },
    body: JSON.stringify({
      email: `pass_match_${Date.now()}@example.com`,
      name: 'Pass Match Test',
      phone: '1234567890',
      password: 'Password123',
      confirmPassword: 'Password456'
    })
  });
  const result1 = await res1.json();
  console.log('Mismatched Response:', result1.errorCode, result1.message);

  // 2. Password too short
  console.log('2. Testing password too short...');
  const res2 = await fetch(baseUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Version': 'v1'
    },
    body: JSON.stringify({
      email: `pass_short_${Date.now()}@example.com`,
      name: 'Pass Short Test',
      phone: '1234567891',
      password: 'Pass1',
      confirmPassword: 'Pass1'
    })
  });
  const result2 = await res2.json();
  console.log('Short Response:', result2.errorCode, result2.message);

  // 3. Password missing complexity
  console.log('3. Testing password missing uppercase...');
  const res3 = await fetch(baseUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Version': 'v1'
    },
    body: JSON.stringify({
      email: `pass_complex_${Date.now()}@example.com`,
      name: 'Pass Complex Test',
      phone: '1234567892',
      password: 'password123',
      confirmPassword: 'password123'
    })
  });
  const result3 = await res3.json();
  console.log('Complexity Response:', result3.errorCode, result3.message);

  // 4. Valid Password
  console.log('4. Testing valid password and confirmation...');
  const res4 = await fetch(baseUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Version': 'v1'
    },
    body: JSON.stringify({
      email: `pass_valid_${Date.now()}@example.com`,
      name: 'Pass Valid Test',
      phone: '9876543210',
      password: 'Password123',
      confirmPassword: 'Password123'
    })
  });
  const result4 = await res4.json();
  console.log('Valid Response:', result4.code, result4.message);

}

testPasswordValidation().catch(console.error);
