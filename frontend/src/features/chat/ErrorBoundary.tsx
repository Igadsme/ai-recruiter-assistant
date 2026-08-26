import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { failed: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('assistant ui error', error.message, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            background: '#09090b',
            color: 'rgba(255,255,255,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
          }}
        >
          Something went wrong loading the assistant. Refresh to try again.
        </div>
      )
    }
    return this.props.children
  }
}
