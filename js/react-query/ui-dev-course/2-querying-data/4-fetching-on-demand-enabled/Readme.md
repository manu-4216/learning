# Title

At this point, you've seen a few examples of how React Query can take imperative, asynchronous code and make it feel as if it were synchronous by putting it behind a declarative API. **However, all of those examples had one thing in common - they all fetched their data immediately when the component mounted.**

Now usually this is what you want, but, there are plenty of reasons why it could be a good idea to _delay_ making that initial request.

For example, what if we needed to get some input from the user first in order to make the request? What exactly would that look like using `useQuery`?

If we extended this thought experiment to our Github Issues app by adding in a search bar, one approach may look like this.

```js
const [search, setSearch] = React.useState('')

if (search) {
  return useQuery({
    queryKey: ['issues', search],
    queryFn: () => fetchIssues(search),
  })
}
```

This code seems perfectly reasonable. Unfortunately, React won't even let you do this because it violates the rules of hooks. Specifically, you can't call hooks conditionally as we're doing in our `if` statement.

## Using enabled option

Instead, React Query offers another configuration option via its `enabled` property.

`enabled` allows you to pass a boolean value to useQuery that determines whether or not the query function should run.

In our case, `enabled` allows us to tell React Query that we only want to run the queryFn _when_ we have a search term.

```js
function useIssues(search) {
  return useQuery({
    queryKey: ['issues', search],
    queryFn: () => fetchIssues(search),
    enabled: search !== '',
  })
}
```

And if we threw that into a real app, here's how it would look.

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
  })
}

function IssueList({ search }) {
  const { data, status } = useIssues(search)

  if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return <div>There was an error fetching the issues</div>
  }

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

## Knowing when it's loading the query, using status=pending AND fetchStatus=fetching/isFetching

Notice that before a user ever types into the input field, they're already seeing the ... loading indicator. Why is that?

Remember, a query can only ever be in one of three states - `pending`, `success` or `error`.

`success` means there is `data` available in the cache, `error` means there was an `error` in trying to get the data to put in the cache, and `pending` means literally anything else.

Right now, in order to show our loading indicator, we're checking if the query is in a `pending` state.

```js
if (status === 'pending') {
  return <div>...</div>
}
```

But again, `pending` only tells us that there isn't data available in the cache and there wasn't an error in fetching that data. **It doesn't tell us if the query is currently fetching or not** – as we're assuming it does by treating it as the conditional for our loading indicator.

What we _really_ need is a way to know **if the queryFn is currently being executed**. If it is, that will help us in determining if we should show the loading indicator or not.

Thankfully, React Query exposes this via a `fetchStatus` property on the query object.

```js
const { data, status, fetchStatus } = useIssues(search)
```

When `fetchStatus` is `fetching`, the `queryFn` is being executed.

We can use this, along with the `status` of the query, to more accurately derive when we should show the loading indicator.

```js
const { data, status, fetchStatus } = useIssues(search)

if (status === 'pending') {
  if (fetchStatus === 'fetching') {
    return <div>...</div>
  }
}
```

This makes sense. If the status is pending, that means there isn't data available in the cache. If the fetchStatus is fetching, that means the queryFn is currently being executed. If there's no data in the cache and the queryFn is currently being executed, we should show the loading indicator.

#### isFetching

For those of you who hate typing, you can also used the derived isFetching value that useQuery returns which is equivalent to fetchStatus === 'fetching'.

```js
const { data, status, isFetching } = useIssues(search)

if (status === 'pending') {
  if (isFetching) {
    return <div>...</div>
  }
}
```

In fact, this pattern is so common that React Query provides a derived value, appropriately named isLoading, that is shorthand for the code above.

```js
const { data, status, isLoading } = useIssues(search)

if (isLoading) {
  return <div>...</div>
}
```

So if we throw that into our app, we're good – right?

```js
function IssueList({ search }) {
  const { data, status, isLoading } = useIssues(search)

  if (isLoading) {
    return <div>...</div>
  }

  if (status === 'error') {
    return <div>There was an error fetching the issues</div>
  }

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
```

Sadly, not quite. As is, we get this error.

Cannot read properties of undefined (reading 'items')

This is another really good moment to pause and try to figure out why this is happening for yourself. There's another Aha! moment waiting for you at the end of your journey.

**The reason this is happening is because we're assuming that if isLoading is false, and the status isn't error, then we have data. Unfortunately, that's the wrong assumption.**

Remember, `isLoading` is only telling us if the `status` is pending and the `fetchStatus` is `fetching`. If we break that down even further, a pending status means there's no data in the cache, and a `fetching` `fetchStatus` means the `queryFn` is currently being executed.

```js
const isLoading = isPending && isFetching

// or more verbose version:
const isLoading = status === 'pending' && fetchStatus === 'fetching'
```

So what happens in the scenario where the status is pending because there's no data in the cache, and the fetchStatus isn't fetching because the queryFn isn't currently being executed? In this scenario, isLoading will be false.

In fact, this is the exact scenario we find ourselves in.

#### Query stages when it's conditionlly enabled:

```
stages      | Initial   | Enabled   | Executed successfully
------------------------------------------------------------
enabled     | false     | true      | true
status      | pending   | pending   | success
fetchStatus | idle      | fetching  | idle
data        | undefined | undefined | defined
isLoading   | false     | true      | false
-------------------------------------------------------------
```

Dealing with these sort of logical brain teasers is always a little tricky, so here's some code that represents exactly what is going on in our app to help.

```js
const data = undefined // There's no data in the cache
const status = 'pending' // There's no data in the cache
const fetchStatus = 'idle' // The queryFn isn't currently being executed
const isLoading = status === 'pending' && fetchStatus === 'fetching' // false

if (isLoading) {
  return <div>...</div>
}

if (status === 'error') {
  return <div>There was an error fetching the issues</div>
}

// 1st issue: if status === pending & fetchStatus is idle (isLoading false), data is undefined
// 2nd issue: the API returns no data
return (
  <p>
    <ul>
      {data.items.map((issue) => (
        <li key={issue.id}>{issue.title}</li>
      ))}
    </ul>
  </p>
)
```

Can you see the issue now?

There are two scenarios we're not accounting for, and they're both represented by the code above. First is the scenario where our queryFn is not enabled because we don't have a search term and second is the scenario where our API request returns no data.

The solution to both is to **never assume we have data without explicitly checking if the status of the query is success**. Again, a status of success means there is data in the cache.

```js
function useIssues(search) {
  return useQuery({
    queryKey: ['issues', search],
    queryFn: () => fetchIssues(search),
    enabled: search !== '',
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

  // This is another return case, when the query is not enabled (no search query)
  return <div>Please enter a search term</div>
}
```

By explicitly checking the status of the query for success, we can be confident that there is data in the cache that we can safely access.

And one last time for those of you who get a little twisted up with logical puzzles like this (myself included), here's our IssueList component with comments to help cement what exactly is going on.

```js
function IssueList({ search }) {
  const { data, status, isLoading } = useIssues(search)

  if (isLoading) {
    // there is no data in the cache (isPending)
    // AND the queryFn is currently being executed (isFetching)
    return <div>...</div>
  }

  if (status === 'error') {
    // there was an error fetching the data to put in the cache
    return <div>There was an error fetching the issues</div>
  }

  if (status === 'success') {
    // there is data in the cache
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

  // otherwise
  return <div>Please enter a search term</div>
}
```

### For TypeScript Users

The `enabled` option does not perform any type narrowing on its own. Here, we'll get a type error trying to call `fetchIssue` because we're trying to assign `number | undefined` where `number` is expected:

```ts
import { useQuery } from '@tanstack/react-query'

declare function fetchIssue(id: number): Promise

function useIssue(id: number | undefined) {
  return useQuery({
    queryKey: ['issues', id],
    queryFn: () => fetchIssue(id),
    enabled: id !== undefined,
  })
}
```

If we don't want to use the `bang operator`, we can pass a `skipToken` that we can import from React Query instead of the QueryFunction:

```ts
import { skipToken, useQuery } from '@tanstack/react-query'

declare function fetchIssue(id: number): Promise

function useIssue(id: number | undefined) {
  return useQuery({
    queryKey: ['issues', id],
    queryFn: id === undefined ? skipToken : () => fetchIssue(id),
  })
}
```

When React Query sees the `skipToken`, it will internally set `enabled: false`. However, TypeScript will now correctly narrow the type of `id` to `number` in the queryFn because of the conditional check.

You can see all variations in this [TypeScript playground](https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAbzgVwM4FMCKz1QJ5wC+cAZlBCHAOQACMAhgHaoMDGA1gPRTr2swBaAI458VALAAoKTDxh0cAJKpUOOAF5EcYABMAXHEbIQAI1wAaODvSpWUYGBjAIjAy3uMA5kSlTrrABt6HlJkRn5nRlJ0GFYAC2VVdAAKXQMjU1wASgMABXIQYAwAHkScAD5fSRIwiJcUDDL0AHVgGDiAUShyKFT9Q2MzKDgAHxRGaxJgRnQdLMQpODgeGGQoKLQsUTxkhEWluBFcPABpdDwDAG0qIqSqS10AXXN9pc5OODpUAXQAD3l+D9utA4ABBKCeYzoRjwCAkOCyeTUDJDUbjSbTWZUbSoQwQeD0FTATyMegmAIKGAQOBgYL0EAxXBwOEIuQKKgo3BUAB0r0O2wAYq44Ml5upytFYgkVDg+lkXpIDnBoWSKf1dHAAITqTRhDEzHQKpaELJSQhVGrhJz1TZNVrtAByEAdyACAVBKlw1sYfXSgyZYz16CmBvme0Vyxiaw2GGwx12fKO+DOFzg11uOHu2h0z0TguFoo0EpIMXiTT6mvlfJV5NmBg12t1E2DmMN+xNZottW9DXQdranX+AWArDaAGE4ugOL6BplhoHmyHZmH9ito724-gExGlknTucrjcZegs08jQc90KDIXxdmNDr0S2DXylQB+OD5ChFdDcngAKynGBkhmAB3OAuh6ZIACJpgAN3oYcdGzKCslNHclTgAwSylctdCrdCazVeskMbR8lzbCMO0kQggA).

### Another pattern - conditionally rendered component

Now this isn't always possible, but there is another pattern you could follow when you need to fetch data on demand, that doesn't involve the enabled property at all.

In fact, this is just a React pattern and has nothing to do with React Query.

You can simply put all the query logic into a component, and then conditionally render that component however you'd like.

```js
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import Search from './Search'
import { fetchIssues } from './api'

function useIssues(search) {
  return useQuery({
    queryKey: ['issues', search],
    queryFn: () => fetchIssues(search),
  })
}

function IssueList({ search }) {
  const { data, status } = useIssues(search)

  if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return <div>There was an error fetching the issues</div>
  }

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

export default function App() {
  const [search, setSearch] = React.useState('')

  return (
    <div>
      <Search onSubmit={(s) => setSearch(s)} />
      {search ? (
        <IssueList search={search} />
      ) : (
        <div>Please enter a search term</div>
      )}
    </div>
  )
}
```

Notice that our app behaves the same, and we could get rid of the `enabled` flag as well as the `isLoading` and `success` checks in our `IssueList` component.

Regardless of which option you choose, understanding how to fetch data on demand is a powerful tool to have in your React Query toolbox.
