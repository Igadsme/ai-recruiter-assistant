import type { CannedResponse } from "../../data"

export type AppState = "idle" | "thinking" | "conversation"
export type OrbState = "idle" | "thinking" | "voice"

export type Message = {
  id: string
  role: "user" | "assistant"
  text: string
  response?: CannedResponse
  error?: boolean
}
