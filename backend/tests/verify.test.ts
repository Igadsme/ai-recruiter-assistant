import { describe, expect, it } from 'vitest'
import { validateStructuredClaims } from '../src/services/verify.ts'
import type { Source } from '../src/types.ts'

const shaw: Source = {
  id: 'experience:shaw',
  type: 'experience',
  category: 'Cybersecurity',
  title: 'Cybersecurity Co-op',
  organization: 'Shaw Industries',
  relevantExcerpt:
    'Built log ingestion pipelines in Microsoft Sentinel via DCRs and architected a syslog pipeline for Palo Alto firewall logs.',
  technologies: ['Microsoft Sentinel', 'KQL', 'Palo Alto', 'CEF'],
  metrics: ['Enterprise-scale pipeline'],
  verified: true,
}

const upcancer: Source = {
  id: 'experience:upcancer',
  type: 'experience',
  category: 'Backend',
  title: 'Software Engineering Intern',
  organization: 'UpCancer',
  relevantExcerpt: 'Built Python and TypeScript microservices using Redis-cached PostgreSQL.',
  technologies: ['Python', 'TypeScript', 'PostgreSQL', 'Redis'],
  metrics: ['+15% throughput'],
  verified: true,
}

describe('structured claim verification', () => {
  it('marks a claim supported only when the cited source backs it', () => {
    const { claims, unsupportedRate } = validateStructuredClaims(
      [
        {
          text: 'Imani built log ingestion pipelines at Shaw.',
          sourceIds: ['experience:shaw'],
        },
      ],
      [shaw, upcancer],
    )
    expect(claims[0]?.supported).toBe(true)
    expect(claims[0]?.sourceIds).toEqual(['experience:shaw'])
    expect(unsupportedRate).toBe(0)
  })

  it('rejects a Shaw claim that cites UpCancer', () => {
    const { claims } = validateStructuredClaims(
      [
        {
          text: 'Imani built log ingestion pipelines at Shaw.',
          sourceIds: ['experience:upcancer'],
        },
      ],
      [shaw, upcancer],
    )
    expect(claims[0]?.supported).toBe(false)
  })

  it('rejects invented source ids', () => {
    const { claims } = validateStructuredClaims(
      [{ text: 'Imani built a Python ingestion function at Shaw.', sourceIds: ['experience:missing'] }],
      [shaw],
    )
    expect(claims[0]?.supported).toBe(false)
  })
})
