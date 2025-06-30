Let's revisit some fundamental principles of React Query –

1. React Query will always give us cached data instantly, even if it's not fresh.
2. By default, all queries are instantly considered stale since staleTime defaults to 0.
3. If a query is stale, React Query will refetch the data and update the cache when a trigger occurs
4. There are four triggers: when a queryKey changes, a new Observer mounts, the window receives a focus event, and the device goes online

These principles allow React Query to provide a delightful user experience out of the box. However, there's still one scenario that these principles don't cover – fetching data at a specific point in time.

Take this scenario, say you were building an analytics dashboard for your company. More than likely, you'd want to make sure that the data is always up to date after a certain amount of time – regardless of if a "trigger" occurs.

To achieve this, you need a way to tell React Query that it should invoke the queryFn periodically at a specific interval, no matter what.

This concept is called _polling_, and you can achieve it by passing a `refetchInterval` property to `useQuery` when you invoke it.

```js
useQuery({
  queryKey: ['repos', { sort }],
  queryFn: () => fetchRepos(sort),
  refetchInterval: 5000, // 5 seconds
})
```

Now with a `refetchInterval` of 5000, the `queryFn` will get invoked every 5 seconds, regardless of if there's a trigger or if the query still has **fresh** data.

When polling, `staleTime` is by-passed.

Because of this, `refetchInterval` is best suited for scenarios where you have data that changes often and you always want the cache to be as up to date as possible.

It's important to note that the `refetchInterval` timer is intelligent. If a traditional _trigger_ occurs and updates the cache while the timer is counting down, the timer will reset.

We can see this demonstrated in this example.

```js
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

function useUuid() {
  return useQuery({
    queryKey: ['uuid'],
    queryFn: async () => {
      const response = await fetch(`https://uuid.rocks/json`)

      if (!response.ok) {
        throw new Error('fetch failed')
      }

      return response.json()
    },
    refetchInterval: 3000, // 3 seconds
  })
}

export default function App() {
  const { data, status, fetchStatus, refetch } = useUuid()

  if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return <div>Error fetching UUID</div>
  }

  return (
    <p>
      <div>{data.uuid}</div>
      <button onClick={() => refetch()}>Refetch</button>
      <span>{fetchStatus === 'fetching' ? 'updating...' : null}</span>
    </p>
  )
}
```

By setting a `refetchInterval` of 3000, every 3 seconds, React Query triggers the queryFn, getting a new UUID.

However, if we explicitly trigger a refetch by clicking the Refetch button, then the UUID is updated and the timer resets.

Another cool aspect of `refetchInterval` is you can continue polling _until_ a certain condition is met. This comes in handy if you have an endpoint that performs an expensive task, and you want to poll _until_ that task is finished.

For example, let's take an endpoint that crunches some numbers over a distributed system. First, it might return JSON that looked like this.

```json
{
  "total": 2341,
  "finished": false
}
```

but some time later, it could look like this.

```json
{
  "total": 5723,
  "finished": true
}
```

Of course, it likely doesn't make sense to continue polling after the response tells us the computation has finished.

To accomplish this, you can pass a _function_ to `refetchInterval`. When you do, that function will accept the **query** as an argument, allowing you to inspect the query's state and determine if the interval should continue. If you return `false` from the function you pass to `refetchInterval`, then the interval will be turned off.

So again, assuming we received a JSON response like the one above with an explicit finished property, our `refetchInterval` function would look like this.

```js
useQuery({
  queryKey: ['totalAmount'],
  queryFn: () => fetchTotalAmount(),
  refetchInterval: (query) => {
    if (query.state.data?.finished) {
      return false
    }

    return 3000 // 3 seconds
  },
})
```

Now, as soon as the `data` in the cache has a `finished` property set to `true`, the polling will stop.
