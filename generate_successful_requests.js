async function generateSuccessfulRequests() {
  try {
    console.log('🔧 Generating successful API requests for testing...');
    
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
    
    // Test URLs that should return status 200
    const testRequests = [
      {
        name: 'GET Posts',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        method: 'GET'
      },
      {
        name: 'GET Users',
        url: 'https://jsonplaceholder.typicode.com/users/1',
        method: 'GET'
      },
      {
        name: 'GET Comments',
        url: 'https://jsonplaceholder.typicode.com/comments/1',
        method: 'GET'
      },
      {
        name: 'POST Create Post',
        url: 'https://jsonplaceholder.typicode.com/posts',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { title: 'Test Post', body: 'Test content', userId: 1 }
      },
      {
        name: 'PUT Update Post',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: { id: 1, title: 'Updated Post', body: 'Updated content', userId: 1 }
      }
    ];
    
    console.log(`\n📡 Making ${testRequests.length} successful requests...`);
    
    for (let i = 0; i < testRequests.length; i++) {
      const request = testRequests[i];
      console.log(`\n${i + 1}. Testing: ${request.name}`);
      
      const requestData = {
        url: request.url,
        method: request.method
      };
      
      if (request.headers) {
        requestData.headers = request.headers;
      }
      
      if (request.body) {
        requestData.body = request.body;
      }
      
      const response = await fetch('http://localhost:5000/api/testing/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`   ✅ ${request.name}: Status ${data.data.response.status} (${data.data.response.success ? 'SUCCESS' : 'FAILED'}) - ${data.data.response.responseTime}ms`);
      } else {
        console.log(`   ❌ ${request.name}: Failed - ${data.message}`);
      }
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Check logs after all requests
    console.log('\n📊 Checking logs...');
    const logsResponse = await fetch('http://localhost:5000/api/logs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const logsData = await logsResponse.json();
    console.log(`\n📋 Total logs: ${logsData.data.pagination.total}`);
    
    console.log('\n📝 Recent logs (last 10):');
    logsData.data.logs.slice(0, 10).forEach((log, index) => {
      const status = log.status === 200 ? '✅ 200' : log.status === 201 ? '✅ 201' : `❌ ${log.status}`;
      console.log(`   ${index + 1}. ${log.method} ${log.fullUrl} -> ${status} (${log.success ? 'SUCCESS' : 'FAILED'}) - ${log.responseTime}ms`);
    });
    
    // Count successful vs failed requests
    const successful = logsData.data.logs.filter(log => log.success).length;
    const failed = logsData.data.logs.filter(log => !log.success).length;
    
    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Successful requests: ${successful}`);
    console.log(`   ❌ Failed requests: ${failed}`);
    console.log(`   📊 Success rate: ${((successful / (successful + failed)) * 100).toFixed(1)}%`);
    
    console.log('\n🎉 Test completed! Check your API Logs page now.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

generateSuccessfulRequests(); 