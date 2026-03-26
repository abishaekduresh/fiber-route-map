
async function test() {
  try {
    console.log('Testing /api/auth/users/login...');
    const response = await fetch('http://localhost:3000/api/auth/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': 'v1'
      },
      body: JSON.stringify({ identifier: 'admin', password: 'Admin123' })
    });
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('Login successful with new path!');
      const token = data.data.token;
      
      console.log('Testing /api/auth/me...');
      const meResponse = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Version': 'v1'
        }
      });
      const meData = await meResponse.json();
      console.log('Me Response:', JSON.stringify(meData, null, 2));
      
      if (meData.success) {
        console.log('Profile retrieval successful!');
        // Check session link
        const session = meData.data.sessions[0];
        if (session && session.links.self.includes('/api/auth/users/sessions')) {
           console.log('Session self link is correct!');
        } else {
           console.error('Session self link is WRONG:', session?.links?.self);
        }
      }
    } else {
      console.error('Login failed:', data.message);
    }
  } catch (error) {
    console.error('Test script error:', error);
  }
}

test();
