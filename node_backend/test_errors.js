
async function testErrors() {
  const baseUrl = 'http://localhost:3000/api';
  
  // 1. Get a valid token
  console.log('--- Logging in to get valid token ---');
  let loginRes = await fetch(`${baseUrl}/auth/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Version': 'v1' },
    body: JSON.stringify({ identifier: 'admin', password: 'Admin123' })
  });
  let loginData = await loginRes.json();
  
  if (loginData.statusCode === 403 && loginData.errorType === 'SESSION_LIMIT_REACHED') {
    console.log('Session limit reached. Attempting to terminate an old session...');
    const sessionToKill = loginData.data.activeSessions[0].uuid;
    await fetch(`${baseUrl}/auth/users/sessions/${sessionToKill}`, {
      method: 'DELETE',
      headers: { 
        'X-API-Version': 'v1',
        'X-Mgmt-Token': loginData.data.mgmtToken
      }
    });
    console.log('Session terminated. Retrying login...');
    loginRes = await fetch(`${baseUrl}/auth/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Version': 'v1' },
      body: JSON.stringify({ identifier: 'admin', password: 'Admin123' })
    });
    loginData = await loginRes.json();
  }

  const token = loginData.data?.token;
  if (!token) {
    console.error('Failed to get token:', JSON.stringify(loginData, null, 2));
  } else {
    console.log('Token obtained successfully.\n');
  }

  const cases = [
    {
      name: 'Invalid Login (401)',
      url: `${baseUrl}/auth/users/login`,
      method: 'POST',
      body: { identifier: 'wrong', password: 'wrong' }
    },
    {
      name: 'User Not Found (404)',
      url: `${baseUrl}/users/00000000-0000-0000-0000-000000000000`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    },
    {
      name: 'Zod Validation Error (400)',
      url: `${baseUrl}/users`,
      method: 'POST',
      body: { email: 'not-an-email' },
      headers: { 'Authorization': `Bearer ${token}` }
    }
  ];

  for (const c of cases) {
    console.log(`--- Testing: ${c.name} ---`);
    try {
      const response = await fetch(c.url, {
        method: c.method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': 'v1',
          ...c.headers
        },
        body: (c.method === 'POST' || c.method === 'PUT') ? JSON.stringify(c.body) : undefined
      });
      const data = await response.json();
      console.log(`Status: ${data.statusCode}`);
      console.log(`ErrorType: ${data.errorType}`);
      console.log(`Message: ${data.message}`);
    } catch (e) {
      console.error(`Request failed: ${e.message}`);
    }
    console.log('');
  }
}

testErrors();
