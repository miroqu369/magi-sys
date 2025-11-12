# P0 Critical Fixes - Timeout Control Unification

## Changes Made

### 1. Unified Timeout Control (server.js)
**Problem**: Double timeout implementation caused unnecessary complexity
- Global timeout in server.js (60s)
- Provider-level timeout (30s each)
- AbortController created but signal never passed to providers

**Solution**:
- ✅ Reduced global timeout to 45s (reasonable for 3 parallel requests)
- ✅ Pass `signal` and `timeout` to all providers via `metaWithSignal`
- ✅ Providers now respect the abort signal for proper cancellation
- ✅ Added proper timeout cleanup with `clearTimeout()`
- ✅ Wrapped in try/catch to ensure timeout cleanup on errors

### 2. Code Quality Improvements
- Removed redundant `.catch()` blocks (Promise.allSettled handles failures)
- Added traceId to error logs for better debugging
- Proper indentation and structure

## Technical Details

**Before**:
```javascript
const controller = new AbortController();
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => controller.abort(), requestTimeout);
});
const results = await Promise.race([providersPromise, timeoutPromise]);
```

**After**:
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), requestTimeout);
try {
  const metaWithSignal = { ...meta, signal: controller.signal, timeout: requestTimeout };
  const results = await Promise.allSettled([
    grok.chat(prompt, metaWithSignal),
    // ...
  ]);
  clearTimeout(timeoutId);
} catch (innerError) {
  clearTimeout(timeoutId);
  throw innerError;
}
```

## Impact
- ⚡ Faster failure detection (requests actually cancel on timeout)
- 🔧 Cleaner error handling
- 📉 Reduced resource usage (hanging requests are aborted)
- 🎯 Single source of truth for timeout configuration

## Testing Recommendation
```bash
# Test with short timeout
REQUEST_TIMEOUT_MS=5000 npm start

# Test abort signal propagation
curl -X POST http://localhost:8080/api/consensus \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'
```
