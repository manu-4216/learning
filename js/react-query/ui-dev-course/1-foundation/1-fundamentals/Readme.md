# React query - why it exists

Handling data fetching by hand is tedious (handle error, loading, caching, distribution across the app with context).

_React query was created to handle async state. Not the client state, which is different._

### Client State

1. Client owned: It's always up-to-date.
2. Our state: Only we can change it
3. Usually ephemeral: It goes away when the browser is closed.
4. Synchronous: It's instantly available.

All these traits make client state easy to work with since it's predictable. There isn't much that can go wrong if we're the only ones who can make updates to it.

---

Asynchronous state, on the other hand, is state that is not ours. We have to get it from somewhere else, usually a server, which is why it's often called server state.

It persists, usually in a database, which means it's not
instantly available. This makes managing it, particularly over time, tricky.

### Server State

1. Server owned: What we see is only a snapshot (which can be outdated).
2. Owned by many users: Multiple users could change the data.
3. Persisted remotely: It exists across browsing sessions.
4. Asynchronous: It takes a bit of time for the data to go from the server to the client.

Though it's far too common, it's problematic to treat these two kinds of states as equal.

To manage client state in a React app, we have lots of options available, starting from the built-in hooks like useState and useReducer, all the way up to community maintained solutions like redux or zustand.

But what are our options for managing server state in a React app?

Historically, there weren't many. That is, until React Query came along.

> NOTE: React Query is _not_ a data fetching library

And that's a good thing! Because it should be clear by now that data fetching itself is not the hard part - it's managing that data over time that is.

And while React Query goes very well with data fetching, a better way to describe it is as an **async state manager** that is also acutely aware of the needs of server state.

In fact, React Query doesn't even fetch any data for you. YOU provide it a promise (whether from fetch, axios, graphql, IndexedDB, etc.), and React Query will then take the data that the promise resolves with and make it available wherever you need it throughout your entire application.

```js
const {
  data: pokemon,
  isLoading,
  error,
} = useQuery({
  queryKey: ['pokemon', id],
  queryFn: () =>
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((res) => res.json()),
})
```

From there, it can handle all of the dirty work that you're either unaware of, or you shouldn't be thinking about.

1. Cache management
2. Cache invalidation
3. Auto refetching
4. Scroll recovery
5. Offline support
6. Window focus refetching
7. Dependent queries
8. Paginated queries
9. Request cancellation
10. Prefetching
11. Polling
12. Mutations
13. Infinite scrolling
14. Data selectors
15. - More

### Configuration steps

- import { QueryClient } from '@tanstack/react-query'
- const queryClient = new QueryClient(options)
- <QueryClientProvider client={queryClient}><App /></QueryClientProvider>

```js
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  const [id, setId] = React.useState(1)
  const {
    data: pokemon,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pokemon', id],
    queryFn: () =>
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((res) =>
        res.json()
      ),
  })

  return (
    <>
      <PokemonCard isLoading={isLoading} data={pokemon} error={error} />
      <ButtonGroup handleSetId={setId} />
    </>
  )
}

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}
```

### Implementation details

React Query uses React Context under the hood. However, instead of using Context for state management as we saw previously, React Query uses it solely for dependency injection.

Under the hood, useQuery will subscribe to the QueryCache and re-render whenever the data it cares about in the cache changes.

By default, if there's already data located in the cache at the queryKey, useQuery will return that data immediately.

Otherwise, it will invoke the queryFn, take whatever data that the promise returned from the queryFn resolves with, put it in the cache at the queryKey, and then return it.

This is called **Deduplication**, and it works even across different components: if one component already used a query and fetched its data, a second component will get the same data, which has been cached.

Under the hood, the reason this works is all thanks to Query Observers and a well-known software design pattern called
The Observer Pattern.

Since our cache lives outside of React, we need a way to synchronize the values from the cache back to our React components. Observers are the glue between those components and the queries in the cache.

Every time a component mounts, it creates an observer for each call to useQuery. This observer watches (or observes) a specific queryKey.

When something in the cache for the queryKey changes, the observer will be notified so that it can re-render the component - thus keeping our UI in sync with the value in the cache.

This means we'll get maximum predictability since every component will always show exactly what is stored in the cache, while at the same time being highly performant by only calling the queryFn when necessary.

And it doesn't matter where those components are in the component tree. As long as they live under the same QueryClientProvider, they will read the same cache.

### Query state

React Query exposes its internal Query States to let you know which status the query is currently in:

- **pending** - the Query has not yet completed, so you don't have data yet.
- **success** - the Query has finished successfully, and data is available.
- **error** - the Query has failed, and you have an error.

Those statuses directly correspond to the state a Promise can be in - _pending_, _fulfilled_ or _rejected_, which hopefully makes sense as React Query is entirely Promise based.

Example:

```js
function MediaDevices() {
  const { data, status } = useQuery({
    queryKey: ['mediaDevices'],
    queryFn: () => {
      return navigator.mediaDevices.enumerateDevices()
    },
  })

  if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return <div>We were unable to access your media devices</div>
  }

  return (
    <ul>
      {data.map((device) => (
        <li key={device.deviceId}>{device.label}</li>
      ))}
    </ul>
  )
}
```

#### Second option:

The second option, via the derived boolean flags, isPending, isSuccess and isError that are also available on the object returned by useQuery.

The object returned from useQuery is a Discriminated Union Type, and it's both discriminated by the status field and the derived boolean flags.

```js
function MediaDevices() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['mediaDevices'],
    queryFn: () => {
      return navigator.mediaDevices.enumerateDevices()
    },
  })

  if (isPending === true) {
    return <div>...</div>
  }

  if (isError === true) {
    return <div>We were unable to access your media devices</div>
  }

  return (
    <ul>
      {data.map((device) => (
        <li key={device.deviceId}>{device.label}</li>
      ))}
    </ul>
  )
}
```
