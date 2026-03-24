const baseUrl = 'http://localhost:3000/api/users';

async function testPagination() {
  console.log('--- Testing Pagination ---');

  // 1. Fetch with limit 2
  console.log('1. Fetching page 1 with limit 2...');
  const res1 = await fetch(`${baseUrl}?page=1&limit=2`, {
    headers: { 'X-API-Version': 'v1' }
  });
  const result1 = await res1.json();
  console.log('Page 1 Result:', {
    count: result1.data.length,
    total: result1.meta.pagination.total,
    totalPages: result1.meta.pagination.totalPages,
    page: result1.meta.pagination.page
  });

  // 2. Fetch page 2
  console.log('2. Fetching page 2 with limit 2...');
  const res2 = await fetch(`${baseUrl}?page=2&limit=2`, {
    headers: { 'X-API-Version': 'v1' }
  });
  const result2 = await res2.json();
  console.log('Page 2 Result:', {
    count: result2.data.length,
    page: result2.meta.pagination.page
  });

  // 3. Fetch default (page 1, limit 10)
  console.log('3. Fetching with defaults...');
  const res3 = await fetch(baseUrl, {
    headers: { 'X-API-Version': 'v1' }
  });
  const result3 = await res3.json();
  console.log('Default Result:', {
    limit: result3.meta.pagination.limit,
    page: result3.meta.pagination.page
  });
  // 4. Fetch all (limit -1)
  console.log('4. Fetching all with limit -1...');
  const res4 = await fetch(`${baseUrl}?limit=-1`, {
    headers: { 'X-API-Version': 'v1' }
  });
  const result4 = await res4.json();
  console.log('All Result:', {
    count: result4.data.length,
    total: result4.meta.pagination.total,
    totalPages: result4.meta.pagination.totalPages
  });
}

testPagination().catch(console.error);
