/**
 * Retry Utility with Exponential Backoff
 * Provides robust retry logic with jitter for handling transient failures
 */

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {number} baseDelayMs - Base delay in milliseconds
 * @param {number} maxDelayMs - Maximum delay in milliseconds
 * @param {boolean} jitter - Whether to apply jitter
 * @returns {number} Delay in milliseconds
 */
function calculateDelay(attempt, baseDelayMs, maxDelayMs, jitter = true) {
  // Exponential backoff: baseDelay * 2^attempt
  let delay = baseDelayMs * Math.pow(2, attempt);
  
  // Cap at max delay
  delay = Math.min(delay, maxDelayMs);
  
  // Apply jitter: random value between 0 and delay
  if (jitter) {
    delay = Math.random() * delay;
  }
  
  return Math.floor(delay);
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {object} options - Retry options
 * @param {number} options.maxAttempts - Maximum number of attempts (default: 3)
 * @param {number} options.baseDelayMs - Base delay in milliseconds (default: 1000)
 * @param {number} options.maxDelayMs - Maximum delay in milliseconds (default: 10000)
 * @param {boolean} options.jitter - Apply jitter to delays (default: true)
 * @param {Function} options.onRetry - Callback on retry (receives error, attempt)
 * @param {Function} options.shouldRetry - Custom function to determine if should retry (receives error)
 * @returns {Promise<*>} Result of successful function call
 * @throws {Error} If all attempts fail
 */
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
      // Try to execute the function
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }
      
      // If this was the last attempt, throw
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      
      // Calculate delay for next attempt
      const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs, jitter);
      
      // Call onRetry callback if provided
      if (onRetry) {
        try {
          onRetry(error, attempt + 1, delay);
        } catch (callbackError) {
          console.error('Error in onRetry callback:', callbackError);
        }
      }
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  // This should never be reached, but just in case
  throw lastError;
}

/**
 * Check if error is retryable (network or rate limit errors)
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is retryable
 */
function isRetryableError(error) {
  // Network errors
  if (error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET') {
    return true;
  }
  
  // Rate limit errors (429)
  if (error.status === 429 || error.statusCode === 429) {
    return true;
  }
  
  // Server errors (500-599)
  if (error.status >= 500 || error.statusCode >= 500) {
    return true;
  }
  
  // Timeout errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
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
