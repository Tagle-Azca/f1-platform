import { Link } from 'react-router-dom'
import { isValidCircuitId } from '../../utils/circuitId'

/** A circuit name that links to its page when the id is safe for a path; plain text otherwise. */
export default function CircuitLink({ circuitId, className = '', children }) {
  if (!isValidCircuitId(circuitId)) return <>{children}</>
  return (
    <Link to={`/circuits/${circuitId}`} className={`underline decoration-edge underline-offset-4 hover:text-ink hover:decoration-ink-3 ${className}`}>
      {children}
    </Link>
  )
}
