/*
  Web Worker that executes JS/TS code in isolation.
  Contract:
  - Incoming message: { id: string, code: string, language?: string, instrument?: boolean }
  - Outgoing message: { id: string, logs: Array<{ type: string; content: string; timestamp: number }>, result?: any, error?: string, durationMs: number, timeline?: any[] }
*/

// Ensure performance.now is available in worker context
const perf = self.performance || ({ now: () => Date.now() } as Performance);

type InMsg = {
  id: string
  code: string
  language?: string
  instrument?: boolean
}

type TimelineEntry = { t: number; label: string; data?: any }

type OutMsg = {
  id: string
  logs: Array<{ type: 'log' | 'error' | 'warn' | 'info'; content: string; timestamp: number }>
  result?: any
  error?: string
  durationMs: number
  timeline?: TimelineEntry[]
}

const makeSandboxConsole = (sink: OutMsg['logs']) => ({
  log: (...args: any[]) => sink.push({ type: 'log', content: args.map(String).join(' '), timestamp: Date.now() }),
  error: (...args: any[]) => sink.push({ type: 'error', content: args.map(String).join(' '), timestamp: Date.now() }),
  warn: (...args: any[]) => sink.push({ type: 'warn', content: args.map(String).join(' '), timestamp: Date.now() }),
  info: (...args: any[]) => sink.push({ type: 'info', content: args.map(String).join(' '), timestamp: Date.now() }),
})

const instrumentSource = (source: string): string => {
  const lines = source.split('\n')
  return lines
    .map((line, idx) => {
      const trimmed = line.trim()
      const indent = line.match(/^\s*/)?.[0] ?? ''
      const shouldInstrument =
        trimmed.length > 0 &&
        !trimmed.startsWith('//') &&
        !trimmed.startsWith('}') &&
        !trimmed.startsWith('];') &&
        !trimmed.startsWith(');')

      if (!shouldInstrument) return line

      const traceStatement = `${indent}__trace('line', { line: ${idx + 1}, code: ${JSON.stringify(trimmed)} });`
      return `${traceStatement}\n${line}`
    })
    .join('\n')
}

self.onmessage = async (evt: MessageEvent<InMsg>) => {
  const { id, code, instrument } = evt.data
  const logs: OutMsg['logs'] = []
  const sandboxConsole = makeSandboxConsole(logs)
  const timeline: TimelineEntry[] = []

  // Expose tracing hook for instrumented code
  // @ts-ignore
  ;(self as any).__trace = (label: string, data?: any) => {
    timeline.push({ t: perf.now(), label, data })
  }

  const start = perf.now()
  try {
    const executedSource = instrument ? instrumentSource(code) : code
    // Wrap in async IIFE to support top-level await-like behavior
    const wrapped = `
      (async function() {
        const console = arguments[0];
        try {
          ${executedSource}
        } catch (err) {
          console.error('Runtime Error:', err && (err.message || String(err)) )
        }
      })(sandboxConsole);
    `
    const AsyncFunction = async function () {}.constructor as any
    const fn = new AsyncFunction('sandboxConsole', wrapped)
    const result = await fn(sandboxConsole)
    const duration = perf.now() - start
    const out: OutMsg = { id, logs, durationMs: duration }
    if (typeof result !== 'undefined') {
      out.result = result
    }
    if (timeline.length) out.timeline = timeline.slice()
    // @ts-ignore
    ;(self as any).postMessage(out)
  } catch (e: any) {
    const duration = perf.now() - start
    const out: OutMsg = { id, logs, durationMs: duration, error: e?.message || String(e) }
    // @ts-ignore
    ;(self as any).postMessage(out)
  }
  // @ts-ignore
  ;(self as any).__trace = undefined
}
