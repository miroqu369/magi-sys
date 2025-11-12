# Provider Abstraction and Robustness Features

This document describes the provider abstraction layer and robustness features added to the magi-sys project.

## Overview

The system now includes:
- Unified provider interface with timeout and retry support
- Exponential backoff retry utility
- Request timeout control
- Partial failure handling
- Trace ID logging for debugging
- ESLint configuration
- GitHub Actions CI/CD pipeline

## Provider Base Interface

All providers now extend the `BaseProvider` class which provides:

- **Unified interface**: `send(prompt, options)` method with standardized response format
- **AbortController support**: Allows cancellation of in-flight requests
- **Standardized response format**: `{ text, tokens, usage, model, latency, debug }`
- **Error enhancement**: Automatic error context enrichment

### Usage Example

```javascript
const provider = new AnthropicProvider();
const response = await provider.send('Your prompt here', {
  temperature: 0.7,
  timeout: 30000  // 30 seconds
});

console.log(response.text);
console.log(`Latency: ${response.latency}ms`);
```

## Retry Utility

The retry utility (`utils/retry.js`) provides robust retry logic with:

- Exponential backoff
- Jitter to prevent thundering herd
- Configurable retry conditions
- Callback support for monitoring retries

### Usage Example

```javascript
const { retry, isRetryableError } = require('./utils/retry');

const result = await retry(
  async () => await someApiCall(),
  {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    jitter: true,
    shouldRetry: isRetryableError,
    onRetry: (error, attempt, delay) => {
      console.log(`Retry ${attempt} after ${delay}ms`);
    }
  }
);
```

## Environment Variables

### Provider Configuration

- `ANTHROPIC_API_KEY`: Anthropic API key (required)
- `ANTHROPIC_MODEL`: Model to use (default: 'claude-sonnet-4-20250514')
- `ANTHROPIC_TIMEOUT_MS`: Request timeout in milliseconds (default: 30000, min: 1000, max: 300000)
- `ANTHROPIC_MAX_RETRIES`: Maximum retry attempts (default: 3)

### Server Configuration

- `REQUEST_TIMEOUT_MS`: Global request timeout in milliseconds (default: 60000)
- `MIN_VALID_RESPONSES`: Minimum valid provider responses required (default: 1)
- `PORT`: Server port (default: 8080)

## API Response Format

### Success Response

```json
{
  "version": "2.0.0",
  "final": "Final synthesized response",
  "mode": "integration",
  "judge": {
    "model": "gpt-4o-mini",
    "method": "integration",
    "name": "Isabelle"
  },
  "candidates": [
    {
      "provider": "grok",
      "magi_unit": "BALTHASAR-2",
      "role": "創造的・革新的分析",
      "ok": true,
      "text": "Response from Grok"
    }
  ],
  "metrics": {
    "response_time_ms": 1234,
    "valid_responses": 3,
    "agreement_ratio": 1.0,
    "timestamp": "2024-11-12T04:00:00.000Z",
    "traceId": "trace-1699747200000-abc123"
  }
}
```

### Error Response (503 Service Unavailable)

```json
{
  "error": "Service temporarily unavailable",
  "message": "Insufficient valid responses from providers (0/1)",
  "traceId": "trace-1699747200000-abc123",
  "candidates": [...],
  "version": "2.0.0"
}
```

## Trace ID Logging

All requests are assigned a unique trace ID for debugging:

```
[trace-1699747200000-abc123] Processing integration mode for: What is AI?...
[trace-1699747200000-abc123] Grok error: Connection timeout
[trace-1699747200000-abc123] Insufficient valid responses: 0/1
```

Trace IDs are included in all error responses for easy log correlation.

## Testing

Run tests:
```bash
npm test
```

Run linter:
```bash
npm run lint
```

Run both:
```bash
npm run lint && npm test
```

## CI/CD

The GitHub Actions workflow automatically runs on push and pull requests:

1. Checks out code
2. Sets up Node.js (18.x and 20.x)
3. Installs dependencies
4. Runs ESLint
5. Runs tests
6. Checks for security vulnerabilities

## Security Considerations

- Request timeouts are validated and capped (1s - 5min)
- GitHub Actions workflow uses minimal permissions
- No secrets are committed to the repository
- All API keys should be provided via environment variables or Secret Manager

## Backward Compatibility

All changes maintain backward compatibility:
- Providers still expose the original `chat()` method
- Existing server endpoints work unchanged
- Response format is extended, not modified

## Future Enhancements

Potential improvements:
- Add retry support to other providers (Gemini, Grok, OpenAI)
- Implement circuit breaker pattern
- Add metrics collection and monitoring
- Implement request rate limiting
- Add response caching
