# Week 1 Implementation Guide - Critical Security Fixes
**Priority:** P0 - MUST FIX BEFORE ANY LAUNCH  
**Timeline:** 5 days (40 hours)  
**Owner:** Senior Backend/Security Engineer

---

## Overview

This guide provides step-by-step instructions for implementing the **critical security fixes** identified in the product readiness analysis. These fixes MUST be completed before launching any beta or production version.

---

## Day 1-2: Remove eval() & Implement Rate Limiting

### Task 1: Remove eval() Usage (4 hours)
**File:** `src/components/CodeChallengesPanel.tsx` (lines 135, 142)

**Current Code (INSECURE):**
```typescript
// Line 135
const result = eval(solution);

// Line 142  
const result = eval(userCode);
```

**Security Risk:** Code injection vulnerability - users could execute arbitrary JavaScript

**Solution Option 1: Use Function Constructor (Safer)**
```typescript
// Replace line 135
const executeCode = new Function('return ' + solution);
const result = executeCode();

// Replace line 142
const executeCode = new Function('return ' + userCode);
const result = executeCode();
```

**Solution Option 2: Use Web Worker (RECOMMENDED)**
```typescript
// Create new file: src/workers/code-executor.ts
self.addEventListener('message', (e) => {
  const { id, code } = e.data;
  
  try {
    const result = new Function('return ' + code)();
    self.postMessage({ id, result, error: null });
  } catch (error) {
    self.postMessage({ id, result: null, error: error.message });
  }
});

// In CodeChallengesPanel.tsx
const worker = new Worker(new URL('../workers/code-executor.ts', import.meta.url));

const executeCode = (code: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36);
    
    const handler = (e: MessageEvent) => {
      if (e.data.id === id) {
        worker.removeEventListener('message', handler);
        if (e.data.error) reject(new Error(e.data.error));
        else resolve(e.data.result);
      }
    };
    
    worker.addEventListener('message', handler);
    worker.postMessage({ id, code });
  });
};

// Replace eval() calls with:
const result = await executeCode(solution);
const result = await executeCode(userCode);
```

**Testing:**
```typescript
// Add tests in new file: src/components/CodeChallengesPanel.test.tsx
import { describe, it, expect } from 'vitest';

describe('Code Execution', () => {
  it('should execute valid code', async () => {
    const result = await executeCode('1 + 1');
    expect(result).toBe(2);
  });
  
  it('should handle errors safely', async () => {
    await expect(executeCode('throw new Error("test")')).rejects.toThrow();
  });
  
  it('should not allow dangerous operations', async () => {
    // Add sandboxing checks
  });
});
```

---

### Task 2: Implement API Rate Limiting (12 hours)

**Step 1: Install Dependencies**
```bash
npm install express-rate-limit redis
npm install @types/express-rate-limit --save-dev
```

**Step 2: Create Rate Limiting Middleware**
Create `src/lib/rate-limiter.ts`:
```typescript
import { rateLimit } from 'express-rate-limit';

// AI API rate limiting
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour per user
  message: 'Too many AI requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Use Redis for distributed rate limiting in production
  // store: new RedisStore({ ... })
});

// Experiment tracking rate limiting
export const experimentRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1000, // 1000 experiments per day
  message: 'Daily experiment limit reached.',
});

// Paper search rate limiting
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 searches per hour
  message: 'Too many searches. Please try again later.',
});
```

**Step 3: Client-Side Rate Limit Detection**
Update `src/lib/api.ts`:
```typescript
export async function fetchWithRateLimit(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    // Rate limit exceeded
    const retryAfter = response.headers.get('Retry-After');
    toast.error(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);
    throw new Error('Rate limit exceeded');
  }
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response;
}

// Update all API calls to use fetchWithRateLimit
export async function generateAICompletion(prompt: string) {
  const response = await fetchWithRateLimit('/api/ai/completion', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
  return response.json();
}
```

**Step 4: UI Feedback for Rate Limits**
Create `src/components/RateLimitWarning.tsx`:
```typescript
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function RateLimitWarning({ remaining, limit, resetTime }: {
  remaining: number;
  limit: number;
  resetTime: Date;
}) {
  const percentage = (remaining / limit) * 100;
  
  if (percentage > 20) return null;
  
  return (
    <Alert variant={percentage < 10 ? 'destructive' : 'warning'}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Rate Limit Warning</AlertTitle>
      <AlertDescription>
        You have {remaining} of {limit} requests remaining.
        Resets at {resetTime.toLocaleTimeString()}.
      </AlertDescription>
    </Alert>
  );
}
```

**Step 5: Backend API Proxy (If API keys are client-side)**
Create `api/ai-proxy.ts` (Vercel serverless function):
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { aiRateLimiter } from '../src/lib/rate-limiter';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply rate limiting
  await aiRateLimiter(req, res, async () => {
    const { prompt } = req.body;
    
    // Call OpenAI with server-side API key
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    
    const data = await response.json();
    res.status(200).json(data);
  });
}
```

**Testing:**
```typescript
// Test rate limiting
describe('Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    for (let i = 0; i < 10; i++) {
      const response = await fetchWithRateLimit('/api/test');
      expect(response.ok).toBe(true);
    }
  });
  
  it('should reject requests exceeding limit', async () => {
    // Make 101 requests
    const requests = Array(101).fill(null).map(() => 
      fetchWithRateLimit('/api/test')
    );
    
    await expect(Promise.all(requests)).rejects.toThrow('Rate limit exceeded');
  });
});
```

---

## Day 3: Input Validation

### Task 3: File Operations Validation (6 hours)

**Create Validation Utility**
Create `src/lib/validation.ts`:
```typescript
import { z } from 'zod';

// File name validation schema
export const fileNameSchema = z.string()
  .min(1, 'File name cannot be empty')
  .max(255, 'File name too long')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid characters in file name')
  .refine(
    (name) => !name.includes('..'),
    'File name cannot contain ..'
  )
  .refine(
    (name) => !name.startsWith('/'),
    'File name cannot be absolute path'
  );

// File size validation (10MB max)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFileSize(content: string): boolean {
  const size = new Blob([content]).size;
  if (size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is 10MB.`);
  }
  return true;
}

// File count limit
export const MAX_FILES_PER_WORKSPACE = 500;

export function validateFileCount(currentCount: number): boolean {
  if (currentCount >= MAX_FILES_PER_WORKSPACE) {
    throw new Error(`Maximum ${MAX_FILES_PER_WORKSPACE} files per workspace.`);
  }
  return true;
}

// Allowed file extensions
export const ALLOWED_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt',
  '.css', '.html', '.py', '.java', '.cpp', '.c', '.go',
  '.rs', '.rb', '.php', '.sh', '.yaml', '.yml', '.toml',
];

export function validateFileExtension(fileName: string): boolean {
  const ext = fileName.substring(fileName.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`File type ${ext} not allowed.`);
  }
  return true;
}
```

**Update App.tsx with Validation**
```typescript
import { fileNameSchema, validateFileSize, validateFileCount, validateFileExtension } from '@/lib/validation';

const handleFileCreate = (name: string) => {
  try {
    // Validate file name
    fileNameSchema.parse(name);
    
    // Validate file extension
    validateFileExtension(name);
    
    // Validate file count
    validateFileCount(files.length);
    
    // Create file
    const newFile: FileItem = {
      id: generateId(),
      name,
      content: '',
      language: detectLanguage(name),
    };
    
    setFiles((prev) => [...prev, newFile]);
    toast.success(`File "${name}" created`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      toast.error(error.errors[0].message);
    } else {
      toast.error(error.message);
    }
  }
};

const handleFileSave = (fileId: string, content: string) => {
  try {
    // Validate file size
    validateFileSize(content);
    
    // Save file
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, content } : f))
    );
    toast.success('File saved');
  } catch (error) {
    toast.error(error.message);
  }
};
```

**Testing:**
```typescript
describe('File Validation', () => {
  it('should reject invalid file names', () => {
    expect(() => fileNameSchema.parse('../etc/passwd')).toThrow();
    expect(() => fileNameSchema.parse('/etc/passwd')).toThrow();
    expect(() => fileNameSchema.parse('file<script>.js')).toThrow();
  });
  
  it('should accept valid file names', () => {
    expect(fileNameSchema.parse('App.tsx')).toBe('App.tsx');
    expect(fileNameSchema.parse('utils.test.ts')).toBe('utils.test.ts');
  });
  
  it('should reject files exceeding size limit', () => {
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    expect(() => validateFileSize(largeContent)).toThrow();
  });
});
```

---

### Task 4: Content Sanitization (2 hours)

**Install DOMPurify**
```bash
npm install dompurify
npm install @types/dompurify --save-dev
```

**Create Sanitization Utility**
Create `src/lib/sanitize.ts`:
```typescript
import DOMPurify from 'dompurify';

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'a'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}

export function sanitizeMarkdown(content: string): string {
  // Basic markdown sanitization
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}
```

**Update AI Chat to Sanitize Output**
```typescript
import { sanitizeMarkdown } from '@/lib/sanitize';

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const sendMessage = async (content: string) => {
    const response = await fetchAI(content);
    
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: sanitizeMarkdown(response), // Sanitize AI response
      },
    ]);
  };
  
  return (
    <div>
      {messages.map((msg) => (
        <div dangerouslySetInnerHTML={{ __html: msg.content }} />
      ))}
    </div>
  );
};
```

---

## Day 4: Error Monitoring

### Task 5: Sentry Integration (6 hours)

**Step 1: Install Sentry**
```bash
npm install @sentry/react @sentry/vite-plugin
```

**Step 2: Configure Sentry**
Update `src/main.tsx`:
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0, // 100% in development, 10% in production
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
});

// Wrap app with Sentry error boundary
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <App />
  </Sentry.ErrorBoundary>
);
```

**Step 3: Update Error Boundary**
Update `src/ErrorFallback.tsx`:
```typescript
import * as Sentry from '@sentry/react';

export function ErrorFallback({ error, resetErrorBoundary }: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  useEffect(() => {
    // Report to Sentry
    Sentry.captureException(error);
  }, [error]);
  
  return (
    <div className="error-container">
      <h1>Something went wrong</h1>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
```

**Step 4: Add Custom Error Tracking**
```typescript
// Track AI errors
try {
  const result = await generateAICompletion(prompt);
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'ai-completion' },
    extra: { prompt },
  });
  toast.error('AI request failed');
}

// Track experiment errors
try {
  await trackExperiment(data);
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'experiment-tracking' },
    extra: { experimentData: data },
  });
}
```

**Step 5: Set Up Alerts**
In Sentry dashboard:
1. Create alert for error count > 10/hour
2. Create alert for new error types
3. Set up Slack/email notifications
4. Configure error grouping rules

---

## Day 5: Security Headers & Cleanup

### Task 6: Security Headers (2 hours)

**Configure Vercel (vercel.json)**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.openai.com https://supabase.co;"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

**Configure Fly.io (fly.toml)**
```toml
[[services]]
  [[services.http_checks]]
    interval = "10s"
    timeout = "2s"
    grace_period = "5s"
    method = "GET"
    path = "/health"

[http_service]
  [http_service.headers]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Strict-Transport-Security = "max-age=31536000"
```

---

### Task 7: Code Quality Fixes (4 hours)

**Fix Remaining Lint Warnings**
Priority React hooks warnings to fix:

1. `src/components/3DCodeCube.tsx` (and other 3D components):
```typescript
// Before
useEffect(() => {
  // ... setup
  return () => {
    containerRef.current?.removeChild(renderer.domElement);
  };
}, []);

// After
useEffect(() => {
  const container = containerRef.current;
  // ... setup
  return () => {
    container?.removeChild(renderer.domElement);
  };
}, []);
```

2. Update dependencies arrays where needed
3. Fix fast-refresh warnings by moving constants to separate files

---

## Final Checklist

### Security
- [ ] eval() removed from all code
- [ ] Rate limiting implemented and tested
- [ ] Input validation on all user inputs
- [ ] Content sanitization for AI responses
- [ ] Sentry error monitoring active
- [ ] Security headers configured

### Testing
- [ ] Unit tests for validation functions
- [ ] Integration tests for rate limiting
- [ ] Manual testing of security fixes
- [ ] Load testing rate limits

### Documentation
- [ ] Update IMPROVEMENTS.md with completed items
- [ ] Document rate limits in API docs
- [ ] Add security section to README

### Deployment
- [ ] Deploy to staging environment
- [ ] Verify all security fixes
- [ ] Run security scan (npm audit)
- [ ] Get security review approval

---

## Success Criteria

✅ **Week 1 is complete when:**
1. No eval() in codebase
2. Rate limiting prevents abuse (tested with 100+ requests)
3. All file operations validated (tested with malicious inputs)
4. Sentry capturing errors (verify with test error)
5. Security headers return correctly (verify with curl)
6. Build passes with no critical errors
7. All P0 security issues resolved

---

## Next: Week 2 - UX & Onboarding

After completing Week 1, move to Week 2 tasks:
- Interactive tutorial system
- Panel reorganization
- Contextual help
- Progressive disclosure

See `NEXT_STEPS_ROADMAP.md` for full Week 2 plan.
