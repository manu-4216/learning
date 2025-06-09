export const QueryClientContext = React.createContext()

// Anywhere we need to get access to the client(inside useQuery), we can do useContext(QueryClientContext).
export function QueryClientProvider({ client, children }) {
  return (
    <QueryClientContext.Provider value={client}>
      {children}
    </QueryClientContext.Provider>
  )
}
