# Avoiding Loading States

Loading indicators are a foundational part of the experience of browsing the web. However, there are few things that can make an experience worse for your user than poorly implemented loading UIs.

Thankfully, React Query comes built-in with a few different APIs that either help you avoid loading indicators altogether, or make them more manageable when you can't.

To demonstrate these options, let's have a simple app that fetches some blog posts from the dev.to API, and displays them in a list that you can click through to see the full post.

Here's a basic, unoptimized version.

```js
import * as React from 'react'
import markdownit from 'markdown-it'
import { useQuery } from '@tanstack/react-query'
import { fetchPost, fetchPosts } from './api'

function usePostList() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    staleTime: 5000,
  })
}

function usePost(path) {
  return useQuery({
    queryKey: ['posts', path],
    queryFn: () => fetchPost(path),
    staleTime: 5000,
  })
}

function PostList({ setPath }) {
  const { status, data } = usePostList()

  if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return <div>Error fetching posts</div>
  }

  return (
    <div>
      {data.map((post) => (
        <p key={post.id}>
          <a onClick={() => setPath(post.path)} href='#'>
            {post.title}
          </a>
          <br />
          {post.description}
        </p>
      ))}
    </div>
  )
}

function PostDetail({ path, setPath }) {
  const { status, data } = usePost(path)

  const back = (
    <div>
      <a onClick={() => setPath(undefined)} href='#'>
        Back
      </a>
    </div>
  )

  if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return (
      <div>
        {back}
        Error fetching {path}
      </div>
    )
  }

  const html = markdownit().render(data?.body_markdown || '')

  return (
    <div>
      {back}
      <h1>{data.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

export default function Blog() {
  const [path, setPath] = React.useState()

  return (
    <div>
      {path ? (
        <PostDetail path={path} setPath={setPath} />
      ) : (
        <PostList setPath={setPath} />
      )}
    </div>
  )
}
```

At this point you should be fairly comfortable with the code in this app.

Even without any optimizations, our app still performs pretty well due to the built in caching that React Query provides.

On the initial load of both the list view and the post detail view, we see our loading indicator. But after that, the data has been cached and we get our final UI instantly.

Unfortunately, the "initial load" is going to be a common occurrence for users of an app like this, and it's the biggest performance bottleneck we have. Can you think of a way that we can make it better?

What if, instead of waiting for the user to click on a link to fetch the data for the new route, we fetch it ahead of time? That way, when the user does click on the link, the data would already be available in the cache and they'd see the final UI instantly.

If you're not familiar, this technique is called **prefetching** and React Query supports it out of the box.

Of course, the trickiest part with prefetching is knowing _when_ you should prefetch. It's tempting to just prefetch all the data that you _might_ need, but that would lead to overfetching and would most likely cause performance issues.

For our app specifically, what we need is some sort of indicator that the user is interested in reading a specific post. If they are, then we can prefetch the data for that post so it's ready for them when they visit that page.

To do this, what if we **Use The Platform™** and listen for the `onMouseEnter` event on the anchor tag that links to a post? It's a pretty safe assumption that when a user hovers over a link, they're probably going to click it.

PS: Hover won't work on mobile.

Here's how that would look with React Query.

```jsx
<a
  onClick={() => setPath(post.path)}
  href='#'
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['posts', post.path],
      queryFn: () => fetchPost(post.path),
      staleTime: 5000,
    })
  }}
>
  {post.title}
</a>
```

`queryClient.prefetchQuery` is React Query's API to _imperatively_ trigger a pre-fetch. It will execute the `queryFn` and store the result at the provided `queryKey` in the cache.

Since the only goal of the prefetch API is to get data _into the cache_, it doesn't return any data (just an _empty_ Promise that you can `await` if you need to).

The biggest question you probably have with this code is where `queryClient` came from.

This is the same `queryClient` you initialized at the root of your app and passed to `QueryClientProvider`. You can get access to it via React Query's `useQueryClient` hook.

```jsx
import{ useQueryClient } from '@tanstack/react-query'

...

const queryClient = useQueryClient()
```

### ❌ Don't destruct the queryClient

It's important to note that you can't destructure properties from the QueryClient.

```js
const { prefetchQuery } = useQueryClient() // ❌
```

The reason for this is because the `QueryClient` is a _class_, and classes can't be destructured in JavaScript without losing the reference to its `this` binding.

This is not React Query specific, you'll have the same problem when doing something like.

```js
const { getTime } = new Date()
```

### Avoiding duplication of query option

You may have noticed that the object we passed to `prefetchQuery` has the same shape (`queryKey`, `queryFn`, `staleTime`) as an object we'd pass to `useQuery`. Because of this, it's not a bad idea to abstract this object into a maker function that you can invoke whenever you need the query options. That way, you can easily use the same options for both `useQuery` and `prefetchQuery`.

```js
// maker function for query options. Accept dynamic params
function getPostQueryOptions(path) {
  return {
    queryKey: ['posts', path],
    queryFn: () => fetchPost(path),
    staleTime: 5000
  }
}

...
// usage 1:
function usePost(path) {
  return useQuery(getPostQueryOptions(path))
}

...

<a
  onClick={() => setPath(post.path)}
  href="#"
  onMouseEnter={() => {
    // usage 2:
    queryClient.prefetchQuery(getPostQueryOptions(post.path))
  }}
>
  {post.title}
</a>
```

#### For TypeScript Users

Since the `getPostQueryOptions` function is not tied to anything from React Query, it's not type safe. For example, if we misspelled `staleTime` to `staletime`, nothing would complain – the excess property would just be ignored by TypeScript.

For this situation, React Query exposes a queryOptions function that will restore the type-safety you're used to.

```js
import { queryOptions } from '@tanstack/react-query'

function getPostQueryOptions(path: string) {
  return queryOptions({
    queryKey: ['posts', path],
    queryFn: () => fetchPost(path),
    staletime: 5000, // this has a typo
  })
}
```

Now this would error nicely, as you'd expect.

```text
Object literal may only specify known properties, but 'staletime' does not exist [...]. Did you mean to write 'staleTime'?
```

And if we throw this code into our app, here's how it would behave.

```js
// ...
```

Notice that if you hover over a link, wait a bit and then click through, you won't see a loading indicator since the data for that post will already be in the cache.

You can see this even more clearly if you open up the devtools and then hover over a link. As soon as you do, a new entry will be added to the cache.

Now one question you may still have is why we also added a `staleTime` to our query. What's cool about `prefetchQuery` is that it respects the `staleTime` of the query you're prefetching. This means if there's already **fresh** data in the cache, React Query will just ignore the prefetch request all together.

**If we didn't have a staleTime of 5000, every hover of the link would trigger a new request since the default staleTime in React Query is 0.**

This is somewhat un-intuitive, and subject to change in react query version 6. So by default pre-fetch not only fetches the first time, but also each time the user hovers. Since `staleTime` is by default 0, the prefetch would fetch each time, since the query data cache would be stale

Along these same lines, if you wanted to only prefetch if there was no data in the cache, you could pass a `staleTime` of `Infinity`.

```js
queryClient.prefetchQuery({
  ...getPostQueryOptions(post.path),
  staleTime: Infinity,
})
```

Now clearly prefetching is a solid option for avoiding loading indicators, but it's not a silver bullet. There's still an asynchronous request happening, and in reality, you have no idea how long it will take to resolve. It's entirely likely that, even with prefetching, the user will still see a loading indicator if the response is slow.

## Second option to avoid loading: no loading, by using initialData + getQueryData

This brings us to another potential optimization we can make: avoiding loading states all together.

In our example, before the user ever clicks through to the post page, we already have some of the data we need for it. Specifically, we have the id and title of the post. It's not all the data, but it may be enough to show a _placeholder_ UI to the user while we wait for the rest of the data to load.

To do this, React Query has the concept of `initialData`.

If you pass `initialData` to `useQuery`, React Query will use whatever data is returned from it to initialize the cache entry for that query.

```js
useQuery({
  queryKey,
  queryFn,
  initialData: () => {},
})
```

So as it relates to our example, what we need to figure out is how to get the specific post data out of the cache so that we can use it to initialize our post query.

```js
function usePost(path) {
  return useQuery({
    ...getPostQueryOptions(path),
    initialData: () => {
      // return cache[path]?
    },
  })
}
```

Again, `queryClient` to the rescue.

Remember, the `queryClient` is what holds the cache. To access cached data directly, you can use `queryClient.getQueryData`. It takes the `queryKey` as an argument and will return whatever is in the cache for that entry.

So in our example, we can use `queryClient.getQueryData(['posts'])` to get the list of posts, and then use `find` to get the specific post we need to initialize the post cache.

```js
function usePost(path) {
  const queryClient = useQueryClient()

  return useQuery({
    ...getPostQueryOptions(path),
    initialData: () => {
      // the query ['posts'] holds the list of all the posts, with title
      return queryClient
        .getQueryData(['posts'])
        ?.find((post) => post.path === path)
    },
  })
}
```

### For TypeScript Users

By default, `queryClient.getQueryData` will return `unknown` since React Query can't know what lives under which `queryKey`. The Query definitions are done ad hoc - when you call useQuery for the first time, and not upfront e.g. via a schema.

However, if you pass in a `queryKey` that was created via the `queryOptions` function, you can get back that type-safety since that key is tied to the `queryFn`, which is properly typed:

```js
import { queryOptions } from '@tanstack/react-query'

const postQueryOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  staleTime: 5000,
})

const data = queryClient.getQueryData(postQueryOptions.queryKey)
```

Have a look at this [TypeScript playground](!https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAbzgRwK4FMoE8DyYbAQB2AzgDRwCKG2AwgDbDpHwC+cAZlBCHAOQABGAENSIgMYBrAPRR0w8TAC0aTFj4BYAFDbxxEvFV1GzeAF44RdAHcqNLAyYsAFAEpt2mFjDo4ABQgDOAskYAATAC44AyhgIgBzAG44MGEYAAsomLikuAIYenQsmFiEuFYPLTD0cXphOU5UIkVCIk50GHF0gIMSNyi-bhBgEnQAHgBBKChhLDGemAA+Rcq9MRTAmBI8An1glHsd1r6EbTgDtQBpdCwogG0+SF6+AF0yM4vsADEiKI4OroLcjaVjuHRaNZBMJpYT7IwOEwsAB08Q61DUABEYc4Pk8tkd9Ej4dcsNowdpoSJtNJpHAAHoAfiAA): data is now typed as whatever fetchPosts returns.

Here is the code below.

```ts
import { queryOptions, QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()

type Post = { id: string; path: string; title: string }

declare function fetchPosts(): Promise<Array<Post>>

const postsOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})

const data = queryClient.getQueryData(postsOptions.queryKey)

data
// ^? Post[] | undefined
```

So now if we updated our usePost hook to include our initialData code, here's how it would behave.

```js
import * as React from 'react'
import markdownit from 'markdown-it'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPost, fetchPosts } from './api'

// first query with all the posts
function usePostList() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    staleTime: 5000,
  })
}

// query for post details
function getPostQueryOptions(path) {
  return {
    queryKey: ['posts', path],
    queryFn: () => fetchPost(path),
    staleTime: 5000,
  }
}

// get post details, with initialData from the posts list cache
function usePost(path) {
  const queryClient = useQueryClient()

  return useQuery({
    ...getPostQueryOptions(path),
    initialData: () => {
      return queryClient
        .getQueryData(['posts'])
        ?.find((post) => post.path === path)
    },
  })
}

function PostList({ setPath }) {
  const { status, data } = usePostList()

  if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return <div>Error fetching posts</div>
  }

  return (
    <div>
      {data.map((post) => (
        <p key={post.id}>
          <a onClick={() => setPath(post.path)} href='#'>
            {post.title}
          </a>
          <br />
          {post.description}
        </p>
      ))}
    </div>
  )
}

function PostDetail({ path, setPath }) {
  const { status, data } = usePost(path)

  const back = (
    <div>
      <a onClick={() => setPath(undefined)} href='#'>
        Back
      </a>
    </div>
  )

  if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return (
      <div>
        {back}
        Error fetching {path}
      </div>
    )
  }

  const html = markdownit().render(data?.body_markdown || '')

  return (
    <div>
      {back}
      <h1>{data.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

export default function Blog() {
  const [path, setPath] = React.useState()

  return (
    <div>
      {path ? (
        <PostDetail path={path} setPath={setPath} />
      ) : (
        <PostList setPath={setPath} />
      )}
    </div>
  )
}
```

Well, that didn't work. When we click a link, we only see the title and not the content of the post. Can you think of why that is? Take a look at the devtools for some hints.

Our PostDetail component tries to render `data?.body_markdown`, but when we look in the _cache_ at our post, `body_markdown` doesn't exist - we only have the `title` and `id` available. It's no coincidence that that's the exact data we used to seed the cache.

Earlier we assumed that by giving React Query the data we already had, "it may be enough to show a placeholder UI to the user while we wait for the rest of the data to load."

Turns out, that's not how it works.

React Query sees the data we put into the cache via `initialData` the same as any other data. Meaning, by setting data via `initialData` with a `staleTime` of 5000, we're telling React Query that this data is good for 5 seconds and it doesn't need to invoke the `queryFn` again until then.

Unfortunately, the data is not good since we only have part of it. This is an obvious limitation of setting the `initialData`. It's a good option, but only if you have **all** of the data up front (which is _rare_).

## Third option: plaheholderData

What we're really looking for is a way to show a proper placeholder while we're fetching the actual data. Luckily, React Query comes with another option that is tailor-made for this problem – `placeholderData`.

`placeholderData` is similar to `initialData`, except the data you return from it **won't get persisted to the cache**. That's a subtle difference, but it means React Query will still invoke the `queryFn` to get the real data, and update the cache when it has it (first on mount, then also other triggers, if stale).

From a UI perspective, this is exactly what we were wanting. We can show the `title` of the post as a placeholder, and then when the real data comes in, we can update the UI with the full post.

And if we update our app by swapping `initialData` for `placeholderData`, here's how it would behave.

```js
//...
function usePost(path) {
  const queryClient = useQueryClient()

  return useQuery({
    ...getPostQueryOptions(path),
    placeholderData: () => {
      return queryClient
        .getQueryData(['posts'])
        ?.find((post) => post.path === path)
    },
  })
}
//...
```

That's better. The user is able to see the title instantly, and then when the background request finishes, the rest of the post is displayed.

Still, I think it can be better.

### Further improvement: loading indicator

I know we've been trying to avoid it, but I do think showing a loading indicator (along with the title) to the user while we're fetching the rest of the post would be a good addition to our app. Thankfully, React Query makes this simple.

When you invoke useQuery passing it a `placeholderData`, it will give you back an `isPlaceholderData` boolean that will evaluate to `true` if the data the user is currently seeing is placeholder data.

We can use this in order to determine when we should show the loading indicator.

```jsx
function PostDetail({ path, setPath }) {
  // extract this boolean
  const { status, data, isPlaceholderData } = usePost(path)

  const back = (
    <div>
      <a onClick={() => setPath(undefined)} href='#'>
        Back
      </a>
    </div>
  )

  if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return (
      <div>
        {back}
        Error fetching {path}
      </div>
    )
  }

  const html = markdownit().render(data?.body_markdown || '')

  return (
    <div>
      {back}
      <h1>{data.title}</h1>
      // use this boolean
      {isPlaceholderData ? (
        <div>...</div>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  )
}
```

Much better.

And just to really tie it all together, let's add back in our _prefetching_ logic so if the request is fast enough, the user will see the real entry right away, but if it's not, they'll see the `title` with the loading indicator until it resolves.

```jsx
//...
function PostList({ setPath }) {
  const { status, data } = usePostList()
  const queryClient = useQueryClient() // add this hook

  //...

  return (
     <div>
      {data.map((post) => (
        <p key={post.id}>
          <a
            onClick={() => setPath(post.path)}
            href="#"
            // add this hover prefetch here
            onMouseEnter={() => {
              queryClient.prefetchQuery(getPostQueryOptions(post.path))
            }}
          >
            {post.title}
          </a>
          <br />
          {post.description}
        </p>
      ))}
    </div>
  )
```

### For TypeScript Users

Both `initialData` and `placeholderData` need to conform to the same type that the `queryFn` returns. If you want `placeholderData` to be a "partial" of that data, you need to define your type in a way to adhere to that.

As an example, for what we're rendering in the app above, the type of a detail post would have to be:

```ts
type PostDetail = {
  id: string
  title: string
  body_markdown?: string
}
```

Note how `body_markdown` has to be defined as optional, because the list Query doesn't have it, and we're adding what the list query returns as `placeholderData`. If we would want `body_markdown` to always be present on type level, we'd have to add it as an empty string when writing our `placeholderData`:

```ts
placeholderData: () => {
  // get from cache, without the body_markdown
  const post = queryClient
    .getQueryData(['posts'])
    ?.find((post) => post.path === path)

  return post
    ? {
        ...post,
        body_markdown: '' /* add this empty string for typescript*/,
      }
    : undefined
}
```

Note that this wouldn't change what we're rendering because our UI would still show the loading indicator while we have `placeholderData`, it's just necessary to appease the TypeScript gods.

It's also good to know that using `placeholderData` can be "more type-safe" than assigning a default value during object destruction. For more details, have a look at this [TypeScript playground](!https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAbzgVwM4FMCKz1QJ5wC+cAZlBCHAOQACMAhgHaoMDGA1gPRTr2swBaAI458VALAAoKZ05wAFrnQAaOAHd0VAG7o4fVsAAm6RgwA2ZgvVSpgAc0bpDeuCyjBGdvajjGS9ZDN4LXozHFJoOAhkKF96Bhk5DxZeZwgSODt0GBgPL3o4GDwwXVxyKFUNOFYmV3RdGHl4wsVC4t10uIY4YB81IxMnQohEuEZkEAAjXDgAHzgAIgWpVghmeCRDeIKAXkWFojg9tCxRPAAKBCk4OBFcPABpdDwALjgAbSooJkMKADkJtMoFQALrKa63M4AMUYb3OAEojgA+OAABXIIF66AAdDxUBAzDpzgBZeLyXE-CgI+HgySEeFSKRbBKSWRwAB6AH5Gay5I1dKh6CAGvI8upomZnHhgOhJS4iiU4GVImpFIwULZPHAAAZgMx8dDyAnGKAAEW22p661So2mNROLV0d3wMLgPBgMWYLnGU1wqkmyHgeoNRsluHN3V6vnQJA8Q2srhg7k8KzWLEh9yOGtO90uEOdj2eb0+30YvxAAN9wLB+ehsLgCORaIxWNx6HxhPQJLJFLLVPhNIhwdYhuN4e2byoEjpDOkkgL2OZ9FGNw5nKAA).

Code here below.

```js
import { useQuery } from '@tanstack/react-query'

// here, we've accidentally assigned a string as default value for our data
// instead of getting a type error, we can see that the type of data is widened to
// number | ""
const { data = '' } = useQuery({
  queryKey: ['randomNumber'],
  queryFn: () => Promise.resolve(Math.random()),
})

data
// ^? number | ""

// More type-safe
// the same thing would yield a type error when using `placeholderData` instead
// because the queryFn returns a number, but placeholderData is defined as string
const query = useQuery({
  queryKey: ['randomNumber'],
  queryFn: () => Promise.resolve(Math.random()),
  placeholderData: '',
})

query.data
//    ^?(property) data: string
```

### Additional details about initial and placeholder data

See: https://tkdodo.eu/blog/placeholder-and-initial-data-in-react-query

Main ideas:

- when either of these 2 are defined, the query will not be pending, but succesful
- they can either be a value, or a function
- difference: `initialData` works on cache level, while `placeholderData` works on _observer_ level. This has a couple of implications:
  - `initialData` is persisted to the cache
  - `placeholderData` usage means that there will be a background refetch when you mount an observer for the first time (component mount)
  - `isPlaceholderData` is used to check the `data` is not coming from cache, before the background fetch finishes
  - `initialDataUpdatedAt` can be used to set the timestamp of the `initialData`. This is useful if you want to influence the `stale` state of the initial cache entry.
