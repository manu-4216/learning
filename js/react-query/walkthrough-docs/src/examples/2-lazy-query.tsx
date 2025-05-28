import { useState, ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DocumentationLayout, ExampleLayout, CodeLayout } from '../components'
import { LiveProvider, LiveEditor } from 'react-live'

const code = `  const query = useQuery({
  queryKey: ['lazy'],
  queryFn: someAsyncFn,
      // ⬇️ disabled as long as the searchQuery is empty
    enabled: !!searchQuery,
})
  `

const someAsyncFn = async (searchQuery: string) => {
  return Promise.resolve({
    result: 'result for ' + searchQuery,
  })
}
export function LazyQuery() {
  const [searchQuery, setValue] = useState('')

  const { data } = useQuery({
    // notice how the parameter is passed in the query key
    queryKey: ['lazy', searchQuery],
    queryFn: () => someAsyncFn(searchQuery),
    // ⬇️ disabled as long as the filter is empty
    enabled: !!searchQuery,
  })

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event?.target?.value)
  }

  return (
    <ExampleLayout>
      <DocumentationLayout>
        <p>
          The enabled option can be used to enable / disable the query at a
          later time. A good example would be a filter form where you only want
          to fire off the first request once the user has entered a filter
          value.
        </p>
        <p>
          If you are using disabled or lazy queries, you can use the isLoading
          flag instead. It's a derived flag that is computed from: isPending &&
          isFetching
        </p>
        <LiveProvider code={code}>
          <LiveEditor />
        </LiveProvider>
      </DocumentationLayout>

      <CodeLayout>
        🚀 Enabling the searchQuery will enable and execute the query
        <div style={{ marginTop: '10px' }}>Search:</div>
        <input type='text' onChange={handleChange} value={searchQuery} />
        {data && <div>Search results: {data.result}</div>}
      </CodeLayout>
    </ExampleLayout>
  )
}
LazyQuery.order = 2
