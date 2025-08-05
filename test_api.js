async function testAPI() {
  try {
    console.log('Testing API logging functionality...');
    
    // First, login to get a token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Login successful, token received');
    
    // Test a successful API request
    const testResponse = await fetch('http://localhost:5000/api/testing/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        method: 'GET'
      })
    });
    
    const testData = await testResponse.json();
    console.log('✅ API test successful:', {
      status: testData.data.response.status,
      success: testData.data.response.success,
      responseTime: testData.data.response.responseTime
    });
    
    // Check logs
    const logsResponse = await fetch('http://localhost:5000/api/logs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const logsData = await logsResponse.json();
    console.log('✅ Logs retrieved:', {
      total: logsData.data.pagination.total,
      logs: logsData.data.logs.length
    });
    
    console.log('Recent logs:');
    logsData.data.logs.slice(0, 5).forEach(log => {
      console.log(`  - ${log.method} ${log.fullUrl} -> ${log.status} (${log.success ? 'SUCCESS' : 'FAILED'})`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI(); 