import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ApiError, sendChat } from './services/api'

vi.mock('./services/api', async () => {
  const actual = await vi.importActual<typeof import('./services/api')>('./services/api')
  return {
    ...actual,
    sendChat: vi.fn(),
  }
})

const mockedSendChat = vi.mocked(sendChat)

describe('App chat', () => {
  beforeEach(() => {
    mockedSendChat.mockReset()
  })

  it('submits a question, shows thinking, then renders a spoken response without evidence', async () => {
    const user = userEvent.setup()
    let resolveChat: (value: Awaited<ReturnType<typeof sendChat>>) => void = () => undefined
    mockedSendChat.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveChat = resolve
        }),
    )

    render(<App />)

    await user.type(screen.getByLabelText('Ask about Imani Gad'), 'Tell me about Imani Gad')
    await user.keyboard('{Enter}')

    expect(await screen.findByText('THINKING')).toBeInTheDocument()

    resolveChat({
      message: 'I was born in Rwanda and grew up in a Congolese household.',
      sections: [
        {
          label: 'SOFTWARE ENGINEERING',
          body: 'He has production experience across internships and a co-op.',
          tags: ['Python', 'TypeScript'],
          metrics: ['+15% throughput'],
        },
      ],
      sources: [
        {
          type: 'experience',
          title: 'Software Engineering Intern',
          organization: 'UpCancer',
          date: 'January 2024 – May 2024',
          technologies: ['Python', 'TypeScript', 'PostgreSQL'],
          metrics: ['+15% throughput'],
          relevantExcerpt: 'Built Python and TypeScript microservices.',
        },
      ],
      conversationId: '11111111-1111-4111-8111-111111111111',
    })

    await waitFor(() => {
      expect(screen.getByText(/born in Rwanda/)).toBeInTheDocument()
    }, { timeout: 4000 })
    expect(screen.queryByText('EVIDENCE')).not.toBeInTheDocument()
    expect(screen.queryByText('SOFTWARE ENGINEERING')).not.toBeInTheDocument()
    expect(screen.queryByText('UpCancer')).not.toBeInTheDocument()
    expect(mockedSendChat).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Tell me about Imani Gad',
        mode: 'general',
      }),
    )
  })

  it('sends recruiter mode to the API', async () => {
    const user = userEvent.setup()
    mockedSendChat.mockResolvedValue({
      message: 'Concise recruiter overview.',
      sections: [],
      sources: [],
      conversationId: '11111111-1111-4111-8111-111111111111',
    })

    render(<App />)
    await user.click(screen.getAllByLabelText('Toggle recruiter mode')[0])
    await user.click(screen.getAllByRole('button', { name: "Ask: Imani Gad's 60-second overview" })[0])

    await waitFor(() => expect(mockedSendChat).toHaveBeenCalled())
    expect(mockedSendChat).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'recruiter',
        message: "Imani Gad's 60-second overview",
      }),
    )
  })

  it('renders a safe error state when the API fails', async () => {
    const user = userEvent.setup()
    mockedSendChat.mockRejectedValue(
      new ApiError('network', 'Unable to connect to the assistant.'),
    )

    render(<App />)
    await user.click(screen.getAllByRole('button', { name: 'Ask: Tell me about Imani Gad' })[0])

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to connect to the assistant.')
  })

  it('renders a rate limit error', async () => {
    const user = userEvent.setup()
    mockedSendChat.mockRejectedValue(
      new ApiError('rate_limit', "You've reached the current request limit. Please try again shortly."),
    )

    render(<App />)
    await user.click(screen.getAllByRole('button', { name: 'Ask: Tell me about Imani Gad' })[0])

    expect(await screen.findByRole('alert')).toHaveTextContent('request limit')
  })
})
