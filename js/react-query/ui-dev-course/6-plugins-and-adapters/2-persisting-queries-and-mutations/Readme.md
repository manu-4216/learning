# Persisting Queries and Mutations

React Query's secret sauce is its caching layer – it's fast, it's efficient, and it's (mostly) easy to use. But like my poor Tamagotchi when I was a child, it has one unfortunate characteristic – it's short lived.

Because React Query's cache is in-memory only, every time a user closes the browser tab, navigates to another site, or simply reloads the page, the cache is lost forever.

Now this isn't always a problem (which is why it's React Query's default behavior), but there are certain circumstances where it would be nice to have a more persistent cache – think offline-first apps or mobile apps where network connectivity could get spotty.

Thankfully, React Query has a lovely solution for this that it calls Persisters.

Persisters are an optional plugin that will take whatever is in the query cache and persist it to a more permanent location of your choosing (think localStorage or IndexedDB). Once persisted, as soon as the app loads, the persisted data will be restored to the cache before React Query does anything else.

The first decision to make when using persisters is to choose where you want to persist your data to – the answer to this question will decide which persister plugin you install.

If the API for persisting the data is synchronous (like localStorage), you'll want to use the `@tanstack/query-sync-storage-persister` plugin. If the API is asynchronous (like IndexedDB), you'll want to use the `@tanstack/query-async-storage-persister` plugin.

In our example, let's persist our queries to _localStorage_ with the `@tanstack/query-sync-storage-persister plugin`.

First things first, we'll create a _persister_ using the `createSyncStoragePersister` function that `query-sync-storage-persister` provides.

```js
import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const queryClient = new QueryClient()

const persister = createSyncStoragePersister({
  storage: localStorage
})
```

The only required option we need to pass to `createSyncStoragePersister` is the storage we want to use – in this case, _localStorage_. What we'll get in return is an object that contains some low-level functions to persist and restore the whole query cache to and from that storage.

You could use this persister object directly if you needed complete, granular control over the persistence process, but for most use cases, you'll want to use a framework-specific adapter which will offer a simple abstraction over that low-level API.

In our specific React use case, we can use the `@tanstack/react-query-persist-client` adapter which will do all the heavy lifting persisting for us.

```js
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const queryClient = new QueryClient()

const persister = createSyncStoragePersister({
  storage: window.localStorage
})

export default function App(){
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      ...
    </PersistQueryClientProvider>
  )
}
```

Notice that to make it work, all we had to do was replace `QueryClientProvider` with `PersistQueryClientProvider` and pass the `persister` to it as a property on the persistOptions prop.

And if we throw all of this into a real app, notice how it behaves.

With `PersistQueryClientProvider`, any data that is stored in the cache is now immediately available even after the sandbox is reloaded. And even better, anytime the cache changes, that update will automatically be synced to _localStorage_ for us.

Now there is one downside you may have noticed here – `PersistQueryClientProvider` is a _global_ provider and it's going to affect every query in our app. There may come a time when we want to be more selective about what gets persisted.

For example, if we had a query that contained sensitive user information, it's best to not store that in localStorage. Thankfully, React Query allows us to customize what gets stored via its `dehydrateOptions` property.

```jsx
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister,
    dehydrateOptions: {

    },
  }}
>
```

Here's how it works.

Whenever a query is about to be written to the persistent storage, React Query will call the `shouldDehydrateQuery` method that's located on the `dehydrateOptions` object, passing the active query object to it.

```jsx
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {}
    },
  }}
>
```

If `shouldDehydrateQuery` returns true, the query will be persisted. If it returns false, the query will not be persisted.

## 🚰Hydration

In Web Development, _hydration_ usually refers to the process in which static HTML is enriched with client-side JavaScript.

In React Query, the term hydration is used whenever the Query Cache is restored from an external location, and the opposite, dehydration, describes the technique of making the Query Cache serializable into a string.

This is used for both persisting to external storages with the `persister` plugins as well as for Server Side Rendering (SSR), which we'll see later in the course.

Now the question becomes, how do you determine if `shouldDehydrateQuery` should return true or false? By deriving that value from the query that `shouldDehydrateQuery` receives.

After all, if you're wanting to exclude a specific query or subset of queries from being persisted, you're likely doing so because of some unique characteristic of that query.

One simple approach could be to look at the `queryKey` itself. For example, if you only wanted to persist queries that had a specific key, you could do something like this:

```jsx
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        if (query.queryKey[0] === "posts") {
          return true
        }

        return false
      }
    },
  }}
>
```

Another interesting approach could be to utilize the `meta` field that you're able to add to any query. You can think of `meta` as a place to store _arbitrary information_ about a query that doesn't affect the query cache itself.

So for example, we could add a `meta.persist` property to our `usePostList` hook.

```js
function usePostList() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    staleTime: 5000,
    meta: {
      persist: true
    }
  })
}
```

Then, inside of `shouldDehydrateQuery`, we could check for persist, only persisting queries that have it set to true.

```jsx
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        return query.meta.persist === true
      }
    },
  }}
>
```

This logic allows us to easily give the ability for any query to opt-into being persisted on a query by query basis.

## For TypeScript Users

`meta` defaults to the type `Record<string, unknown>`. Similar to how you'd define a global Error type, you can also specify a global meta type.

```ts
declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: {
      persist?: boolean
    }
  }
}
```

Now there is one other aspect of `shouldDehydrateQuery` that you might have not thought about – what happens if the query isn't successful? In that scenario, you probably don't want to persist the query since the data is likely unavailable or stale.

You could, of course, derive that logic by looking at the status or the data of the query, but React Query makes this easy for you by exposing a `defaultShouldDehydrateQuery` function that you can use as a base for your own logic.

`defaultShouldDehydrateQuery` is React Query's default implementation of `shouldDehydrateQuery` and it ensures that _only successful_ queries are persisted. When implementing `shouldDehydrateQuery`, it's a good idea to include that default behavior in your logic.

```js
import { defaultShouldDehydrateQuery } from '@tanstack/react-query'

...

<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        return defaultShouldDehydrateQuery(query) 
          && query.meta.persist === true
      }
    },
  }}
>
```

With that, only successful queries that have `meta.persist` set to `true` will be persisted to localStorage.

But just as important as what gets persisted, is _how long_ it gets persisted for. Most likely, queries that you choose to persist to an external store are likely to be ones that you want to keep around for longer.

However, because the persistent storage is synced to the query cache, and the query cache will be garbage collected when its `gcTime` has elapsed, if you're not careful, you could end up with a situation where queries are garbage collected and therefore removed from the persistent storage too early.

To fix this, you'll want to make sure that the `gcTime` of a query is the duration for which you want to keep the data around both in the cache as well as in the persistent storage.

Additionally, the persister itself also has a `maxAge` property which defines the maximum time persisted data will be valid and it defaults to 24 hours.

If we try to restore a cache that is older than `maxAge`, that data will be discarded.

As a rule of thumb, it's a good idea to define the `gcTime` as the __same value or higher__ than `maxAge` to avoid your queries being garbage collected and removed from the storage too early:

```jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 12, // 12 hours
    },
  },
})

...

<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister,
    maxAge: 1000 * 60 * 60 * 12, // 12 hours
  }}
>
```

Lastly, whenever you write to a persistent storage, you have to handle any errors that might occur when doing so.

For example, most storages have a limit on how much data they can persist. For _localstorage_, it's usually around __5MB__ and if that limit is exceeded, you'll usually see an Error like this:

```diff
-Uncaught DOMException: Failed to execute 'setItem' on 'Storage': Setting the value of 'REACT_QUERY_OFFLINE_CACHE' exceeded the quota.
```

Because the query cache is persisted as a whole, this Error would mean that nothing was stored.

To solve this, `createSyncStoragePersister` lets you define what should happen when an error does occur via its `retry` option.

```js
import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const queryClient = new QueryClient()

const persister = createSyncStoragePersister({
  storage: localStorage,
  retry: ({ persistedClient, error, errorCount }) => {}
})
```

When invoked, `retry` will be passed an object with three properties: `persistedClient`, `error`, and `errorCount`.

`persistedClient` is an object that contains all the queries that were part of the persistence attempt, `error` is the error that occurred, and `errorCount` is the number of times the error occurred.

You can use these values to derive your own retry logic. React Query will continue to attempt retries until the persistence either worked, or `undefined` was returned.

For example, if you only wanted to minimize the amount of data that was persisted to only the most recent query, you could do something like this:

```js
const persister = createSyncStoragePersister({
  storage: localStorage,
  retry: ({ persistedClient, error, errorCount }) => {
    const sortedQueries = [
      ...persistedClient.clientState.queries
    ].sort((a, b) =>
      b.state.dataUpdatedAt - a.state.dataUpdatedAt
    )
  
    const newestQuery = sortedQueries[0]

    // abort if retry didn't work or there is no Query
    if (!newestQuery || errorCount > 1) {
      return undefined
    }

    return {
      ...persistedClient,
      clientState: {
        ...persistedClient.clientState,
        queries: [newestQuery],
      },
    }
  }
})
```

Or, even better, you could use one of the predefined retry strategies that `@tanstack/react-query-persist-client` provides like `removeOldestQuery`, which will decrease the amount of persisted data by removing the oldest query from the cache:

```js
import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { removeOldestQuery } from '@tanstack/react-query-persist-client'

const queryClient = new QueryClient()

const persister = createSyncStoragePersister({
  storage: localStorage,
  retry: removeOldestQuery
})
```

Regardless of which retry strategy you choose, it's always a good idea to handle these failure points to ensure that your app continues to work as expected.

So at this point you've already seen how React Query will try to restore the cache from the persistent storage when the app loads. However, this process isn't instantaneous – especially when using an asynchronous storage API. And even if it is synchronous, reading from any persistent storage is a side effect, which happens outside of React rendering flow.

What this means from a practical standpoint is that on the initial render, the data from the store will have not been restored and put in the cache yet. In this scenario, what should React Query do?

If it were to take inspiration from other persistence libraries, like `redux-persist`, it would solve this problem by giving you a `<PersistGate>` component that you can use to _delay_ rendering until this restoration process has completed. The tradeoff, of course, is that if you delay rendering, you'll get a server/client mismatch in server-side rendering environments which is less than ideal.

Instead, React Query will just render your `App` as usual, but it will not run any queries until the data has been restored from the persistent storage. While it does so, the `status` of the query will be `pending` and the `fetchStatus` will be `idle` (assuming you're not using something like `initialData` or `placeholderData`).

After the data has been restored, the queries will continue to run as normal and if data is then considered stale, you'll see a background refetch as well.

Of course, if your app isn't running in a server-side environment like Next or Remix and you'd rather just delay rendering until the restoration process has completed, you can pretty easily write your own `PersistGate` component using the `useIsRestoring` hook that React Query provides.

```js
import { useIsRestoring } from '@tanstack/react-query'

export function PersistGate({ children, fallback = null }) {
  const isRestoring = useIsRestoring()

  return isRestoring ? fallback : children
}
```

`useIsRestoring` will start out returning `true` when the `PersistQueryClientProvider` is used, and will switch to `false` as soon as data has been restored.

In use, it looks like this where Blog will only render once the restoration process has been completed.

```jsx
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{ persister }}
>
  <PersistGate fallback="...">
    <Blog />
  </PersistGate>
</PersistQueryClientProvider>
```

## 🐉 Experimental, lol

Note that the React Query API we're about to talk about is experimental which means the API can change at any time. Use at your own risk.

As we saw earlier, the tradeoff of `PersistQueryClientProvider` is that it's usually a global provider and will affect all the queries located in its children subtree. This is fine, until it isn't.

We solved this by using a combination of `meta` and `dehydrateOptions` to give us more control over what gets persisted.

```jsx
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        return defaultShouldDehydrateQuery(query) 
          && query.meta.persist === true
      }
    },
  }}
>
```

Thankfully, with React Query's experimental `createPersister` API, you can now declare a persister on a per-query basis rather than on the whole QueryClient.

Here's what it looks like.

```jsx
import { useQuery } from '@tanstack/react-query'
import { experimental_createPersister } from '@tanstack/react-query-persist-client'

function usePostList() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    staleTime: 5 * 1000,
    persister: experimental_createPersister({
      storage: localStorage,
    }),
  })
}
```

The best part is that doing so will often remove the need to use meta, `dehydrateOptions`, and `PersistQueryClientProvider` altogether since you can now just declare the persister directly on the query itself.

Here's what it looks like in our app – again, notice that App.js is back to using `QueryClientProvider` and `PersistQueryClientProvider` is no longer needed.

Now believe it or not, it's not just queries that can be persisted – but mutations as well. Admittedly this use case is pretty rare, but it's worth a quick mention.

Here's a scenario I want you to think through.

You have a read/write application that allows users to create, update, and delete data.

One of your users, a writer, is working on a long article. They do most of their writing on a train with no internet connectivity. They've been writing for hours, and they're almost done when their laptop battery dies.

How would you, as the developer of this app, handle this situation?

We've already discussed how to handle the offline aspect of this problem, but the battery dying is a different beast. There's a chance that their browser tab is preserved, but odds are, any state that was living in React Query's cache will be lost when the battery dies. So how do we solve this?

We just saw that by wrapping your app inside of `PersistQueryClientProvider` and giving it a `persister`, React Query will persist all queries to the external storage provided. What we didn't see was that `PersistQueryClientProvider` also persists all mutations to the external storage as well.

This means that, while offline, if the user saves their work, that mutation will be persisted to the external storage and can be restored even if they close their browser tab or their battery dies before they reconnect.

All that's left for you to do is actually _restore_ the mutations when the user revisits the app.

To do that, you'll first want to give your QueryClient a default mutation function.

```jsx
queryClient.setMutationDefaults(['posts'], {
  mutationFn: addPost
})
```

Remember, the restoration process is going to take place immediately before the app renders. Without this default function, React Query would have to render the app and find the `useMutation` invocation for the associated key in order to get the `mutationFn`. By setting a default mutation function upfront, React Query can immediately restore the mutation as soon as the app loads.

From there, all you need to do is once the user revisits the app and the restoration process from the external store has finished, tell React Query to resume any mutations that occurred while they were away.

Thankfully, React Query makes this pretty simple. If we pass an `onSuccess` prop to `PersistQueryClientProvider`, React Query will invoke that function when the restoration process is complete.

```jsx
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{ persister }}
  onSuccess={() => {

  }}
>
```

Then, by invoking `queryClient.resumePausedMutations` inside of `onSuccess`, React Query will resume all the paused mutations in the order they were originally called.

```jsx
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{ persister }}
  onSuccess={() => {
    return queryClient.resumePausedMutations()
  }}
>
```

As a bonus, because `resumePausedMutations` returns a promise, we can return that promise from `onSuccess` to ensure that our queries stay in a `pending` state until the restoration process is complete.