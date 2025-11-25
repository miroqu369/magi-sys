/**
 * Retry Utility with Exponential Backoff
 * Provides robust retry logic with jitter for handling transient failures
 */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateDelay(attempt, baseDelayMs, maxDelayMs, jitter = true) {
  let delay = baseDelayMs * Math.pow(2, attempt);
  delay = Math.min(delay, maxDelayMs);
  if (jitter) {
    delay = Math.random() * delay;
  }
  return Math.floor(delay);
}

async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    jitter = true,
    onRetry = null,
    shouldRetry = null
  } = options;

  let lastError = null;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }
      
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      
      const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs, jitter);
      
      if (onRetry) {
        try {
          onRetry(error, attempt + 1, delay);
        } catch (callbackError) {
          console.error('Error in onRetry callback:', callbackError);
        }
      }
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

function isRetryableError(error) {
  // Network errors
  if (error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET') {
    return true;
  }
  
  // 529 Overloaded (Anthropic specific)
  if (error.status === 529 || error.statusCode === 529) {
    console.warn('[Retry] 529 Overloaded error detected - will retry');
    return true;
  }
  
  // Rate limit errors (429)
  if (error.status === 429 || error.statusCode === 429) {
    return true;
  }
  
  // Server errors (500-599)
  if ((error.status && error.status >= 500) || (error.statusCode && error.statusCode >= 500)) {
    return true;
  }
  
  // Timeout errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return true;
  }
  
  // Anthropic specific error messages
  if (error.message?.includes('Overloaded') || error.message?.includes('429') || error.message?.includes('529')) {
    console.warn(`[Retry] Anthropic error detected: ${error.message} - will retry`);
    return true;
  }
  
  return false;
}

module.exports = {
  retry,
  calculateDelay,
  sleep,
  isRetryableError
};
