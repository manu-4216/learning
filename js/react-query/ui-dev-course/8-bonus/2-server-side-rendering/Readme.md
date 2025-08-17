# Server Side Rendering

Traditionally when building a React app, you'd do so as a Single Page Application where your server would ship an empty HTML skeleton with a script tag that would then be responsible for rendering the entire app.

Lately, the pendulum has been swinging back towards Multi Page Applications where the server is responsible for more of the work – including the initial rendering of the app.

Until this point, we've only looked at React Query from the client's perspective – but with the pendulum swinging the way it is, it's important understand both how to use and what advantages React Query can offer when rendering your app on the server.

## 🗄️React Frameworks

This lesson assumes familiarity with Next.js, a popular React framework that supports server-side rendering.

However, the principles discussed in this lesson will apply to any React framework that leverages SSR (like Remix), not just Next.js.

Modern versions of Next.js have adopted React Server Components as a new architecture for enabling data fetching directly inside Async React components.

If you're not familiar, here's what they look like.

```js
import { fetchRepoData } from './api'

export default async function Home() {
  const data = await fetchRepoData();

  return (
    <main>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
      <strong>👀 {data.subscribers_count}</strong>{" "}
      <strong>✨ {data.stargazers_count}</strong>{" "}
      <strong>🍴 {data.forks_count}</strong>
    </main>
  );
}
```

The way this component works is that it will render on the server, fetch some data (either during build time or when the page is requested), and then send `HTML` to the browser.

From there, if your app needs interactivity, you can throw in a `Client Component` as well.

So this brings up the obvious question – if `Server Components` enable data fetching from directly within the component itself, what benefit does React Query provide?

Well, not much.

That's a joke. Again, React Query is not a data fetching library. The primary benefit that React Query offers in this architecture is it will synchronize what the user sees on the screen with an external system like your database, without requiring explicit user interaction.

In a sense, it kind of enables a Hannah Montana scenario where you get the initial page speed of server rendering with the UX that React Query offers on the client.

So how does this work?

Well, your first intuition may be to do something like I just described – fetch data on the server and then pass it to React Query on the client.

Here's how that might work.

First, as always with React Query, you'll want to create an instance of `QueryClient` and pass that to the `QueryClientProvider` component.

However, unlike what you usually do, this time you'll want to create the `queryClient` inside of your component to ensure that data is not shared between different users and requests.

Along with that, since the `QueryClient` is now located inside of the component, to make sure that it's only created once per component lifecycle, you'll want to put it in a ref.

```js
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function Providers({ children }) {
  const queryClientRef = React.useRef();

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
    </QueryClientProvider>
  );
}
```

Now, inside the Root of your project, you'll wrap your entire app inside of your Providers element.

```js
import Providers from "./providers";

export default function RootLayout({ children}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Now that React Query is wired up, the next thing you'll need to do is actually pass the data from the server to the client – and the most obvious way to do that is with the `initialData` option.

Here's how that would look.

First, we have our Server Component that does the fetching and then renders the client Repo component.

```js
import { fetchRepoData } from './api'
import Repo from './Repo'

export default async function Home() {
  const data = await fetchRepoData();

  return (
    <main>
      <Repo initialData={data} />
    </main>
  );
}
```

That client component then accepts the `initialData` as a prop and stores it in the cache using the `useQuery` hook.

```js
'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchRepoData } from './api'

export default function Repo({ initialData }) {
  const { data } = useQuery({
    queryKey: ['repoData'],
    queryFn: fetchRepoData,
    staleTime: 10 * 1000,
    initialData,
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

## For TypeScript Users

`initialData` puts data directly into our `QueryCache`, and because we pass it to `useQuery` directly, TypeScript can now know that the Query will always be in success state.

That's why we don't need to handle loading states and can access `data.name` directly without TypeScript complaining about it.

We now get all of the benefits of React Query on the client, with the initial page speed of server rendering – there's just one major problem.

This approach works well for statically generated pages – but if we render pages dynamically on our server as requests come in, `initialData` is only respected when the QueryCache entry is first created.

You can kind of think of it similar to how `useState` works.

```js
function Profile({ initialUser }) {
  const [user, setUser] = React.useState(initialUser)

  ...
}
```

On the initial render of `Profile`, user will be set to whatever `initialUser` is. However, if the `initialUser` prop changes and `Profile` re-renders, that change will not be reflected in the user state since `initialUser` is only used to set the initial value.

So how do we solve this? Well, by not using `initialData` to get data into the cache.

What if instead of fetching on the server and sending that data to the client, we fetch on the server, add it to the cache, and then send the whole cache to the client to hydrate?

This way we'd avoid the `initialData` issue since every new request would get a fresh cache with the latest data.

To do this, we just need to figure out how to serialize the cache on the server so we can send it over the wire, and then hydrate the cache when React takes over on the client.

Thankfully, React Query comes with two APIs that make both parts of this pretty simple – `dehydrate` and `HydrationBoundary`.

Let's start with the _serialization_.

Instead of just fetching the data and awaiting it inside our `Server Component`, we'll create a QueryClient on the server and do all our fetching through it.

```js
import { QueryClient } from '@tanstack/react-query'

export default async function Home() {
  const queryClient = new QueryClient()

}
```

Because `Server Components` never re-render, we don't need to worry about re-creating the `QueryClient` on every render as we did before.

Now that we have the `QueryClient`, we need to get data into it. The easiest way to do this is with prefetching.

```js
import { QueryClient } from '@tanstack/react-query'
import { fetchRepoData } from './api'
import Repo from './Repo'

export default async function Home() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["repoData"],
    queryFn: fetchRepoData,
    staleTime: 10 * 1000,
  })

}
```

A nice side effect of this approach is that we don't actually get access to the data, so we can't accidentally introduce inconsistencies like we could with `initialData`.

Finally, we need to serialize the cache and send it to the client where it can be hydrated. To serialize the cache, we'll use React Query's dehydrate function and to hydrate the cache on the client, we'll use React Query's `HydrationBoundary` component.

Here's how those work.

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

The `HydrationBoundary` takes the state it receives and puts it into the client-side `QueryCache`, similar to `initialData`.

The difference is that it also does this on subsequent re-validations.

This means that every `Client Component` that uses our `repoData` Query will always have access to the latest data – no matter if that happened on the server or on the client.

Regardless of if you're using SSG with `initialData` or SSR with `dehydrate`, the end result is the same – you get the initial page speed of server rendering with the UX that React Query offers on the client.
