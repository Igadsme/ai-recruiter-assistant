import { expect, test, type Page } from '@playwright/test'

const BRIEF = {
  candidate: 'Imani Gad',
  title: 'Software Engineer',
  education: 'Bachelor of Science in Computer Science — Kennesaw State University',
  graduation: 'December 2026',
  focus: ['AI', 'Software'],
  coreTechnologies: ['Python', 'TypeScript', 'PostgreSQL'],
  relevantExperienceCount: 5,
  relevantExperienceLabel: 'internships, a fellowship, and a co-op',
  aiProjectCount: 2,
  bestFitRoles: ['Software Engineer'],
  availability: 'Available after December 2026',
  email: 'gad.imani@yahoo.com',
  phone: '404-932-1821',
  linkedin: 'https://www.linkedin.com/in/igad/',
  github: 'https://github.com/Igadsme',
}

async function mockApis(page: Page) {
  await page.route('**/api/analytics/events', async (route) => {
    await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
  })
  await page.route('**/api/candidate/brief', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ brief: BRIEF }),
    })
  })
  await page.route('**/api/candidate/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        profile: {
          name: BRIEF.candidate,
          title: BRIEF.title,
          email: BRIEF.email,
          phone: BRIEF.phone,
          linkedin: BRIEF.linkedin,
          github: 'github.com/Igadsme',
        },
        education: {
          school: 'Kennesaw State University',
          degree: 'Bachelor of Science in Computer Science',
          expectedGraduation: 'December 2026',
        },
      }),
    })
  })
  await page.route('**/api/fit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        analysis: {
          roleHint: 'Software Engineer',
          overallScore: 78,
          requiredCoverage: { matched: 4, total: 5, percent: 80 },
          preferredCoverage: { matched: 2, total: 3, percent: 67 },
          strong: [{ technology: 'Python', evidence: 'UpCancer microservices', sourceIds: ['experience:upcancer'] }],
          partial: [],
          missing: ['Kubernetes'],
          relevantProjects: [{ id: 'devdash', title: 'DevDash', reason: 'Full-stack TypeScript' }],
          interviewQuestions: ['Walk through the UpCancer services.'],
          hiringRisks: ['No Kubernetes evidence'],
          whyInterview: 'Production backend and AI project depth.',
        },
      }),
    })
  })
  await page.route('**/api/chat', async (route) => {
    const body = route.request().postDataJSON() as { message?: string }
    const message = body.message ?? ''
    if (/^hi\b/i.test(message)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: "Hey! I'm Imani's AI assistant. I can tell you about his experience, projects, skills, or what roles he may fit.",
          sections: [],
          sources: [],
          conversationId: '11111111-1111-4111-8111-111111111111',
          conversational: true,
          intent: 'greeting',
        }),
      })
      return
    }
    if (/shaw/i.test(message)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Imani was a Cybersecurity Co-op at Shaw Industries, where he built Microsoft Sentinel log ingestion pipelines.',
          sections: [],
          sources: [
            {
              id: 'experience:shaw',
              type: 'experience',
              title: 'Cybersecurity Co-op',
              organization: 'Shaw Industries',
              date: 'January 2026 – June 2026',
              technologies: ['Microsoft Sentinel', 'KQL', 'Palo Alto'],
              relevantExcerpt: 'Built log ingestion pipelines in Microsoft Sentinel via DCRs.',
            },
          ],
          conversationId: '11111111-1111-4111-8111-111111111111',
          verified: true,
          showContactCta: true,
        }),
      })
      return
    }
    if (/resume/i.test(message)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: "Imani's resume is below.",
          sections: [{ label: 'RESUME', body: 'Verified candidate file.', tags: [] }],
          sources: [],
          conversationId: '11111111-1111-4111-8111-111111111111',
          isResume: true,
        }),
      })
      return
    }
    if (/contact/i.test(message)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: `You can reach Imani at ${BRIEF.email}.`,
          sections: [],
          sources: [],
          conversationId: '11111111-1111-4111-8111-111111111111',
          showContactCta: true,
        }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'I can help with Imani’s verified background.',
        sections: [],
        sources: [],
        conversationId: '11111111-1111-4111-8111-111111111111',
      }),
    })
  })
}

test('recruiter can complete the core hiring workflow', async ({ page }) => {
  await mockApis(page)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'How can I help?' })).toBeVisible()
  await expect(page.getByRole('button', { name: /meet imani/i })).toBeVisible()

  const input = page.getByLabel('Ask about Imani Gad')
  await input.fill('hi')
  await input.press('Enter')
  await expect(page.getByText(/Imani's AI assistant/i)).toBeVisible()

  await input.fill('Tell me about Shaw')
  await input.press('Enter')
  await expect(page.getByText(/Shaw Industries/)).toBeVisible()

  await page.getByRole('button', { name: /view evidence/i }).click()
  await expect(page.getByText('SOURCES')).toBeVisible()
  await expect(page.getByText(/Microsoft Sentinel/)).toBeVisible()
  await page.getByRole('button', { name: 'Contact' }).click()
  await expect(page.getByText(BRIEF.email)).toBeVisible()

  await page.getByLabel('Open fit analysis').click()
  await expect(page.getByText('FIT ANALYSIS')).toBeVisible()
  await page.getByLabel('Job description').fill(
    'Software Engineer — Python, AWS, React, PostgreSQL, Docker, TypeScript, Kubernetes',
  )
  await page.getByRole('button', { name: /analyze fit/i }).click()
  await expect(page.getByText(/Overall match/)).toBeVisible()
  await expect(page.getByText('Kubernetes', { exact: true })).toBeVisible()
  await page.getByRole('dialog', { name: 'FIT ANALYSIS' }).getByLabel('Close').click()

  await input.fill("View Imani Gad's resume")
  await input.press('Enter')
  await expect(page.getByLabel('Download Imani Gad resume PDF')).toBeVisible()

  await page.getByRole('button', { name: /reach out to him directly/i }).click()
  await expect(page.getByRole('dialog', { name: /contact information/i })).toBeVisible()
  await expect(page.getByRole('link', { name: BRIEF.email })).toBeVisible()
})
