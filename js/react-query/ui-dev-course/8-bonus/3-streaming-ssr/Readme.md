# Streaming SSR

Historically in React, whenever you leveraged server-side rendering, you had to serialize the whole React tree to HTML before sending it to the client where it would then get hydrated.

As of v18, React now supports Streamed Server Rendering and Partial Hydration which is a fancy way of saying that React can now generate partial HTML on the server, and stream the rest to the client as it becomes available.

This means that the client can start rendering and hydrating parts of the application as soon as they are available, without having to wait for the whole tree to be ready.

This process ensures that users can see static content earlier, and can also interact with parts of the page without having to wait for all content to be fetched and rendered on the server.

We saw an example of using React Query with server rendering in the last lesson, but we didn't take advantage of streaming.

As a reminder, here's where we ended up:

```js
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { fetchRepoData } from './api'
import Repo from './Repo'

export default async function Home() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["repoData"],
    queryFn: fetchRepoData,
    staleTime: 10 * 1000,
  })

  return (
    <main>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Repo />
      </HydrationBoundary>
    </main>
  );
}
```

And so we can see the benefits here, what would happen if we threw a few other elements into our app that don't depend on any of the repo data?

```js
export default async function Home() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["repoData"],
    queryFn: fetchRepoData,
    staleTime: 10 * 1000,
  })

  return (
    <main>
      <Navbar />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Repo />
      </HydrationBoundary>
      <Footer />
    </main>
  );
}
```

Would the user see the Navbar and Footer immediately, or would they have to wait for the repo data to be fetched before anything is shown?

As you probably guessed, since we're awaiting the `prefetchQuery` invocation, they'd see nothing until the repo data is fetched.

A better approach, in my opinion, would be to show what you can show immediately, and then stream the rest in as it becomes available.

To make this happen, we have to take a couple of steps:

1. Stop awaiting the prefetch on the server
If we await in the server component, the rest of the app is blocked from rendering.

Easy fix.

```js
export default async function Home() {
  const queryClient = new QueryClient()

  queryClient.prefetchQuery({
    queryKey: ["repoData"],
    queryFn: fetchRepoData,
    staleTime: 10 * 1000,
  })

  return (
    <main>
      <Navbar />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Repo />
      </HydrationBoundary>
      <Footer />
    </main>
  );
}
```

2. Switch to `useSuspenseQuery`

Unlike useQuery, `useSuspenseQuery` tells React that it should pause rendering the component and its children until the request has finished.

```js
'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchRepoData } from './api'

export default function Repo() {
  const { data } = useSuspenseQuery({
    queryKey: ['repoData'],
    queryFn: fetchRepoData,
    staleTime: 10 * 1000
  })

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

3. Wrap into its own suspense boundary

Since we're now streaming parts of our app, we need to provide a fallback UI for the parts that won't be available immediately. Specifically, the Repo component.

To do that, we can wrap Repo inside of React's Suspense component with a fallback prop.

```js
export default async function Home() {
  const queryClient = new QueryClient()

  queryClient.prefetchQuery({
    queryKey: ["repoData"],
    queryFn: fetchRepoData,
    staleTime: 10 * 1000,
  })

  return (
    <main>
      <Navbar />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <React.Suspense fallback={<RepoSkeleton />}>
          <Repo />
        </React.Suspense>
      </HydrationBoundary>
      <Footer />
    </main>
  );
}
```

4. Allow sending pending queries to the client

By default, React Query will only dehydrate queries that are in a `success` state.

This works fine if we await the prefetch, but now, the Query will be pending when the dehydration happens.

To get the promise to be included in the dehydration process, we need to explicitly enable it. We can do that by updating the `defaultOptions` on the `QueryClient`.

```js
import { 
  QueryClient, 
  dehydrate, 
  defaultShouldDehydrateQuery 
} from '@tanstack/react-query'

export default async function Home() {
  const queryClient = new QueryClient({
    defaultOptions: {
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });

  queryClient.prefetchQuery({
    queryKey: ["repoData"],
    queryFn: fetchRepoData,
    staleTime: 10 * 1000,
  })

  return (
    <main>
      <Navbar />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <React.Suspense fallback={<RepoSkeleton />}>
          <Repo />
        </React.Suspense>
      </HydrationBoundary>
      <Footer />
    </main>
  );
}
```

Now, React will immediately render the `Navbar`, `Footer`, and the `RepoSkeleton` components while the data for the Repo component is being fetched. Once the data is available, React will replace the `RepoSkeleton` UI with the actual Repo UI.

Even better, the data will be available in the `QueryCache` on the client and React Query will do its thing to ensure that the data is as up to date as possible.

If it's still a little fuzzy, here's another way to think about it.

Despite their name, in Next.js, `Client Components` are still pre-rendered on the server. During this process, any static markup is transferred to the client, where React will hydrate and add interactivity to it.

If React encounters `useSuspenseQuery`, it will suspend rendering, Next.js will receive the Promise from React Query and will render the fallback of the `Suspense` component, sending that static UI to the client. Once the Promise resolves, React will replace the fallback UI with the UI from the suspended component.

The biggest difference between now and before is that before, the server awaited the request, so the queryClient that the `HydrationBoundary` received contained that data. Now, instead of containing the data, it contains a Promise that will resolve with the data.

This is important because instead of creating a new Promise, React Query will re-use the one that was created on the server, making the data available as soon as possible.

## 🚨Experimental, lol

Just a heads up, everything beyond this point is both considered 👻 experimental 👻 and is specific to Next.js.

Proceed with caution.

Streaming is great, but as you've seen, it's a bit of a pain to set up. Wouldn't it be nice if we could get rid of a lot of this extra boilerplate? Well, do I have an experimental plugin that I think is going to look good on you.

```js
npm install @tanstack/react-query-next-experimental
```

`react-query-next-experimental` is a plugin for React Query that allows you to `useSuspenseQuery` in client components without worrying about how data is transferred from the server to the client.

In other words, it allows you to get rid of the `dehydrate/HydrationBoundary` dance.

Here's how it works.

First, you render the `ReactQueryStreamedHydration` that comes with the plugin as a child of `QueryClientProvider`:

```js
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental'

export default function Providers({ children }) {
  const queryClientRef = React.useRef();

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <ReactQueryStreamedHydration>
        {children}
      </ReactQueryStreamedHydration>
    </QueryClientProvider>
  );
}
```

And that's it.

You can now use `useSuspenseQuery` in any client components and it will Just Work™.

```js
'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchRepoData } from './api'

export default function Repo() {
  const { data } = useSuspenseQuery({
    queryKey: ['repoData'],
    queryFn: fetchRepoData,
    staleTime: 10 * 1000
  })

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

The plugin will make sure that data fetched on the server will automatically land in the QueryCache on the client, without needing to worry about `HydrationBoundary` or `initialData`.

It's a win/win – we get a great DX and a solid UX. We can write a single Query, which will take advantage of `Suspense` for data fetching with streaming on the server and without having to write any additional code, we'll get all the interactivity and data synchronization of React Query.
