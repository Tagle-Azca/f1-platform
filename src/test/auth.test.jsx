import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const auth = { user: null, loading: false, login: vi.fn(), loginWithGoogle: vi.fn() }
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('../components/garage/GarageDrawer', () => ({ default: ({ open }) => (open ? <p>garage</p> : null) }))

import LoginModal from '../components/auth/LoginModal'
import GuestProfile from '../components/auth/GuestProfile'
import AuthField from '../components/auth/AuthField'
import AuthInput from '../components/auth/AuthInput'
import AuthError from '../components/auth/AuthError'
import AuthDivider from '../components/auth/AuthDivider'
import TelemetrySelect from '../components/auth/TelemetrySelect'

const at = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)
beforeEach(() => { vi.clearAllMocks(); auth.user = null; auth.loading = false })

describe('LoginModal', () => {
  it('is a labelled modal dialog with correct autocomplete and masked password', () => {
    at(<LoginModal open onClose={() => {}} />)
    const dlg = screen.getByRole('dialog', { name: 'ACCESS CONTROL' })
    expect(dlg).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email')
    const pw = screen.getByLabelText('Password', { exact: true })
    expect(pw).toHaveAttribute('autocomplete', 'current-password')
    expect(pw).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(pw).toHaveAttribute('type', 'text')
  })
  it('renders nothing when closed', () => {
    const { container } = at(<LoginModal open={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })
  it('submits credentials, closes on success', async () => {
    auth.login.mockResolvedValue()
    const onClose = vi.fn()
    at(<LoginModal open onClose={onClose} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } })
    fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'pw' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(auth.login).toHaveBeenCalledWith('a@b.co', 'pw')
  })
  it('shows the error as an alert linked by aria-describedby, and does not close', async () => {
    auth.login.mockRejectedValue(new Error('Invalid credentials'))
    const onClose = vi.fn()
    at(<LoginModal open onClose={onClose} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } })
    fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-describedby', 'login-error')
    expect(onClose).not.toHaveBeenCalled()
  })
  it('Esc and scrim close; links navigate and close', () => {
    const onClose = vi.fn()
    const { baseElement } = at(<LoginModal open onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(baseElement.querySelector('[aria-hidden="true"].fixed'))
    expect(onClose).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('button', { name: 'Join the Pitwall' }))
    fireEvent.click(screen.getByRole('button', { name: 'Forgot access code?' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close sign-in' }))
    expect(onClose).toHaveBeenCalledTimes(5)
  })
})

describe('GuestProfile', () => {
  it('guest opens the login modal', () => {
    at(<GuestProfile />)
    fireEvent.click(screen.getByRole('button', { name: /Sign in/ }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  it('logged in shows initials and opens garage', () => {
    auth.user = { email: 'x@y.z', displayName: 'Pit Driver' }
    at(<GuestProfile />)
    expect(screen.getByText('PD')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Pit Driver/ }))
    expect(screen.getByText('garage')).toBeInTheDocument()
  })
  it('logged in without a display name falls back to the email initial', () => {
    auth.user = { email: 'zed@y.z' }
    at(<GuestProfile />)
    expect(screen.getByText('Z')).toBeInTheDocument()
    expect(screen.getByText('My Garage')).toBeInTheDocument()
  })
  it('renders nothing while loading', () => {
    auth.loading = true
    const { container } = at(<GuestProfile />)
    expect(container.firstChild).toBeNull()
  })
})

describe('auth field parts', () => {
  it('AuthField labels its input; underline variant with a right slot', () => {
    render(<AuthField label="Email"><AuthInput variant="underline" rightSlot={<b>eye</b>} /></AuthField>)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByText('eye')).toBeInTheDocument()
  })
  it('AuthInput works without a field', () => {
    render(<AuthInput placeholder="p" />)
    expect(screen.getByPlaceholderText('p')).toBeInTheDocument()
  })
  it('AuthError renders only with a message; AuthDivider label', () => {
    const { container, rerender } = render(<AuthError message={null} />)
    expect(container.firstChild).toBeNull()
    rerender(<AuthError message="<b>bad</b>" />)
    expect(screen.getByRole('alert').querySelector('b')).toBeNull()
    render(<AuthDivider label="or continue with" />)
    expect(screen.getByText('or continue with')).toBeInTheDocument()
  })
  it('TelemetrySelect lists options and reports changes', () => {
    const onChange = vi.fn()
    render(<TelemetrySelect value="" onChange={onChange} options={['01', { value: 'JAN', label: 'JAN' }]} placeholder="DD" label="Day of birth" />)
    fireEvent.change(screen.getByLabelText('Day of birth'), { target: { value: '01' } })
    expect(onChange).toHaveBeenCalled()
    render(<TelemetrySelect value="01" onChange={onChange} options={['01']} placeholder="MM" />)
  })
})
