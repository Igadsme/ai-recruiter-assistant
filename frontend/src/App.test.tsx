import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import App from "./App"
import { ApiError, sendChat } from "./services/api"

vi.mock("./services/api", async () => {
  const actual =
    await vi.importActual<typeof import("./services/api")>("./services/api")
  return {
    ...actual,
    sendChat: vi.fn(),
    fetchBrief: vi.fn(async () => ({
      candidate: "Imani Gad",
      title: "Software Engineer",
      education:
        "Bachelor of Science in Computer Science — Kennesaw State University",
      graduation: "December 2026",
      focus: ["AI", "Software"],
      coreTechnologies: ["Python", "TypeScript"],
      relevantExperienceCount: 5,
      relevantExperienceLabel: "internships, a fellowship, and a co-op",
      aiProjectCount: 2,
      bestFitRoles: ["Software Engineer"],
      availability: "Available after December 2026",
      email: "gad.imani@yahoo.com",
      phone: "404-932-1821",
      linkedin: "https://www.linkedin.com/in/igad/",
      github: "https://github.com/Igadsme",
    })),
    fetchProfile: vi.fn(async () => ({
      profile: {
        name: "Imani Gad",
        title: "Software Engineer",
        email: "gad.imani@yahoo.com",
        phone: "404-932-1821",
        linkedin: "https://www.linkedin.com/in/igad/",
        github: "github.com/Igadsme",
      },
      education: {
        school: "Kennesaw State University",
        degree: "Bachelor of Science in Computer Science",
        expectedGraduation: "December 2026",
      },
    })),
  }
})

const mockedSendChat = vi.mocked(sendChat)

describe("App chat", () => {
  beforeEach(() => {
    mockedSendChat.mockReset()
  })

  it("submits a question, shows thinking, then renders a spoken response with sources", async () => {
    const user = userEvent.setup()
    let resolveChat: (value: Awaited<ReturnType<typeof sendChat>>) => void =
      () => undefined
    mockedSendChat.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveChat = resolve
        }),
    )

    render(<App />)

    await user.type(
      screen.getByLabelText("Ask about Imani Gad"),
      "What AI experience does Imani Gad have?",
    )
    await user.keyboard("{Enter}")

    expect(await screen.findByText("THINKING")).toBeInTheDocument()

    resolveChat({
      message:
        "Imani is a Computer Science student who was born in Rwanda and grew up in a Congolese household.",
      sections: [
        {
          label: "SOFTWARE ENGINEERING",
          body: "He has production experience across internships and a co-op.",
          tags: ["Python", "TypeScript"],
          metrics: ["+15% throughput"],
        },
      ],
      sources: [
        {
          type: "experience",
          title: "Software Engineering Intern",
          organization: "UpCancer",
          date: "January 2024 – May 2024",
          technologies: ["Python", "TypeScript", "PostgreSQL"],
          metrics: ["+15% throughput"],
          relevantExcerpt: "Built Python and TypeScript microservices.",
        },
      ],
      conversationId: "11111111-1111-4111-8111-111111111111",
    })

    await waitFor(
      () => {
        expect(screen.getByText(/born in Rwanda/)).toBeInTheDocument()
      },
      { timeout: 4000 },
    )
    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /view evidence/i }),
        ).toBeInTheDocument()
      },
      { timeout: 4000 },
    )
    expect(screen.queryByText("SOURCES")).not.toBeInTheDocument()
    expect(screen.queryByText("SOFTWARE ENGINEERING")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /view evidence/i }))
    expect(screen.getByText("SOURCES")).toBeInTheDocument()
    expect(screen.getByText(/UpCancer/)).toBeInTheDocument()
    expect(mockedSendChat).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "What AI experience does Imani Gad have?",
        mode: "general",
      }),
    )
  })

  it("renders a greeting without retrieval chrome", async () => {
    const user = userEvent.setup()
    mockedSendChat.mockResolvedValue({
      message:
        "Hey! I'm Imani's AI assistant. What would you like to know about him?",
      sections: [],
      sources: [],
      conversationId: "11111111-1111-4111-8111-111111111111",
      conversational: true,
      revealSources: false,
      intent: "greeting",
    })

    render(<App />)
    await user.type(screen.getByLabelText("Ask about Imani Gad"), "hi")
    await user.keyboard("{Enter}")

    expect(screen.queryByText("THINKING")).not.toBeInTheDocument()
    expect(await screen.findByText(/Imani's AI assistant/i)).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /view evidence/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText("RETRIEVAL")).not.toBeInTheDocument()
  })

  it("sends recruiter mode to the API", async () => {
    const user = userEvent.setup()
    mockedSendChat.mockResolvedValue({
      message: "Concise recruiter overview.",
      sections: [],
      sources: [],
      conversationId: "11111111-1111-4111-8111-111111111111",
    })

    render(<App />)
    await user.click(screen.getAllByLabelText("Toggle recruiter mode")[0])
    await user.click(
      screen.getAllByRole("button", {
        name: "Ask: Imani Gad's 60-second overview",
      })[0],
    )

    await waitFor(() => expect(mockedSendChat).toHaveBeenCalled())
    expect(mockedSendChat).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "recruiter",
        message: "Imani Gad's 60-second overview",
      }),
    )
  })

  it("renders a safe error state when the API fails", async () => {
    const user = userEvent.setup()
    mockedSendChat.mockRejectedValue(
      new ApiError("network", "Unable to connect to the assistant."),
    )

    render(<App />)
    await user.click(
      screen.getAllByRole("button", {
        name: "Ask: Tell me about Imani Gad",
      })[0],
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to connect to the assistant.",
    )
  })

  it("renders a rate limit error", async () => {
    const user = userEvent.setup()
    mockedSendChat.mockRejectedValue(
      new ApiError(
        "rate_limit",
        "You've reached the current request limit. Please try again shortly.",
      ),
    )

    render(<App />)
    await user.click(
      screen.getAllByRole("button", {
        name: "Ask: Tell me about Imani Gad",
      })[0],
    )

    expect(await screen.findByRole("alert")).toHaveTextContent("request limit")
  })

  it("shows recruiter journey paths on the idle page", () => {
    render(<App />)
    expect(
      screen.getByRole("button", { name: /meet imani/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /evaluate him for a role/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /explore his work/i }),
    ).toBeInTheDocument()
  })

  it("shows a work-in-progress footer on the idle page", () => {
    render(<App />)
    expect(
      screen.getByText(/Work in Progress: I'm still learning the ropes/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /official resume/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /reach out to him directly/i }),
    ).toBeInTheDocument()
  })

  it("shows Imani Gad contact details from the footer", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(
      screen.getByRole("button", { name: /reach out to him directly/i }),
    )

    expect(
      await screen.findByRole("dialog", { name: /contact information/i }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole("link", { name: "gad.imani@yahoo.com" }),
    ).toHaveAttribute("href", "mailto:gad.imani@yahoo.com")
    expect(screen.getByRole("link", { name: "404-932-1821" })).toHaveAttribute(
      "href",
      "tel:4049321821",
    )
    expect(
      screen.getByRole("link", { name: "https://www.linkedin.com/in/igad/" }),
    ).toHaveAttribute("href", "https://www.linkedin.com/in/igad/")
  })
})
