import { useQuery } from '@tanstack/react-query'
import { DocumentationLayout, ExampleLayout, CodeLayout } from '../components'
import { LiveProvider, LiveEditor } from 'react-live'

const code = `  const query = useQuery({
    queryKey: ['manual'],
    enabled: false,
    queryFn: someAsyncFn,
  })

  const { refetch, error, data, isFetching } = query

  return (
    <button onClick={() => refetch()}>Refetch</button>
  )
  `

let count = 10

setInterval(() => {
  count++
}, 2000)
const someAsyncFn = async () => {
  return Promise.resolve({
    count,
  })
}

export function ManualRefetch() {
  const query = useQuery({
    queryKey: ['manual'],
    enabled: false,
    queryFn: someAsyncFn,
  })

  const { refetch, error, data, isFetching } = query

  if (error) return 'An error has occurred: ' + error.message

  return (
    <ExampleLayout>
      <DocumentationLayout>
        If you ever want to disable a query from automatically running, you can
        use the enabled = false option.
        <p>
          TypeScript users may prefer to use skipToken as an alternative to
          enabled = false.
        </p>
        <p>
          Permanently disabling a query opts out of many great features that
          TanStack Query has to offer (like background refetches), and it's also
          not the idiomatic way. It takes you from the declarative approach
          (defining dependencies when your query should run) into an imperative
          mode (fetch whenever I click here). It is also not possible to pass
          parameters to refetch. Oftentimes, all you want is a lazy query that
          defers the initial fetch.
        </p>
        <LiveProvider code={code}>
          <LiveEditor />
        </LiveProvider>
      </DocumentationLayout>

      <CodeLayout>
        <button onClick={() => refetch()}>Refetch</button>
        {data && (
          <div>
            <div>Count: {data.count}</div>{' '}
            <div>{isFetching ? 'Updating...' : ''}</div>
          </div>
        )}
      </CodeLayout>
    </ExampleLayout>
  )
}
ManualRefetch.order = 3
