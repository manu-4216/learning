import * as React from 'react'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'

const queryClient = new QueryClient()

type RepoData = {
  id: string
  full_name: string
}

// type the return close to the source (best in the return type)
async function fetchRepos(): Promise<Array<RepoData>> {
  const response = await fetch('https://api.github.com/orgs/TanStack/repos')

  if (!response.ok) {
    // throw errors
    throw new Error(`Request failed with status: ${response.status}`)
  }

  // return the data
  return response.json() // second best for typing: as Array<RepoData>
}

function useRepos() {
  const queryKey = ['repos']
  const queryFn = fetchRepos

  // correct: use type assertion
  return useQuery({ queryKey, queryFn })

  // wrong: ❌ Don't do this
  // Extra source: https://x.com/theo/status/1556539631323078657
  return useQuery<Array<RepoData>>({ queryKey, queryFn })
}

function Repos() {
  const { data, status } = useRepos()

  if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return <div>Error fetching data 😔</div>
  }

  return (
    <ul>
      {data.map((repo) => (
        <li key={repo.id}>{repo.full_name}</li>
      ))}
    </ul>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Repos />
    </QueryClientProvider>
  )
}
