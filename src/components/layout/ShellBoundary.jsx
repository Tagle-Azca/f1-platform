import { Component } from 'react'

/**
 * Error boundary for shell chrome (header, rail, nav). On a render error it renders `fallback`
 * (default: nothing) so one bad value never unmounts the whole app. No error text is shown.
 */
export default class ShellBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidUpdate(prevProps) {
    // Recover on the next navigation / data refresh.
    if (this.state.failed && prevProps.resetKey !== this.props.resetKey) this.setState({ failed: false })
  }
  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
