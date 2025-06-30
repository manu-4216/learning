APIs can return data in various formats and sizes, ranging from small, single objects to large datasets containing thousands of records.

For example, the API at https://uuid.rocks/json returns a single JSON object with less than 500 bytes of data.

```json
{
  "apiVersion": "v1.3.0",
  "uuid": "24dbfb76-5725-4974-b159-52ac9a34c8ab",
  "is_readable_uuid": false,
  "is_short_uuid": false,
  "is_ulid": false,
  "timestamp": "2024-05-11T14:15:49.670Z"
}
```

However, other APIs might give you access to thousands of records, each with kilobytes of data.

For example, a single issue record from the GitHub API is 3kb all on its own, and some repos like facebook/react have over 10,000 issues. That's a lot of data to return in a single request.

To handle such large datasets efficiently, APIs often implement pagination, a technique that breaks down the data into multiple pages.

If you've never worked with paginated API before, here's how they typically work:

1. The API provides a way to specify the page number and the number of records per_page in the request params.

2. When you make a request to the API, you include these pagination params to indicate which page of results you want to retrieve.

3. The API processes your request and returns a subset of the total data based on the specified page number and the number of records per_page.

4. Along with the paginated data, the response usually includes additional metadata, such as the total number of records, the current page number, and the total number of pages available.

5. To retrieve the next page of results, you increment the page number in your subsequent request while keeping the same number of records per_page.

6. You can continue making requests with different page numbers to navigate through the entire dataset, one page at a time.

Paginated APIs help manage large datasets by breaking them down into smaller, more manageable chunks. This approach reduces the amount of data transferred in a single request, improves performance, and allows for efficient retrieval and display of data in your application.

And yes, as you can probably guess at this point, React Query has built-in support for paginated queries.

To demonstrate, let's extend our GitHub Repos app we saw earlier in the course by adding pagination to it.

Here's where we'll start (without the paginated bits).

```js
function useRepos(sort) {
  return useQuery({
    queryKey: ['repos', { sort }],
    queryFn: () => fetchRepos(sort),
    staleTime: 10 * 1000,
  })
}
```

The way GitHub's pagination API works is you can give it two parameters, `page` and `per_page`.

`page` defines which page should be fetched, and `per_page` defines how many entries each page should have.

For `per_page`, we'll just hard code it to 4 since there's not really a reason it needs to be dynamic.

```js
export async function fetchRepos(sort, page) {
  const response = await fetch(
    `https://api.github.com/orgs/TanStack/repos
      ?sort=${sort}
      &per_page=4
      &page=${page}`
  )

  if (!response.ok) {
    throw new Error(`Request failed with status: ${response.status}`)
  }

  return response.json()
}
```

For `page`, we'll keep track of that as React state that the user can increment and decrement.

Let's have it live inside the parent `Repos` component, that way, via props, we can get access to it and modify it from within both the `Sort` and `RepoList` child components.

```jsx
export default function Repos() {
  const [sort, setSort] = React.useState('created')
  const [page, setPage] = React.useState(1)

  const handleSort = (sort) => {
    setSort(sort)
    setPage(1) // when changing the sort, reset the page to 1
  }

  return (
    <div>
      <Sort sort={sort} onSort={handleSort} />
      <RepoList sort={sort} page={page} setPage={setPage} />
    </div>
  )
}
```

Now inside of `RepoList`, let's add our buttons and pass along the page prop as an argument to `useRepos`, so that we can then add it to the `queryKey` and pass it along to `fetchRepos` in the `queryFn`.

```js
function useRepos(sort, page) {
  return useQuery({
    queryKey: ['repos', { sort, page }],
    queryFn: () => fetchRepos(sort, page),
    staleTime: 10 * 1000,
  })
}

function RepoList({ sort, page, setPage }) {
  //...
  return (
    // ...
     <div>
        <button
          onClick={() => setPage((p) => p - 1)}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
  )
```

Without doing much besides keeping track of `page` and passing it along to `useQuery`, we already have a pretty basic paginated UI. And, out of the box, React Query will handle the caching for us.

So far, so good – but it's obviously not quite ready to ship yet.

Let's improve it (again) by minimizing the amount of times the user sees our `...` loading indicator. Instead of replacing the whole list of repos with the loading indicator when the user changes the `page`, what if we kept the old list around until the new list was ready?

This would minimize the amount of layout shift in our app and would make the experience feel a little more smooth.

To do this, we'll call back to an API we learned in the last lesson – `placeholderData`.

PS: Why not use `intialData` instead ? We don't want this data to be saved in the cache as valid data for this page, that would be incorrect. Instead, we ust want this data to be used temporarily, until the actual next page data is retrieved. We can distinguish if this data is a placeholder with `isPlacholderData`.

One thing we didn't talk in regards to `placeholderData` is that the function you pass to it will be passed the previous state of the query as its first argument.

```js
useQuery({
  queryKey,
  queryFn,
  placeholderData: (previousData) => {
    //...
  },
})
```

What that means is that whenever the user changes the `page`, we can set the `placeholderData` for the query to be whatever the previous data was. This way, the user will see the old list of repos until the new list gets added to the cache.

```js
function useRepos(sort, page) {
  return useQuery({
    queryKey: ['repos', { sort, page }],
    queryFn: () => fetchRepos(sort, page),
    staleTime: 10 * 1000,
    placeholderData: (previousData) => previousData,
  })
}
```

And so it's not confusing, let's also add some `opacity` to the previous list of repos to give the user some feedback.

To do that, we can use `useQuery`'s `isPlaceholderData` property for dynamically setting the `opacity` on our repos list.

```js
function RepoList({ sort, page, setPage }) {
  const { data, status, isPlaceholderData } = useRepos(sort, page)
  //...

  return (
    <ul style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>
    // ...
  )
```

That's much better and the navigation between pages feels pretty good.

What's cool about this is it's not just for the pagination either. Notice what happens when you change the `sort` – you get the same behavior.

> Reminder: The `queryKey` change is a trigger for `queryFn`.

The reason for this is because, from React Query's perspective, all it cares about is if the `queryKey` changes. Whether that's via a change in the `page` or in the `sort` – it doesn't matter.

Now before this is ready to ship, there's still one more problem we need to take care of that you probably noticed – we're not doing a good job of disabling our buttons when appropriate.

Specifically, we want to disable the buttons while our application is fetching new data and when we've reached the end of the list.

For disabling when fetching, we already have access to `isPlaceholderData` which is exactly what we need.

```jsx
function RepoList({ sort, page, setPage }) {
  const { data, status, isPlaceholderData } = useRepos(sort, page)

return (
  //...
  <button
      onClick={() => setPage((p) => p - 1)}
      disabled={isPlaceholderData || page === 1}
    >
      Previous
    </button>
    <span>Page {page}</span>
    <button
      disabled={isPlaceholderData}
      onClick={() => setPage((p) => p + 1)}
    >
  )
```

Now for disabling when we've reached the end of the list.

The GitHub API doesn't return an explicit value to tell us if we've reached the last page, but we can work around that by assuming that if we don't get a full page (of `per_page` items), then there are no more pages to fetch.

**NOTE**: This won't work if the last page length is the same as `per_page`. Another option: ask `per_page + ` items, and use that last item to indicate if there are more items.

```js
export const PAGE_SIZE = 4

//...
  <button
    disabled={isPlaceholderData || data?.length < PAGE_SIZE}
    onClick={() => setPage((p) => p + 1)}
  >
    Next
  </button>
```

With that, we have a fully paginated experience!

Thanks to React Query's cache, clicking back and forth through pages is instant, and clicking to new pages will show the previous page while it loads, avoiding a jarring layout shift.

...but, for extra credit, is there a way we can make the experience even better?

What if we layered in another feature that we learned about in the last lesson, prefetching?

However, this time, instead of listening for `onMouseEnter`, what if we always prefetched the `next` page in the background? That way, whenever the user clicked "Next", the data would already be in the cache and they'd get the UI instantly.

To do this, let's first extract our query options for useRepos into a separate function so that we can reuse it.

```js
function getReposQueryOptions(sort, page) {
  return {
    queryKey: ['repos', { sort, page }],
    queryFn: () => fetchRepos(sort, page),
    staleTime: 10 * 1000,
  }
}

function useRepos(sort, page) {
  return useQuery({
    ...getReposQueryOptions(sort, page),
    placeholderData: (previousData) => previousData,
  })
}
```

Now, inside of `useRepos`, let's add a `useEffect` hook that will prefetch the data for the next page.

```js
function useRepos(sort, page) {
  const queryClient = useQueryClient()

  // whenever the page is changed, prefetch the next page (page + 1).
  // PS: in reality, we might want to check the direction the user goes
  React.useEffect(() => {
    queryClient.prefetchQuery(getReposQueryOptions(sort, page + 1))
  }, [sort, page, queryClient])

  return useQuery({
    ...getReposQueryOptions(sort, page),
    placeholderData: (previousData) => previousData,
  })
}
```

Now that is a polished experience.

Combining React Query's cache, pagination, and prefetching, we've built an asynchronous paginated UI that feels as if it were synchronous.
