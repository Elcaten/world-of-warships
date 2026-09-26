import { useQuery } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { server } from '@/test/mocks/server'
import { renderWithProviders } from '@/test/render'

// Verify the query provider, DOM matchers, and network mocking work together.
test('renders data fetched through React Query and MSW', async () => {
  server.use(
    http.get('http://localhost/api/status', () =>
      HttpResponse.json({ message: 'Ready' }),
    ),
  )

  function TestQuery() {
    const { data } = useQuery({
      queryKey: ['status'],
      queryFn: async () => {
        const response = await fetch('http://localhost/api/status')
        if (!response.ok) throw new Error('Request failed')
        return response.json() as Promise<{ message: string }>
      },
    })

    return <p>{data?.message ?? 'Loading'}</p>
  }

  renderWithProviders(<TestQuery />)

  expect(await screen.findByText('Ready')).toBeInTheDocument()
})
