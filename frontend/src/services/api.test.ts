import { describe, expect, it } from 'vitest'
import { ApiError, getErrorMessage } from './api'

describe('getErrorMessage', () => {
  it('maps rate limit errors', () => {
    const result = getErrorMessage(
      new ApiError('rate_limit', "You've reached the current request limit. Please try again shortly.", 429),
    )
    expect(result.code).toBe('rate_limit')
    expect(result.message).toContain('request limit')
  })

  it('maps network failures', () => {
    const result = getErrorMessage(new TypeError('Failed to fetch'))
    expect(result.code).toBe('network')
    expect(result.message).toBe('Unable to connect to the assistant.')
  })

  it('maps unknown errors to a safe AI message', () => {
    const result = getErrorMessage(new Error('stack trace'))
    expect(result.code).toBe('ai')
    expect(result.message).not.toContain('stack trace')
  })
})
