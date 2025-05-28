import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Examples from './examples'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
      {Object.entries(Examples)
        // sort the files by their order
        .sort((entry1, entry2) => {
          if (entry1[1]?.order > entry2[1]?.order) {
            return 1
          } else {
            return -1
          }
        })
        .map(([name, Component], index) => (
          <section style={{ border: 'solid 2px gray', marginBottom: '15px' }}>
            <h3 style={{ marginTop: '10px', marginBottom: '0' }}>
              {index + 1}. {name}
            </h3>
            <div style={{ padding: '0 15px' }}>
              <Component />
            </div>
          </section>
        ))}
    </QueryClientProvider>
  )
}

const rootElement = document.getElementById('root') as HTMLElement
ReactDOM.createRoot(rootElement).render(<App />)
