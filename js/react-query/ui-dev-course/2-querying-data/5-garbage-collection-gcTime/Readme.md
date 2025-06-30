# Garbage collection

React Query's special sauce is its cache, and like any sauce, you can't trust it unless it has an expiration date.

The reason, in React Query's case, is because its cache is kept in memory which is finite. Without purging the cache on occasion, it would grow indefinitely, causing memory issues on low-end devices.

Not only that, but there will always come a moment in a cache's life where it's deemed "too old" to be shown, even as stale data, to the user.

Of course, this is always a balancing act. Data in the cache means a more responsive app, but old, irrelevant data does more harm than good.

That's why React Query comes with **automatic garbage collection** built in.

If you're not familiar, Garbage Collection (GC) is a form of memory management where memory that has been allocated by a program will be automatically released after it is no longer in use. Most high level programming languages we use today, including JavaScript, utilize garbage collection in some capacity.

React Query does as well, but it does so with a time-based collector called `gcTime`. This setting determines when a query's data should be removed from the cache – and it defaults to **5 minutes**.

Now you might be thinking, "so does this mean that React Query will remove data 5 minutes after it's been added to the cache?" **No**.

As long as the data is being _actively used_, it's not eligible for garbage collection. Of course, this brings up another obvious question, what exactly does "actively used" mean?

Remember how every time a component mounts, it creates an _Observer_ for each call to `useQuery`? That is what makes a query _active_. And by the same definition, a query that has no Observers is considered _inactive_.

Conveniently, Observers get destroyed when a component unmounts and is removed from the DOM. If there are none left, React Query can be confident that it should start the garbage collection timer for that entry in the cache.

A practical example would be our search functionality that we saw when we talked about fetching on demand.

Every search produces a new cache entry, and as soon as we search for something new, the previous entry becomes _inactive_ (because the Observer will switch to observing the new `queryKey`).

If we search for the same term within the next 5 minutes, we'll get data served from the cache (and we might also get a background refetch if that data is **stale**).

But if we search for it again at some point in the future more than 5 minutes after the initial Observer had been removed, the cache entry will have already been removed, and the user will see a loading indicator.

Of course, `gcTime` is customizable and can be set to any value you see fit when you invoke useQuery.

```js
function useIssues(search) {
  return useQuery({
    queryKey: ['issues', search],
    queryFn: () => fetchIssues(search),
    enabled: search !== '',
    staleTime: 5000, // 5 seconds
    gcTime: 3000, // 3 seconds
  })
}
```

To demonstrate this, let's modify our search example to include a gcTime of 3000 (3 seconds), instead of the default of 5 minutes. This way, we can observe the cache entry being removed 3 seconds after we enter a new search term.

```js
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import Search from './Search'
import { fetchIssues } from './api'

function useIssues(search) {
  return useQuery({
    queryKey: ['issues', search],
    queryFn: () => fetchIssues(search),
    enabled: search !== '',
    staleTime: 5000,
    gcTime: 3000,
  })
}

function IssueList({ search }) {
  const { data, status, isLoading } = useIssues(search)

  if (isLoading) {
    return <div>...</div>
  }

  if (status === 'error') {
    return <div>There was an error fetching the issues</div>
  }

  if (status === 'success') {
    return (
      <p>
        <ul>
          {data.items.map((issue) => (
            <li key={issue.id}>{issue.title}</li>
          ))}
        </ul>
      </p>
    )
  }

  return <div>Please enter a search term</div>
}

export default function App() {
  const [search, setSearch] = React.useState('')

  return (
    <div>
      <Search onSubmit={(s) => setSearch(s)} />
      <IssueList search={search} />
    </div>
  )
}
```

Notice that if you search for something, say `useQuery`, and then you search for something else, wait three seconds, and then search for `useQuery` again, you'll see a loading indicator since the cache entry from the initial `useQuery` search will have been removed.

Now let's do the same thing, but this time, open up the React Query devtools so you can (literally) see what's going on under the hood.

First, search for useQuery again keeping your eye on the devtools.

You'll see once the data comes in, it will show up as **fresh** for 5 seconds (our staleTime) and there will be a 1 in the green box on the left of the cache entry. That number shows the Observer count and since we've currently called useQuery once for that key, we have 1 Observer.

Now, search for something else – say, "React".

You'll see that the old ["issues", "useQuery"] cache entry will be shown as **inactive** and the number next to it has changed to a 0, representing that its Observer has been removed.

Then, after 3 seconds (our gcTime), you'll see the cache entry disappear from the cache entirely.
