import { useQueries } from '@tanstack/react-query'
import { DocumentationLayout, ExampleLayout, CodeLayout } from '../components'
import { LiveProvider, LiveEditor } from 'react-live'

type Post = {
  id: number
  title: string
}

const postsMock: Record<string, Post[]> = {
  user1: [
    {
      id: 1,
      title: 'why now',
    },
    {
      id: 2,
      title: 'why you',
    },
  ],
  user2: [
    {
      id: 1,
      title: 'This is nice',
    },
    {
      id: 2,
      title: 'Great movie',
    },
  ],
}

const fetchPostsByUserId = async (userId: string) => {
  return new Promise<Post[]>((resolve, reject) => {
    setTimeout(() => {
      const posts = postsMock[userId]

      if (posts) {
        resolve(posts)
      } else {
        reject(new Error('not found posts for user ' + userId))
      }
    }, 2000) // Resolves after 2 seconds
  })
}

export function ParallelQueries() {
  const usersId = ['user1', 'user2', 'ds']
  const queries = useQueries({
    queries: usersId.map((userId) => ({
      queryKey: ['posts', userId],
      queryFn: () => fetchPostsByUserId(userId),
    })),
  })
  return (
    <ExampleLayout>
      <DocumentationLayout>
        <h3>Manual Parallel Queries</h3>
        <p>
          When the number of parallel queries does not change, there is no extra
          effort to use parallel queries. Just use any number of TanStack
          Query's useQuery and useInfiniteQuery hooks side-by-side!
        </p>

        <LiveProvider
          code={`
function App () {
  // The following queries will execute in parallel
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchTeams })
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
  ...
}`}
        >
          <LiveEditor />
        </LiveProvider>

        <h3>Dynamic Parallel Queries with useQueries</h3>
        <p>
          If the number of queries you need to execute is changing from render
          to render, you cannot use manual querying since that would violate the
          rules of hooks. Instead, TanStack Query provides a useQueries hook
          useQueries accepts an options object with a queries key whose value is
          an array of query objects. It returns an array of query results:
        </p>

        <LiveProvider
          code={`
  function App({ users }) {
    const userQueries = useQueries({
      queries: users.map((user) => {
        return {
          queryKey: ['user', user.id],
          queryFn: () => fetchUserById(user.id),
        }
      }),
    })

    return (
      <div>
        {queries.map((q, i) =>
          q.isSuccess && (
            <div key={users[i].id}>
              <h3>Posts for {users[i].name}</h3>
              <ul>
                {q.data.map((post) => (
                  <li key={post.id}>{post.title}</li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>
    )
  }
  `}
        >
          <LiveEditor />
        </LiveProvider>
      </DocumentationLayout>

      <CodeLayout>
        <div>
          {queries.map((q, i) =>
            q.isSuccess ? (
              <div key={usersId[i]}>
                <h3>Posts for {usersId[i]}</h3>
                <ul>
                  {q.data.map((post) => (
                    <li key={post.id}>{post.title}</li>
                  ))}
                </ul>
              </div>
            ) : q.isLoading ? (
              <p key={i}>Loading posts for {usersId[i]}...</p>
            ) : (
              <p key={i}>Failed to load posts for {usersId[i]}</p>
            )
          )}
        </div>
      </CodeLayout>
    </ExampleLayout>
  )
}
ParallelQueries.order = 4
