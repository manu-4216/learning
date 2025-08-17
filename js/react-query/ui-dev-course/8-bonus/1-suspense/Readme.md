# Working with Suspense

Any time you're dealing with server state, there's going to be some time between when you want the data, and when you actually have it.

To make matters worse, there's also no guarantee that the data will ever be available at all – regardless of how long you wait.

Until this point, any time where we've had to wait for data, we've done so by either checking if the `status` of the Query is `pending`, or even better, by using the derived `isLoading` value that `useQuery` gives us.

This works well, but the tradeoff is that it's coupled to an individual query and component. Often times when you're managing loading UI in a component based architecture, it's nice to have a broader, higher level loading handler that can manage loading states that occur anywhere in your app.

This is where Suspense can help us out.

If you're not familiar, `Suspense` is a React component that allows you to coordinate loading states for asynchronous operations. In a way, `Suspense` is to loading states as Error Boundaries is to errors – and they operate in a similar way.

Anywhere in your application where you want to have a higher-level loading boundary, you can wrap your children in a Suspense component.

```js
<Suspense fallback={<Loading />}>
  <Repos />
</Suspense>
```

React will then display your loading fallback until all the code and data needed by the children has been loaded.

🤓Actually...
If you're not familiar with Suspense, you may read that and think that React will show the fallback while any async operations are running (like in useEffect or an event handler). That's not the case – but that's beyond the scope of this lesson.

If you're interested on learning more about how Suspense works, read the docs or check out react.gg.

To utilize these Suspense boundaries with React Query, you can use the provided useSuspenseQuery hook.

Here's how it works.

With `useSuspenseQuery`, it's as if you're handing the async lifecycle management over to React itself. React will then see the Promise returned from the queryFn and will show the fallback from the Suspense component until the Promise resolves.

If it rejects, it will forward the error to the nearest ErrorBoundary.

The benefits aren't totally clear in this basic example, but as you can imagine, as your application grows, having a unified way to handle loading states can simplify things quite a bit.

Also one thing you may have not noticed is that inside of the Repo component, we no longer have to check for isLoading or status anymore.

With `useSuspenseQuery`, you can assume that data will be available once the component actually renders, and it becomes decoupled from pending and error handling.

```js
function Repo({ name }) {
  const { data } = useRepoData(name)

  return (
    <>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
      <strong>👀 {data.subscribers_count}</strong>{" "}
      <strong>✨ {data.stargazers_count}</strong>{" "}
      <strong>🍴 {data.forks_count}</strong>
    </>
  )
}
```

And similar to `ErrorBoundaries`, you can place as many `Suspense` boundaries as you want in your component tree, at any level of granularity – and you can have as many children elements as you'd like, all fetching data in parallel, and React will show the fallback until all the async operations are complete.

In this example, you can see that both Queries fire off in parallel and that React will "collect" all the Promises that it receives and will show the unified fallback until they're all settled.

And if we put each Query into its own `Suspense` boundary, we would see that data pops in individually as it's ready:

This gives us a good way to achieve any UX that we need – separate boundaries for data we want to show individually, as soon as the data is available, or a single boundary for data that should be shown together.

🏞️Don't go chasing waterfalls

One thing to keep in mind is that Suspense depends on component composition – a component "suspends" as a whole as soon as one async resource (in our case, a Query) is requested.

If you have a single component that wants to fire off multiple Queries by calling `useSuspenseQuery` multiple times, those will not run in parallel. Instead, the component will suspend until the first fetch has finished, then it will continue, just to suspend again until the second Query is completed.

The best way to avoid these waterfalls scenarios with suspense is to stick to one Query per component, or to use another provided hook, `useSuspenseQueries`, which can fire off multiple suspense Queries in parallel.

From an API perspective, `useSuspenseQuery` is very similar to `useQuery`, with a few exceptions.

First, it doesn't support the enabled option. This makes sense if you think about it. If we could disable a query with the enabled option, that would take away the guarantee that you'll always have data when `useSuspenseQuery` is invoked.

Now for the observant among you, this may bring up another question – if we can't disable a Query with `useSuspenseQuery`, how do we handle dependent Queries? After all, enabled was the primary way to handle dependent Queries with `useQuery` as we've seen previously.

```js
function useMovie(title) {
  return useQuery({
    queryKey: ['movie', title],
    queryFn: async () => fetchMovie(title),
  })
}

function useDirector(id) {
  return useQuery({
    queryKey: ['director', id],
    queryFn: async () => fetchDirector(id),
    enabled: id !== undefined
  })
}
```

With `Suspense`, you don't need to worry about this at all since your Queries will run in serial when called in the same component.

So for example, take a look at this app that utilizes dependent queries. Notice that there's nothing fancy we need to do – it just works™ out of the box, even without enabled.

The second difference between `useSuspenseQuery` and useQuery is that `useSuspenseQuery` doesn't support placeholderData.

Again, this makes sense. `placeholderData` is a way to avoid showing a loading indicator while the data is being fetched. With Suspense, the whole idea is that React will show the fallback loading indicator until all the async operations are complete and the data is ready – counteracting the need for `placeholderData`.

Now for the very observant among you, you may be wondering how you can handle the case where you want to show data from a previous Query while a new Query is being fetched.

To do this previously, we relied on `placeholderData`. Remember this example from the pagination lesson?

It works because we use `placeholderData` along with `isPlaceholderData` in order to show the previous data while the new data is being fetched.

But if `useSuspenseQuery` doesn't support `placeholderData`, how can we achieve the same effect? By using the platform using React itself!

First, let's wrap our whole App inside of an Error and Suspense boundary.

```js
import * as React from "react"
import AppErrorBoundary from './AppErrorBoundary'
import Repos from './Repos'

export default function App() {
  return (
    <AppErrorBoundary>
      <React.Suspense fallback={<p>...</p>}>
        <div id="app">
          <Repos />
        </div>
      </React.Suspense>
    </AppErrorBoundary>
  )
}
```

Now, inside of useRepos hook, we need to replace useQuery with `useSuspenseQuery` and remove `placeholderData`.

```js
function useRepos(sort, page) {
  return useSuspenseQuery({
    queryKey: ['repos', { sort, page }],
    queryFn: () => fetchRepos(sort, page),
  })
}
```

Now the tricky part. How do we show the previous data while the new data is being fetched?

To do this, React has a built-in concept of transitions that allow you to do just that. While a transition is going on, React will prefer to keep showing the previous data instead of unmounting and showing a suspense fallback.

To tell React that a transition is occurring, you can use React's `useTransition` hook. Here's how it works.

When you invoke `useTransition`, it will return you an array with two elements – a boolean telling you if a transition is in progress, and a function to start a transition.

```js
const [isPreviousData, startTransition] = React.useTransition()
And if we update our RepoList component to utilize useTransition, here's how it would look.

function RepoList({ sort, page, setPage }) {
  const { data } = useRepos(sort, page)
  const [isPreviousData, startTransition] = React.useTransition()

  return (
    <div>
      <ul style={{ opacity: isPreviousData ? 0.5 : 1 }}>
        {data.map((repo) => 
          <li key={repo.id}>{repo.full_name}</li>
        )}
      </ul>
      <div>
        <button
          onClick={() => {
            startTransition(() => {
              setPage((p) => p - 1)
            })
          }}
          disabled={isPreviousData || page === 1}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          disabled={isPreviousData || data?.length < PAGE_SIZE}
          onClick={() => {
            startTransition(() => {
              setPage((p) => p + 1)
            })
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}
```

Notice that by wrapping our state updates inside of `startTransition`, we were able to swap out `isPlaceholderData` with `isPreviousData`.

And if we throw all of this into our App, here's how it behaves.

The same functionality and UX as before, but now enabled by React's built-in transition system with `Suspense`.

🍞 Good to know: automatic staleTime

Even though we haven't specified an explicit `staleTime`, when using `Suspense`, we'll always have a short `staleTime` defined automatically.

The reason for this is because React unmounts our component tree while showing the suspense fallback. Without a short `staleTime`, we'd get an automatic background refetch as soon as the component is ready to be rendered.

React `Suspense` enables us to write components that don't need to handle their own loading or error states, but its true power will be unleashed when used in combination with server side rendering. We'll look at that in the next lesson.

🪤Fetching on render

The concept of triggering a fetch directly from a component like this is known as "fetch-on-render" and it's not ideal. Instead, you should aim to fetch as early as possible which often means as high up in your component tree as you can.

To get around this, it's a good idea to "render-as-you-fetch" which you can accomplish by prefetching a Query before React gets a chance to render the component.

Good places to trigger prefetching are event handlers (when transitioning from one page to the next), route loaders (when integrating with a router) or server components. In a fully client side app, you can also initiate the fetch above the suspense boundary with `usePrefetchQuery`:

```js
import { usePrefetchQuery } from "@tanstack/react-query"
import repoDataQuery from "./repoDataQuery"

export default function App() {
  usePrefetchQuery(repoDataQuery("tanstack/query"))
  usePrefetchQuery(repoDataQuery("tanstack/table"))

  return (
    <AppErrorBoundary>
      <React.Suspense fallback={<p>...</p>}>
        <RepoData name="tanstack/query" />
        <RepoData name="tanstack/table" />
      </React.Suspense>
    </AppErrorBoundary>
  )
}
```