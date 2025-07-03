const fetch = require('node-fetch');

async function testVoicePriority() {
  console.log('🧪 Testing voice-first prioritization...\n');

  const testData = {
    screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // Minimal test image
    audio: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    clipboard: 'Some clipboard content for testing',
    timestamp: Date.now()
  };

  try {
    console.log('📤 Sending test request with voice + screen content...');
    
    const response = await fetch('http://localhost:3001/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-token-for-local-development'
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Test completed successfully!');
    console.log('📊 Response metadata:');
    console.log(`   - Processing time: ${result.metadata.processingTime}ms`);
    console.log(`   - Screen text length: ${result.metadata.screenTextLength}`);
    console.log(`   - Transcript length: ${result.metadata.transcriptLength}`);
    console.log(`   - Clipboard length: ${result.metadata.clipboardLength}`);
    
    console.log('\n🤖 Assistant response:');
    console.log(result.result.answer);
    
    console.log('\n🎯 Voice-first prioritization test:');
    console.log('   - Voice input should be treated as the primary user message');
    console.log('   - Screen content should be labeled as "What I see on my screen"');
    console.log('   - The assistant should respond to the voice input first');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testVoicePriority(); 