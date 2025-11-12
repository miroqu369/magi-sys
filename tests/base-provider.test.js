/**
 * Tests for BaseProvider
 */
const BaseProvider = require('../providers/base');

// Simple test runner
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

// Test BaseProvider instantiation
function testBaseProviderCreation() {
  console.log('Testing BaseProvider creation...');
  
  const provider = new BaseProvider('test-provider', { model: 'test-model' });
  assertEqual(provider.name, 'test-provider', 'Provider name should be set');
  assertEqual(provider.config.model, 'test-model', 'Config should be set');
  assert(provider.isConfigured(), 'Provider should be configured by default');
  assertEqual(provider.getName(), 'test-provider', 'getName should return provider name');
  
  console.log('✅ BaseProvider creation test passed');
}

// Test send method throws error if not implemented
async function testSendNotImplemented() {
  console.log('Testing BaseProvider send throws error...');
  
  const provider = new BaseProvider('test-provider');
  
  try {
    await provider.send('test prompt');
    throw new Error('Should have thrown error');
  } catch (error) {
    assert(error.message.includes('send() not implemented'), 'Should throw not implemented error');
    assert(error.message.includes('test-provider'), 'Error should include provider name');
  }
  
  console.log('✅ BaseProvider send error test passed');
}

// Test _formatResponse
function testFormatResponse() {
  console.log('Testing _formatResponse...');
  
  const provider = new BaseProvider('test-provider', { model: 'test-model-v1' });
  
  const response = provider._formatResponse('Test response text', {
    tokens: 100,
    usage: { prompt_tokens: 10, completion_tokens: 90 },
    latency: 1500,
    debug: { test: true }
  });
  
  assertEqual(response.text, 'Test response text', 'Text should be set');
  assertEqual(response.tokens, 100, 'Tokens should be set');
  assertEqual(response.usage.prompt_tokens, 10, 'Usage should be set');
  assertEqual(response.model, 'test-model-v1', 'Model should be from metadata');
  assertEqual(response.latency, 1500, 'Latency should be set');
  assert(response.debug.test, 'Debug info should be set');
  
  // Test with minimal metadata
  const minimalResponse = provider._formatResponse('Minimal response');
  assertEqual(minimalResponse.text, 'Minimal response', 'Text should be set');
  assertEqual(minimalResponse.tokens, null, 'Tokens should be null');
  assertEqual(minimalResponse.model, 'test-model-v1', 'Model should be from config');
  
  console.log('✅ _formatResponse test passed');
}

// Test _enhanceError
function testEnhanceError() {
  console.log('Testing _enhanceError...');
  
  const provider = new BaseProvider('test-provider');
  const originalError = new Error('Original error message');
  
  const enhanced = provider._enhanceError(originalError, {
    prompt: 'test prompt',
    attempt: 1
  });
  
  assert(enhanced.message.includes('[test-provider]'), 'Error message should include provider name');
  assert(enhanced.message.includes('Original error message'), 'Error message should include original message');
  assertEqual(enhanced.provider, 'test-provider', 'Provider should be set');
  assertEqual(enhanced.originalError, originalError, 'Original error should be attached');
  assertEqual(enhanced.context.prompt, 'test prompt', 'Context should be set');
  assert(enhanced.timestamp, 'Timestamp should be set');
  
  console.log('✅ _enhanceError test passed');
}

// Test custom provider implementation
class TestProvider extends BaseProvider {
  constructor() {
    super('test-provider', { model: 'test-model' });
  }
  
  async send(prompt, options = {}) {
    const startTime = Date.now();
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const text = `Response to: ${prompt}`;
      const latency = Date.now() - startTime;
      
      return this._formatResponse(text, {
        tokens: 50,
        model: this.config.model,
        latency
      });
    } catch (error) {
      const latency = Date.now() - startTime;
      throw this._enhanceError(error, { prompt, options, latency });
    }
  }
}

async function testCustomProvider() {
  console.log('Testing custom provider implementation...');
  
  const provider = new TestProvider();
  const response = await provider.send('test prompt');
  
  assertEqual(response.text, 'Response to: test prompt', 'Response text should be correct');
  assertEqual(response.model, 'test-model', 'Model should be set');
  assertEqual(response.tokens, 50, 'Tokens should be set');
  assert(response.latency >= 10, 'Latency should be at least 10ms');
  
  console.log('✅ Custom provider test passed');
}

// Run all tests
async function runTests() {
  console.log('Running BaseProvider tests...\n');
  
  try {
    // Synchronous tests
    testBaseProviderCreation();
    testFormatResponse();
    testEnhanceError();
    
    // Asynchronous tests
    await testSendNotImplemented();
    await testCustomProvider();
    
    console.log('\n✅ All BaseProvider tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if this is the main module
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
