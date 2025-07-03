#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🐟 Catfish Setup Checker\n');

// Check if .env file exists
const envPath = path.join(__dirname, 'server', '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  let hasApiKey = false;
  let hasAgentId = false;
  
  for (const line of lines) {
    if (line.startsWith('LETTA_API_KEY=') && !line.includes('your_')) {
      hasApiKey = true;
    }
    if (line.startsWith('LETTA_AGENT_ID=') && !line.includes('agent-xxxxxxxxx')) {
      hasAgentId = true;
    }
  }
  
  if (hasApiKey) {
    console.log('✅ LETTA_API_KEY is configured');
  } else {
    console.log('❌ LETTA_API_KEY is missing or not set');
  }
  
  if (hasAgentId) {
    console.log('✅ LETTA_AGENT_ID is configured');
  } else {
    console.log('❌ LETTA_AGENT_ID is missing or not set');
  }
} else {
  console.log('❌ .env file not found');
  console.log('   Run: cp server/env.example server/.env');
  console.log('   Then edit server/.env with your Letta API key');
}

// Check if server is running
console.log('\n🔍 Checking server status...');

const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/health', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Server is running on port 3001');
        resolve(true);
      } else {
        console.log(`❌ Server responded with status ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log('❌ Server is not running on port 3001');
        console.log('   Start the server with: cd server && npm run dev');
      } else {
        console.log(`❌ Server check failed: ${err.message}`);
      }
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Server check timed out');
      resolve(false);
    });
  });
};

checkServer().then((serverRunning) => {
  if (serverRunning) {
    // Check detailed health
    const req = http.get('http://localhost:3001/health/detailed', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          console.log('\n📊 Server Health:');
          console.log(`   Environment: ${health.environment.nodeEnv}`);
          console.log(`   Port: ${health.environment.port}`);
          console.log(`   Letta API Key: ${health.letta.apiKey}`);
          console.log(`   Letta Agent ID: ${health.letta.agentId}`);
          console.log(`   Letta Connection: ${health.letta.connection.status}`);
          
          if (health.letta.connection.status === 'unhealthy') {
            console.log(`   Error: ${health.letta.connection.details.error}`);
          }
        } catch (err) {
          console.log('❌ Failed to parse health response');
        }
      });
    });
    
    req.on('error', () => {
      console.log('❌ Failed to get detailed health');
    });
  }
  
  console.log('\n📋 Next Steps:');
  if (!fs.existsSync(envPath)) {
    console.log('1. Create .env file: cp server/env.example server/.env');
    console.log('2. Add your Letta API key to server/.env');
  }
  if (!serverRunning) {
    console.log('1. Start the server: cd server && npm run dev');
  }
  console.log('2. Start the client: cd client && npm run dev');
  console.log('3. Press Cmd+Shift+A (Mac) or Ctrl+Shift+A (Windows/Linux) to test');
}); 