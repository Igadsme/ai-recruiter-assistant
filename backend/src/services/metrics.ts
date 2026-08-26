type MetricName =
  | 'casual_reply'
  | 'grounded_reply'
  | 'gemini_failure'
  | 'injection_blocked'
  | 'fit_analyzed'
  | 'request_latency'

type MetricPoint = {
  name: MetricName
  value: number
  at: number
}

const points: MetricPoint[] = []
const MAX_POINTS = 4000

export function recordMetric(name: MetricName, value: number): void {
  points.push({ name, value, at: Date.now() })
  if (points.length > MAX_POINTS) points.splice(0, points.length - MAX_POINTS)
}

export function metricsSnapshot() {
  const recent = points.filter((point) => point.at > Date.now() - 60 * 60 * 1000)
  const of = (name: MetricName) => recent.filter((point) => point.name === name)
  const avg = (name: MetricName) => {
    const items = of(name)
    if (items.length === 0) return 0
    return Math.round(items.reduce((sum, item) => sum + item.value, 0) / items.length)
  }
  const sorted = of('grounded_reply').map((item) => item.value).sort((a, b) => a - b)
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0
  return {
    windowHours: 1,
    counts: {
      casual: of('casual_reply').length,
      grounded: of('grounded_reply').length,
      geminiFailures: of('gemini_failure').length,
      injectionsBlocked: of('injection_blocked').length,
    },
    latencyMs: {
      casualAvg: avg('casual_reply'),
      groundedAvg: avg('grounded_reply'),
      groundedMedian: median,
    },
  }
}

export function resetMetricsForTests(): void {
  points.length = 0
}
