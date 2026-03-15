import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ChatKing render error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#070911', color: '#e8edf7', padding: '32px', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', background: '#0d1117', border: '1px solid #1e2a3e', borderRadius: '16px', padding: '24px' }}>
            <h1 style={{ fontSize: '24px', margin: '0 0 12px' }}>Dashboard render error</h1>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#a5b4cf', margin: '0 0 16px' }}>
              The app hit a runtime error while rendering. Open the browser console to see the exact stack trace.
            </p>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', color: '#fda4af', margin: 0 }}>{String(this.state.error || 'Unknown error')}</pre>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)
