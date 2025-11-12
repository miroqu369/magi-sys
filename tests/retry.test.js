/**
 * Tests for retry utility
 */
const { retry, calculateDelay, isRetryableError } = require('../utils/retry');

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

// Test calculateDelay
function testCalculateDelay() {
  console.log('Testing calculateDelay...');
  
  // Test exponential backoff without jitter
  const delay0 = calculateDelay(0, 1000, 10000, false);
  assertEqual(delay0, 1000, 'First attempt should be base delay');
  
  const delay1 = calculateDelay(1, 1000, 10000, false);
  assertEqual(delay1, 2000, 'Second attempt should be 2x base delay');
  
  const delay2 = calculateDelay(2, 1000, 10000, false);
  assertEqual(delay2, 4000, 'Third attempt should be 4x base delay');
  
  // Test max delay cap
  const delay10 = calculateDelay(10, 1000, 5000, false);
  assertEqual(delay10, 5000, 'Delay should be capped at max');
  
  // Test with jitter (should be between 0 and calculated delay)
  const delayWithJitter = calculateDelay(2, 1000, 10000, true);
  assert(delayWithJitter >= 0 && delayWithJitter <= 4000, 'Jitter delay should be within range');
  
  console.log('✅ calculateDelay tests passed');
}

// Test isRetryableError
function testIsRetryableError() {
  console.log('Testing isRetryableError...');
  
  // Network errors
  const networkError = new Error('Connection failed');
  networkError.code = 'ECONNREFUSED';
  assert(isRetryableError(networkError), 'ECONNREFUSED should be retryable');
  
  const timeoutError = new Error('Timeout');
  timeoutError.code = 'ETIMEDOUT';
  assert(isRetryableError(timeoutError), 'ETIMEDOUT should be retryable');
  
  // Rate limit error
  const rateLimitError = new Error('Rate limited');
  rateLimitError.status = 429;
  assert(isRetryableError(rateLimitError), '429 status should be retryable');
  
  // Server error
  const serverError = new Error('Server error');
  serverError.status = 503;
  assert(isRetryableError(serverError), '503 status should be retryable');
  
  // Abort error
  const abortError = new Error('Request aborted');
  abortError.name = 'AbortError';
  assert(isRetryableError(abortError), 'AbortError should be retryable');
  
  // Non-retryable error
  const clientError = new Error('Bad request');
  clientError.status = 400;
  assert(!isRetryableError(clientError), '400 status should not be retryable');
  
  console.log('✅ isRetryableError tests passed');
}

// Test retry function
async function testRetrySuccess() {
  console.log('Testing retry with immediate success...');
  
  let attempts = 0;
  const fn = async () => {
    attempts++;
    return 'success';
  };
  
  const result = await retry(fn, { maxAttempts: 3 });
  assertEqual(result, 'success', 'Should return success result');
  assertEqual(attempts, 1, 'Should succeed on first attempt');
  
  console.log('✅ retry success test passed');
}

async function testRetryEventualSuccess() {
  console.log('Testing retry with eventual success...');
  
  let attempts = 0;
  const fn = async () => {
    attempts++;
    if (attempts < 3) {
      const error = new Error('Temporary failure');
      error.status = 503;
      throw error;
    }
    return 'success';
  };
  
  const result = await retry(fn, {
    maxAttempts: 3,
    baseDelayMs: 10,
    maxDelayMs: 50
  });
  
  assertEqual(result, 'success', 'Should eventually succeed');
  assertEqual(attempts, 3, 'Should take 3 attempts');
  
  console.log('✅ retry eventual success test passed');
}

async function testRetryFailure() {
  console.log('Testing retry with all failures...');
  
  let attempts = 0;
  const fn = async () => {
    attempts++;
    const error = new Error('Permanent failure');
    error.status = 503;
    throw error;
  };
  
  try {
    await retry(fn, {
      maxAttempts: 3,
      baseDelayMs: 10,
      maxDelayMs: 50
    });
    throw new Error('Should have thrown error');
  } catch (error) {
    assertEqual(error.message, 'Permanent failure', 'Should throw last error');
    assertEqual(attempts, 3, 'Should attempt max times');
  }
  
  console.log('✅ retry failure test passed');
}

async function testRetryWithCallback() {
  console.log('Testing retry with onRetry callback...');
  
  let attempts = 0;
  let retryCallbacks = 0;
  const fn = async () => {
    attempts++;
    if (attempts < 2) {
      throw new Error('Temporary failure');
    }
    return 'success';
  };
  
  const result = await retry(fn, {
    maxAttempts: 3,
    baseDelayMs: 10,
    onRetry: (error, attempt, _delay) => {
      retryCallbacks++;
      assert(error.message === 'Temporary failure', 'Should receive error');
      assert(attempt === 1, 'Should be first retry');
    }
  });
  
  assertEqual(result, 'success', 'Should succeed');
  assertEqual(retryCallbacks, 1, 'Should call onRetry once');
  
  console.log('✅ retry callback test passed');
}

async function testRetryShouldRetry() {
  console.log('Testing retry with shouldRetry function...');
  
  let attempts = 0;
  const fn = async () => {
    attempts++;
    const error = new Error('Client error');
    error.status = 400;
    throw error;
  };
  
  try {
    await retry(fn, {
      maxAttempts: 3,
      baseDelayMs: 10,
      shouldRetry: (error) => error.status >= 500
    });
    throw new Error('Should have thrown error');
  } catch (error) {
    assertEqual(error.message, 'Client error', 'Should throw original error');
    assertEqual(attempts, 1, 'Should not retry client errors');
  }
  
  console.log('✅ retry shouldRetry test passed');
}

// Run all tests
async function runTests() {
  console.log('Running retry utility tests...\n');
  
  try {
    // Synchronous tests
    testCalculateDelay();
    testIsRetryableError();
    
    // Asynchronous tests
    await testRetrySuccess();
    await testRetryEventualSuccess();
    await testRetryFailure();
    await testRetryWithCallback();
    await testRetryShouldRetry();
    
    console.log('\n✅ All tests passed!');
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
