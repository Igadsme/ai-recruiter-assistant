import { useCallback, useEffect, useRef, useState } from "react"
import { DEFAULT_CHIPS, RECRUITER_CHIPS, skipsThinkingState } from "../../data"
import {
  getErrorMessage,
  sendChat,
  trackEvent,
  type ChatMode,
  type RecruiterSession,
} from "../../services/api"
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition"
import { RecruiterBriefCard } from "../../components/RecruiterBrief"
import { RecruiterSessionPanel } from "../../components/RecruiterSessionPanel"
import { RecruiterJourney } from "../recruiter/RecruiterJourney"
import { CareerTimeline, FitPanel, InterviewPanel } from "./overlays"
import { ChatHeader } from "./Header"
import { WorkInProgressFooter } from "./Footer"
import { Orb } from "./Orb"
import { ChatInput, ConversationChips, SuggestedChips } from "./ChatInput"
import { ThinkingView } from "./ThinkingView"
import { VoiceView } from "./VoiceView"
import { AssistantMessage, UserMessage, ErrorMessage } from "./messages"
import { toCannedResponse } from "./spoken"
import type { AppState, Message } from "./types"

export function AssistantShell() {
  const [appState, setAppState] = useState<AppState>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [latestAssistantId, setLatestAssistantId] = useState<string | null>(
    null,
  )
  const [lastQuery, setLastQuery] = useState("")
  const [isContextOpen, setIsContextOpen] = useState(false)
  const [isRecruiterMode, setIsRecruiterMode] = useState(false)
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [voiceMuted, setVoiceMuted] = useState(false)
  const [voiceOut, setVoiceOut] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>(
    undefined,
  )
  const [session, setSession] = useState<RecruiterSession | undefined>(
    undefined,
  )
  const [overlay, setOverlay] =
    useState<"fit" | "interview" | "timeline" | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const speech = useSpeechRecognition({
    active: isVoiceMode,
    muted: voiceMuted,
  })

  useEffect(() => {
    if (sessionStorage.getItem("visit-tracked") === "1") return
    sessionStorage.setItem("visit-tracked", "1")
    void trackEvent("portfolio_visit")
  }, [])

  const chips = isRecruiterMode ? RECRUITER_CHIPS : DEFAULT_CHIPS
  const mode: ChatMode = isRecruiterMode ? "recruiter" : "general"
  const lastFollowUps = [...messages]
    .reverse()
    .find((msg) => msg.role === "assistant" && msg.response?.followUps)
    ?.response?.followUps
  const convoChips =
    lastFollowUps && lastFollowUps.length > 0 ? lastFollowUps : chips

  const handleQuery = useCallback(
    async (query: string) => {
      const trimmed = query.trim()
      if (!trimmed) return
      if (appState === "thinking") return
      if (isVoiceMode) {
        setIsVoiceMode(false)
        setVoiceMuted(false)
      }
      setLastQuery(trimmed)
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        text: trimmed,
      }
      setMessages((prev) => [...prev, userMsg])
      const casual = skipsThinkingState(trimmed)
      setAppState(casual ? "conversation" : "thinking")

      try {
        const result = await sendChat({
          message: trimmed,
          conversationId,
          mode,
        })
        setConversationId(result.conversationId)
        if (result.session) setSession(result.session)
        if (messages.length === 0) void trackEvent("chat_started")
        const response = toCannedResponse(result, trimmed)
        const aMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: response.intro,
          response,
        }
        setMessages((prev) => [...prev, aMsg])
        setLatestAssistantId(aMsg.id)
        setAppState("conversation")
        setTimeout(
          () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
          80,
        )
      } catch (error) {
        const mapped = getErrorMessage(error)
        const aMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: mapped.message,
          error: true,
        }
        setMessages((prev) => [...prev, aMsg])
        setLatestAssistantId(aMsg.id)
        setAppState("conversation")
      }
    },
    [appState, isVoiceMode, conversationId, mode, messages.length],
  )

  const handleNew = () => {
    setMessages([])
    setLatestAssistantId(null)
    setAppState("idle")
    setIsContextOpen(false)
    setConversationId(undefined)
    setSession(undefined)
  }

  const handleVoiceStop = () => {
    const spoken = speech.transcript.trim()
    speech.stop()
    setIsVoiceMode(false)
    setVoiceMuted(false)
    if (spoken) handleQuery(spoken)
  }

  const inConvo = appState === "conversation"

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09090b",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {/* Background radial light source */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 75% 55% at 50% -8%, rgba(75,110,220,0.07) 0%, transparent 70%)",
        }}
      />

      <ChatHeader
        inConvo={inConvo}
        isRecruiterMode={isRecruiterMode}
        overlay={overlay}
        voiceOut={voiceOut}
        isContextOpen={isContextOpen}
        onNew={handleNew}
        onToggleRecruiter={() => setIsRecruiterMode((r) => !r)}
        onOverlay={setOverlay}
        onToggleVoice={() => setVoiceOut((value) => !value)}
        onToggleSession={() => setIsContextOpen((o) => !o)}
      />

      {/* ── Main ── */}
      <main
        id="main-content"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          paddingTop: 64,
          paddingRight: isContextOpen ? 252 : 0,
          transition: "padding-right 0.38s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* ── Idle ── */}
        {appState === "idle" && !isVoiceMode && (
          <div
            className="animate-fade-up"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px 96px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 28,
                width: "100%",
                maxWidth: isRecruiterMode ? 640 : 580,
              }}
            >
              {!isRecruiterMode && <Orb orbState="idle" />}

              {isRecruiterMode ? (
                <RecruiterBriefCard
                  onAsk={() => {
                    const el = document.querySelector<HTMLInputElement>(
                      '[aria-label="Ask about Imani Gad"]',
                    )
                    el?.focus()
                  }}
                  onFit={() => setOverlay("fit")}
                  onInterview={() => setOverlay("interview")}
                  onTimeline={() => setOverlay("timeline")}
                />
              ) : (
                <div style={{ textAlign: "center" }}>
                  <h1
                    style={{
                      fontSize: "clamp(30px, 5.5vw, 44px)",
                      fontWeight: 250,
                      color: "rgba(255,255,255,0.88)",
                      letterSpacing: "-0.045em",
                      lineHeight: 1.08,
                      marginBottom: 10,
                    }}
                  >
                    How can I help?
                  </h1>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: "rgba(255,255,255,0.30)",
                      letterSpacing: "-0.01em",
                      fontWeight: 380,
                      marginBottom: 18,
                    }}
                  >
                    I'm Imani's AI assistant — ask about his experience, or pick
                    a path below.
                  </p>
                  <RecruiterJourney
                    onMeet={() => void handleQuery("Who is Imani?")}
                    onEvaluate={() => setOverlay("fit")}
                    onExplore={() => setOverlay("timeline")}
                  />
                </div>
              )}

              <div style={{ width: "100%" }}>
                <ChatInput
                  onSubmit={handleQuery}
                  onVoice={() => setIsVoiceMode(true)}
                  autoFocus
                  disabled={false}
                />
              </div>

              <SuggestedChips chips={chips} onSelect={handleQuery} />
            </div>
          </div>
        )}

        {/* ── Voice ── */}
        {isVoiceMode && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px 96px",
            }}
          >
            <VoiceView
              onStop={handleVoiceStop}
              supported={speech.supported}
              listening={speech.listening}
              muted={voiceMuted}
              transcript={speech.transcript}
              onToggleMute={() => setVoiceMuted((value) => !value)}
            />
          </div>
        )}

        {/* ── Thinking ── */}
        {appState === "thinking" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px 96px",
            }}
          >
            <ThinkingView lastQuery={lastQuery} />
          </div>
        )}

        {/* ── Conversation ── */}
        {appState === "conversation" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            {/* Message list */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                paddingBottom: 220,
              }}
            >
              <div
                style={{
                  maxWidth: 740,
                  margin: "0 auto",
                  padding: "32px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 32,
                }}
              >
                {messages.map((msg) =>
                  msg.role === "user" ? (
                    <UserMessage key={msg.id} text={msg.text} />
                  ) : msg.error ? (
                    <ErrorMessage key={msg.id} text={msg.text} />
                  ) : (
                    <AssistantMessage
                      key={msg.id}
                      msg={msg}
                      isNew={msg.id === latestAssistantId}
                      onAsk={handleQuery}
                      onResume={() => void handleQuery("resume")}
                      onContact={() =>
                        void handleQuery("How can I contact Imani Gad?")
                      }
                      voiceEnabled={voiceOut}
                    />
                  ),
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Sticky bottom input */}
            <div
              style={{
                position: "fixed",
                bottom: 52,
                left: 0,
                right: isContextOpen ? 252 : 0,
                zIndex: 45,
                padding: "20px 24px 16px",
                background:
                  "linear-gradient(to top, rgba(9,9,11,1) 55%, rgba(9,9,11,0) 100%)",
                transition: "right 0.38s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <div style={{ maxWidth: 740, margin: "0 auto" }}>
                <ChatInput
                  onSubmit={handleQuery}
                  onVoice={() => setIsVoiceMode(true)}
                  disabled={false}
                />
                <div style={{ marginTop: 10 }}>
                  <ConversationChips
                    chips={convoChips}
                    onSelect={handleQuery}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Context panel ── */}
      {isContextOpen && (
        <RecruiterSessionPanel
          session={session}
          onClose={() => setIsContextOpen(false)}
        />
      )}

      {overlay === "fit" && (
        <FitPanel
          conversationId={conversationId}
          onClose={() => setOverlay(null)}
          onAsk={(query) => {
            setOverlay(null)
            void handleQuery(query)
          }}
        />
      )}
      {overlay === "interview" && (
        <InterviewPanel onClose={() => setOverlay(null)} />
      )}
      {overlay === "timeline" && (
        <CareerTimeline
          onClose={() => setOverlay(null)}
          onAsk={(query) => {
            setOverlay(null)
            void handleQuery(query)
          }}
        />
      )}

      <WorkInProgressFooter
        insetRight={isContextOpen ? 252 : 0}
        onResume={() => void handleQuery("resume")}
      />
    </div>
  )
}
