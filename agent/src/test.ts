import { CatfishAgent } from './agent-setup.js';
import dotenv from 'dotenv';
import { join } from 'path';

// Load .env from the root directory (one level up from agent/)
dotenv.config({ path: join(process.cwd(), '../.env') });

async function testAgent() {
  try {
    console.log('🧪 Testing Catfish Agent with Letta Cloud...\n');

    // Check environment variables
    if (!process.env.LETTA_API_KEY) {
      console.error('❌ LETTA_API_KEY not found in environment');
      console.log('💡 Make sure to set LETTA_API_KEY in your .env file');
      process.exit(1);
    }

    if (!process.env.LETTA_AGENT_ID) {
      console.error('❌ LETTA_AGENT_ID not found in environment');
      console.log('💡 Run "npm run setup" first to create your agent');
      process.exit(1);
    }

    // Initialize the agent (this will test the connection)
    const agent = new CatfishAgent();
    
    // Test basic agent functionality
    console.log('📝 Testing basic agent conversation...');
    await agent.testAgent();
    
    console.log('\n📋 Listing your agents...');
    await agent.listAgents();
    
    console.log('\n✅ All tests passed! Your Catfish agent is ready to use.');
    console.log('🚀 You can now run "npm run dev" from the project root');

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        console.log('💡 Check your LETTA_API_KEY - it might be invalid or expired');
      } else if (error.message.includes('Agent not found')) {
        console.log('💡 Run "npm run setup" to create your Catfish agent');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        console.log('💡 Check your internet connection');
      }
    }
    
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testAgent();
} 