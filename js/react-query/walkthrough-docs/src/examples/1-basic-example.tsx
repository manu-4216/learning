import { useQuery } from '@tanstack/react-query'
import { DocumentationLayout, ExampleLayout, CodeLayout } from '../components'
import { LiveProvider, LiveEditor } from 'react-live'

const code = `  const query = useQuery({
    queryKey: ['basic'],
    queryFn: someAsyncFn,
  })
    `

let count = 10

setInterval(() => {
  count++
}, 2000)

const someAsyncFn = async () => {
  return new Promise<{ count: number }>((resolve) => {
    setTimeout(() => {
      resolve({
        count,
      })
    }, 1000)
  })
}

export function BasicExample() {
  const query = useQuery({
    queryKey: ['basic'],
    queryFn: someAsyncFn,
  })

  const { error, data, isPending } = query

  return (
    <ExampleLayout>
      <DocumentationLayout>
        To subscribe to a query in your components or custom hooks, call the
        useQuery
        <LiveProvider code={code}>
          <LiveEditor />
        </LiveProvider>
      </DocumentationLayout>

      {(() => {
        if (error) return 'An error has occurred: ' + error.message
        if (isPending) return 'Loading'

        return (
          <CodeLayout>
            <div>The query happens right away</div>
            {data && (
              <div>
                <div>Count: {data.count}</div>{' '}
              </div>
            )}
          </CodeLayout>
        )
      })()}
    </ExampleLayout>
  )
}
BasicExample.order = 1
