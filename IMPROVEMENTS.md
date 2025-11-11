# Crowe Code Improvement Roadmap

This document captures prioritized enhancements to move from a prototype/alpha experience toward a robust, “flawless” AI-native editor.

## 1. Correctness & Safety (High Priority)

- Execution sandbox: Run JS/TS in a Web Worker (postMessage contract: { code, id } -> { id, logs[], result?, error?, durationMs }). Enforce timeout (e.g. 3s) and terminate worker on runaway code.
- Prevent global mutations: Provide a restricted API surface inside worker (stub dangerous globals; freeze Object prototypes optionally).
- Guard infinite loops: Optional static transform inserting iteration counters for while/for loops (configurable).
- Clarify simulated panels (Debugger, Profiler) with a subtle banner: “Heuristic simulation – not real runtime state yet”.

## 2. State & Persistence

- KV key consistency: Ensure all per-user state includes `userId` (chat history fixed; audit others like experiment sessions, settings, etc.).
- Versioned workspace snapshots: Allow user to create labeled restore points (`crowe-code-snapshot-${userId}-${timestamp}`).
- Autosave toggle + recovery banner for unsaved (dirty) tabs on reload.

## 3. Developer Experience & Observability

- Instrumentation: Add lightweight analytics hooks (panel open counts, prediction applied, execution run duration buckets). Use `posthog-js` (already a dependency) behind a runtime flag.
- Error funnel: Wrap panels with error boundary boundaries to isolate failures.
- Structured logging helper (replace ad‑hoc console usage in panels) to unify formatting.

## 4. Performance

- Virtualize line numbers & editor viewport after threshold (e.g. > 2,000 lines) to reduce DOM size.
- Debounce heavy analysis panels (Complexity, DNA, CodeViz) on a shared scheduler so simultaneous typing doesn’t queue redundant work.
- Preload frequently used icons via a small sprite/memo layer.

## 5. Realistic Profiling & Debugging

- Profiler: Optional code instrumentation pass (AST transform) wrapping statements with timing markers (only in profiling mode) to replace random timing data.
- Debugger: Offer two modes:
  1. Heuristic (current) – instant.
  2. Instrumented – code rewritten with `__trace(line, scope)` calls; collect actual runtime variable snapshots in worker.

## 6. AI Experience Upgrades

- Prediction diff preview: Show unified diff vs insertion line before applying.
- Inline actions: Lightbulb gutter icon for top suggestion.
- Chat memory scoping: Segment by active file id plus global thread; allow clearing per file.
- Safety: Token limit truncation + explicit disclaimers for generated license / security sensitive code.

## 7. Testing Strategy

- Add Vitest + React Testing Library.
  - Unit: `detectLanguage`, tab management flows.
  - Component: File create → open → modify → save.
- Add Playwright for E2E shortcut flows and AI suggestion application.
- Worker execution tests: success, syntax error, timeout, infinite loop sentinel.

## 8. Accessibility & Inclusivity

- ARIA labels for all icon-only buttons (some rely only on `title`).
- High-contrast theme token set (extend `theme.json`).
- Keyboard navigation: Ensure panel focus traps release cleanly (Dialog / Side panels).

## 9. Security Considerations

- Sanitize file names (reject path separators). Limit max file size.
- Sandboxed execution only; never expose `import.meta` or network fetch unless explicitly allowed.
- Rate-limit LLM calls per minute per user to prevent abuse.

## 10. Nice-to-Have Enhancements

- Collaborative presence indicators (even with AI agent only) – show “AI editing…” ghost cursor.
- Command palette expansion (search files, run experiments, open panels by name).
- Pluggable panel registry so experimental features can be toggled at build time.

## Implementation Order Summary

1. Worker sandbox + banners for simulated panels.
2. Snapshot & autosave + analytics instrumentation.
3. Real profiler / debugger instrumentation.
4. AI UX (diff preview, inline actions) + accessibility pass.
5. Virtualization + performance polish.
6. Test suite build-out.

## Minimal Worker Execution Contract (Proposed)

Input: `{ id: string, code: string }`

Output: `{ id: string, logs: { type: 'log'|'warn'|'error'|'info', content: string }[], result?: any, error?: string, durationMs: number }`

Timeout: Worker terminated if no completion < 3000ms.

---

This file will evolve; keep it close to reality by updating when a section ships.
