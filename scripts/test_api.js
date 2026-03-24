// Using built-in fetch (Node 18+)

const baseUrl = 'http://localhost:3000/api/users';

async function test() {
  console.log('--- Testing API ---');

  // 1. Create User
  console.log('1. Creating user...');
  const createRes = await fetch(baseUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Version': 'v1'
    },
    body: JSON.stringify({
      email: `test_${Date.now()}@example.com`,
      name: 'Node Test User',
      phone: String(Math.floor(Math.random() * 9000000000) + 1000000000),
      password: 'Password123',
      confirmPassword: 'Password123'
    })
  });
  
  const result = await createRes.json();
  console.log('Create Response:', createRes.status, JSON.stringify(result, null, 2));

  if (!result.success) {
    console.error('Failed to create user:', result.message);
    return;
  }

  const user = result.data;
  const uuid = user.id;

  // 2. Get User
  console.log(`2. Getting user ${uuid}...`);
  const getRes = await fetch(`${baseUrl}/${uuid}`, {
    headers: { 'X-API-Version': 'v1' }
  });
  const getResult = await getRes.json();
  console.log('Get Response:', getRes.status, JSON.stringify(getResult, null, 2));

  // 3. Update User
  console.log(`3. Updating user ${uuid}...`);
  const updateRes = await fetch(`${baseUrl}/${uuid}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Version': 'v1'
    },
    body: JSON.stringify({ name: 'Updated Name' })
  });
  const updateResult = await updateRes.json();
  console.log('Update Response:', updateRes.status, JSON.stringify(updateResult, null, 2));

  // 4. Block User
  console.log(`4. Blocking user ${uuid}...`);
  const blockRes = await fetch(`${baseUrl}/${uuid}/block`, { 
    method: 'POST',
    headers: { 'X-API-Version': 'v1' }
  });
  const blockResult = await blockRes.json();
  console.log('Block Response:', blockRes.status, JSON.stringify(blockResult, null, 2));

  // 5. Unblock User
  console.log(`5. Unblocking user ${uuid}...`);
  const unblockRes = await fetch(`${baseUrl}/${uuid}/unblock`, { 
    method: 'PUT',
    headers: { 'X-API-Version': 'v1' }
  });
  const unblockResult = await unblockRes.json();
  console.log('Unblock Response:', unblockRes.status, JSON.stringify(unblockResult, null, 2));

  // 6. Delete User
  console.log(`6. Deleting user ${uuid}...`);
  const deleteRes = await fetch(`${baseUrl}/${uuid}`, { 
    method: 'DELETE',
    headers: { 'X-API-Version': 'v1' }
  });
  const deleteResult = await deleteRes.json();
  console.log('Delete Response:', deleteRes.status, JSON.stringify(deleteResult, null, 2));

  // 7. Advanced Filtering and Sorting
  console.log('7. Testing Advanced Filtering and Sorting (?filter[name]=Node&sort=-name)...');
  const advancedRes = await fetch(`${baseUrl}?filter[name]=Node&sort=-name`, {
    headers: { 'X-API-Version': 'v1' }
  });
  const advancedResult = await advancedRes.json();
  console.log('Advanced Query Response:', advancedRes.status, JSON.stringify(advancedResult, null, 2));
  
  if (advancedResult.success && advancedResult.meta.pagination.total > 0) {
    console.log('SUCCESS: Advanced filtering and sorting working correctly.');
  }

  console.log('--- Testing Finished ---');
}

test().catch(console.error);
