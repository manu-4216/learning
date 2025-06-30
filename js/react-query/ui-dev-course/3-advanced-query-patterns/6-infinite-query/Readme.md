# Infinite queries

Nearly 20 years ago, UI engineer Aza Raskin invented something he would later come to deeply regret – the infinite scroll. This pattern, which allows users to endlessly scroll through content, has since become a staple for social media platforms like Facebook, Pinterest, and Instagram.

Despite his regrets, React Query still makes it ~simple to implement.

You've seen how with traditional pagination, you can create a paginated UI simply by including the `page` number in the `queryKey`.

With infinite lists, it actually works to our disadvantage that `useQuery` can only display data for the current `queryKey`.

What we really want is to have a single cache entry that we can append to every time we get new data.

This is exactly what React Query's `useInfiniteQuery` hook allows you to do. It works mostly the same as useQuery, but there are some fundamental differences.

When fetching data for both infinite lists and paginated lists, you fetch data over time in chunks. To do this, you need a way to figure out what you've already fetched, and what to fetch next.

Typically, as we saw in our Repos example, this is done via a page number.

With our pagination example, we created the `page` with React state, allowed the user to increment and decrement it via the UI, and then we passed it to our custom hook to use inside of the `queryKey` and `queryFn`.

```js
const [page, setPage] = React.useState(1)

...

const { data, status } = useRepos(sort, page)
```

With infinite lists and the `useInfiniteQuery` hook, the idea is the same, but the implementation is a little different. Instead of needing to manage the `page` in React state yourself, `useInfiniteQuery` will manage it for you.

Here's how it works.

Say we were fetching posts from the dev.to API again, and had a `fetchPosts` function that looked like this - where it took in the `page` to fetch.

```js
export async function fetchPosts(page) {
  const url = `https://dev.to/api/articles?per_page=6&page=${page}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch posts for page #${page}`)
  }

  return response.json()
}
```

When invoking `fetchPosts` with an infinite list, you're mostly likely going to start at page 1 and increment from there.

With that said, if `useInfiniteQuery` is managing this page for us, it would make sense that we need to give it a few things in order to do that.

Specifically, we need to tell it what `page` to start at (1, in our case) and how to get to the next page.

To tell it what page to start at, you can give it an `initialPageParam`. This value will be passed to the `queryFn` the first time it's called so that you can pass it on to your API request.

```js
function usePosts() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: 1,
  })
}
```

We haven't used it before, but React Query will always pass an object (called `QueryFunctionContext`) to the `queryFn` with information it has about the query itself.

As you can see, it's via the `QueryFunctionContext` that we can get access to the initial `pageParam`.

From here, all we need to do is to tell React Query how to get the next page.

We can do that by adding a `getNextPageParam` method to our options object.

```js
function usePosts() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {},
  })
}
```

When invoked, React Query will pass the `getNextPageParam` method three arguments, `lastPage`, `allPages`, and `lastPageParam`.

- `lastPage` is the _data_ from the last page fetched
- `allPages` is an array of all the pages fetched so far
- `lastPageParam` is the `pageParam` that was used to fetch the last page

Using these three arguments, you should be able to derive what the next `page` will be and return it. In our case, we'll take whatever the `lastPageParam` was an add 1 to it.

```js
function usePosts() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      return lastPageParam + 1
    },
  })
}
```

Additionally. if you want to tell React Query that there are no more pages left to fetch, you can return `undefined`.

In our example, if the last page we fetched was empty, it's a safe assumption that we're out of pages.

```js
function usePosts() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (lastPage.length === 0) {
        return undefined
      }

      return lastPageParam + 1
    },
  })
}
```

## cursor based APIs

It's not uncommon for infinite queries to be used with cursor based APIs, where each page returns a cursor that points to the next page as part of its result.

```js
fetch('/api/projects?cursor=0')
// { data: [...], nextCursor: 3}
fetch('/api/projects?cursor=3')
// { data: [...], nextCursor: 6}
fetch('/api/projects?cursor=6')
// { data: [...], nextCursor: 9}
```

In these cases, the last page that was fetched would include the next cursor, which we could return as the `pageParam` value.

### Show more

```js
useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => projects(pageParam),
  getNextPageParam: (lastPage) => {
    return lastPage.nextCursor
  },
})
```

Remember, each _page_ is the data returned from the query function for that page. If you need to use the `nextCursor` value that was returned from the API, you must write your query function so it returns it.

## Returned data

So at this point you know how to get data into the cache with `useInfiniteQuery`, but now how do you get it out?

This brings us to the other major difference between useQuery and `useInfiniteQuery`, the shape of the data it gives you.

With `useQuery`, you just get whatever data is in the cache at the `queryKey`. With `useInfiniteQuery`, it's often helpful to have both the _data_ and the _page_ that that _data_ is associated with.

To do that, the object that `useInfiniteQuery` gives you look like this – where the data is separated into a multidimensional array of `pages`, with each element in the array being all the data for a specific page.

```json
{
  "data": {
    "pages": [
      [{}, {}, {}],
      [{}, {}, {}],
      [{}, {}, {}]
    ],
    "pageParams": [1, 2, 3]
  }
}
```

And if you'd prefer to have a normal, flat array, you can always use JavaScript's built-in `Array.flat` method to flatten the array of pages.

```js
const { data } = usePosts()

const posts = data?.pages.flat() // [ {}, {}, {} ]
```

So now if we throw all of this into an app, here's where we're at.

```jsx
import * as React from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchPosts } from './api'

function usePosts() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    staleTime: 5000,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (lastPage.length === 0) {
        return undefined
      }

      return lastPageParam + 1
    },
  })
}

export default function Blog() {
  const { status, data } = usePosts()

  if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return <div>Error fetching posts</div>
  }

  return (
    <div>
      {data.pages.flat().map((post) => (
        <p key={post.id}>
          <b>{post.title}</b>
          <br />
          {post.description}
        </p>
      ))}
    </div>
  )
}
```

Solid start.

But of course, we haven't done anything particularly "infinite" yet. Let's fix that.

In the pagination example, because we managed the `page` with React state, all we had to do to get the next page was increment the state when a button was clicked.

```jsx
<button onClick={() => setPage((p) => p + 1)}>Next</button>
```

But now, `useInfiniteQuery` is managing the `page` for us. Because of this, it gives us a `fetchNextPage` function that, when invoked, will get the new `pageParam` by invoking `getNextPageParam`, and then call the `queryFn` with it.

```js
const { status, data, fetchNextPage } = usePosts()
```

So if we now add a button to the bottom of our list that invokes `fetchNextPage`, we'll get our first infinite list.

```jsx
import * as React from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchPosts } from './api'

function usePosts() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    staleTime: 5000,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (lastPage.length === 0) {
        return undefined
      }

      return lastPageParam + 1
    },
  })
}

export default function Blog() {
  const { status, data, fetchNextPage } = usePosts()

  if (status === 'pending') {
    return <div>...</div>
  }
  if (status === 'error') {
    return <div>Error fetching posts</div>
  }

  return (
    <div>
      {data.pages.flat().map((post) => (
        <p key={post.id}>
          <b>{post.title}</b>
          <br />
          {post.description}
        </p>
      ))}

      <button onClick={() => fetchNextPage()}>More</button>
    </div>
  )
}
```

And if we wanted, we could make our button more intelligent by giving it some meta information about the state of the query. Specifically,

- `isFetchingNextPage` will be true when the request for the next page is in flight
- `hasNextPage` will be true if there's another page to fetch. This is determined by calling `getNextPageParam` and checking if `undefined` was returned.

We can use both those values to disable our "More" button conditionally and to give it a loading indicator to while React Query is fetching the next page.

```jsx
  const { status, data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts()

  <button
    onClick={() => fetchNextPage()}
    disabled={!hasNextPage || isFetchingNextPage}
  >
    {isFetchingNextPage ? '...' : 'More'}
  </button>
```

And you don't only have to have infinite queries in a single direction. So far, we've only looked at queries that start at the beginning and then fetch _forward_ to get more pages – but that might not always be the case.

For example, say you were building a messaging app that supported deep linking to any message. In that scenario, the user would find themselves in the middle of a conversation and would need to fetch both backwards and forwards to get the full context.

Thankfully, fetching _backwards_ follows a similar pattern as fetching forwards, just with more appropriately named values.

For example, instead of `getNextPageParam` that takes in `lastPage`, `allPages`, and `lastPageParam`, you'll use `getPreviousPageParam` that takes in `firstPage`, `allPages`, and `firstPageParam`.

```js
useInfiniteQuery({
  queryKey,
  queryFn,
  initialPageParam,
  getNextPageParam: (lastPage, allPages, lastPageParam) => {
    if (lastPage.length === 0) {
      return undefined
    }

    return lastPageParam + 1
  },
  getPreviousPageParam: (firstPage, allPages, firstPageParam) => {
    if (firstPageParam <= 1) {
      return undefined
    }

    return firstPageParam - 1
  },
})
```

Now I know what you're thinking, "This is all great, but it's not addicting enough. I want my user's brains to turn to mush as they – against their will – scroll through my app so I can maximize the amount of ad dollars I make off of them".

Say less.

The good news is there's nothing new related to React Query that you need to know for this. Instead, it's just triggering fetchNextPage when the user scrolls to the bottom of the list.

To do the heavy lifting, let's leverage useHooks' `useIntersectionObserver` hook.

It works by giving you a **ref** and an **entry**.

```jsx
import { useIntersectionObserver } from '@uidotdev/usehooks'
// ...
const [ref, entry] = useIntersectionObserver()
```

Whenever the element that the `ref` is attached to comes into view, `entry.isIntersecting` will be true.

Combine that with some `useEffect` magic, and we can trigger `fetchNextPage` when the user scrolls to the bottom of the list.

```jsx
import * as React from "react"
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchPosts } from './api'
import { useIntersectionObserver } from "@uidotdev/usehooks";

function usePosts() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    staleTime: 5000,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (lastPage.length === 0) {
        return undefined
      }

      return lastPageParam + 1
    }
  })
}

export default function Blog() {
  const { status, data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts()

  const [ref, entry] = useIntersectionObserver();

  React.useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [entry?.isIntersecting, hasNextPage, isFetchingNextPage])

    if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return <div>Error fetching posts</div>
  }

  return (
    <div>
      {data.pages.flat().map((post, index, pages) => (
        <p key={post.id}>
          <b>{post.title}</b>
          <br />
          {post.description}
        // Why 3 below?
        // Instead of waiting for the last post to appear on screen (which
        // could cause a loading delay), it triggers the next page a few
        // posts early.
        // 3 so that we start the fetch when the user almost hits the bottom
        // of the page - after the 3rd last element came into view.
        // This depends on how large your elements are and which experience
        // you want for your user.
          {index === pages.length - 3
              ? <div ref={ref} />
              : null}
        </p>
      ))}
    </div>
  }
)
```

Neat. Our users can now scroll forever 👹.

## Refetching for fresh data

Now there is one last thing related to infinite queries that we need to talk about before we wrap up, and that's _refetching_.

One of the most valuable aspects of React Query is that it keeps your data up to date in the background with _automatic refetches_. This ensures that the data the user sees is always **fresh**.

But how does refetching work with infinite queries?

The idea is pretty straightforward – React Query refetches the first page in the cache (regardless of what `initialPageParam` is), calls `getNextPageParam` to get the next page, and then fetches that page. This process continues until all pages have been refetched or until `undefined` is returned from `getNextPageParam`.

It works this way for one important reason – **Consistency**.

An infinite query is only one cache entry, so while each page is a separate fetch, they eventually form one long list in our UI. If we were to only refetch _some_ of the queries, React Query couldn't guarantee consistency.

For example, let's consider that we have two pages in the cache with a _pageSize_ of `4`. The first `page` shows ids 1 through 4, the second shows ids 5 through 8.

If id 3 was deleted on the backend, and we only refetched page 1, our page 2 would be out of sync and both pages would have a **duplicate** entry of 5 in the cache.

On the other hand, if an entry was added on `page` 1, let's say with an id of 0, and we only fetched `page` 1, then the `page` with an id of 4 would be missing from the cache.

All this to say, React Query can't take any shortcuts when it comes to refetches of infinite queries – it always has to fetch all the pages to guarantee consistency.

If you fetch the next page with `fetchNextPage`, it will only fetch the new page. It's refetches from e.g. `queryClient.invalidateQueries`() or automatic refetches because `staleTime` has elapsed and we get a _trigger_ like a window focus that will refetch **all pages** in order.

## Memory management with maxPages

As you can imagine, if there were a lot of pages in the cache, this could be problematic both from a network and a memory perspective.

To avoid this problem, you can give `useInfiniteQuery` a `maxPages` option that limits the number of pages that React Query will keep in the cache.

So for example, if you had a `maxPages` of 3, even if you had bi-directional infinite queries, React Query would (intelligently) only keep three pages in the cache.

`useInfiniteQuery` might be a bit more complicated than `useQuery`, but the user experiences it enables would be incredibly difficult without it.

Like everything else in React Query, with just a bit of configuration, `useInfiniteQuery` handles the complexities of cache management for you, letting you focus on what really matters – building a great user experience.
