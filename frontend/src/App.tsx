import { AnalyticsDashboard } from "./components/AnalyticsDashboard"
import { AssistantShell } from "./features/chat/AssistantShell"

export default function App() {
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/analytics")
  ) {
    return <AnalyticsDashboard />
  }

  return <AssistantShell />
}
