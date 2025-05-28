import { useQuery } from '@tanstack/react-query'
import { DocumentationLayout, ExampleLayout, CodeLayout } from '../components'
import { LiveProvider, LiveEditor } from 'react-live'

const code = `  // Get the user
const { data: user } = useQuery({
  queryKey: ['user', email],
  queryFn: getUserByEmail,
})

const userId = user?.id

// Then get the user's projects
const {
  status,
  fetchStatus,
  data: projects,
} = useQuery({
  queryKey: ['projects', userId],
  queryFn: getProjectsByUser,
  // The query will not execute until the userId exists
  enabled: !!userId,
})
  `

const someAsyncFn = async () => {
  return new Promise<{ id: string; name: string }>((resolve) => {
    setTimeout(() => {
      resolve({
        id: 'user1',
        name: 'Manu',
      })
    }, 2000) // Resolves after 2 seconds
  })
}

const someAsyncFn2 = async () => {
  return new Promise<[{ id: string; name: string }]>((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'project1',
          name: 'project 1',
        },
      ])
    }, 2000) // Resolves after 2 seconds
  })
}

export function PaginatedQueries() {
  const email = 'manu@gmail.com'

  // Get the user
  const { data: user } = useQuery({
    queryKey: ['user', email],
    queryFn: someAsyncFn,
  })

  const userId = user?.id

  // Then get the user's projects
  const {
    status,
    error,
    data: projects,
  } = useQuery({
    queryKey: ['projects', userId],
    queryFn: someAsyncFn2,
    // The query will not execute until the userId exists
    enabled: !!userId,
  })

  if (status === 'error') return 'An error has occurred: ' + error.message

  return (
    <ExampleLayout>
      <DocumentationLayout>
        <p>
          Dependent (or serial) queries depend on previous ones to finish before
          they can execute. To achieve this, it's as easy as using the enabled
          option to tell a query when it is ready to run:
        </p>
        <LiveProvider code={code}>
          <LiveEditor />
        </LiveProvider>
      </DocumentationLayout>

      <CodeLayout>
        {
          <div>
            <div>User: {user ? user?.name : 'Not yet available'}</div>{' '}
          </div>
        }
        {
          <div>
            <div>
              Projects for user {user?.name}:{' '}
              {projects ? projects?.length : 'projects not yet available'}
            </div>{' '}
          </div>
        }
      </CodeLayout>
    </ExampleLayout>
  )
}
PaginatedQueries.order = 6
