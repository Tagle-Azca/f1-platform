import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import ConstructorStandingsRedirect from './ConstructorStandingsRedirect'

function Where() {
  const l = useLocation()
  return <p data-testid="where">{l.pathname + l.search}</p>
}
const at = (url) => render(
  <MemoryRouter initialEntries={['/before', url]} initialIndex={1}>
    <Routes>
      <Route path="/constructor-standings" element={<ConstructorStandingsRedirect />} />
      <Route path="/standings" element={<Where />} />
    </Routes>
  </MemoryRouter>,
)

describe('ConstructorStandingsRedirect', () => {
  it('lands on /standings?view=constructors', () => {
    at('/constructor-standings')
    expect(screen.getByTestId('where')).toHaveTextContent('/standings?view=constructors')
  })
  it('keeps ?season=', () => {
    at('/constructor-standings?season=2023')
    expect(screen.getByTestId('where')).toHaveTextContent('/standings?view=constructors&season=2023')
  })
})
