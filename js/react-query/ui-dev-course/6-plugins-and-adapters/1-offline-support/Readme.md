# Offline Support

No matter how many times I've done it, there's always something a little magical about fetching data over the network. It's a subtle reminder that the web is just a network of computers, and that humans figured out a way to make them talk.

Of course, as most things that humans touch, this communication isn't always perfect. Sometimes, the network connection is fast, sometimes it's slow, and sometimes it's not there at all.

To make it worse, with the `fetch` API, if you tried to fetch data while being offline, you'd get a fairly vague network error like this:

```diff
-Uncaught TypeError: Failed to fetch
```

And worse, by default, the `fetch` API won't retry the request when the device comes back online.

Though React Query isn't a data fetching library, it does ease a lot of the common pain points around fetching data – including offline support.

In the scenario of an offline device, React Query will mark the `fetchStatus` of the query as `paused`, without even attempting to execute the `queryFn`. Then, if and when the device comes back online, React Query will automatically resume the query as normal.

We can see this in action with this app.

Whenever the device is offline, we'll display an offline indicator in the top right hand corner of the UI.

_Note: To more easily simulate being offline, you can toggle the Wifi icon inside of the React Query devtools. Also, to give you the ability to toggle your network settings before the app loads, I've put loading the app behind a toggle button._

```js
import * as React from "react"
import { useQuery } from '@tanstack/react-query'
import { fetchRepos } from './api'
import { RiWifiOffLine } from "react-icons/ri"

function useRepos() {
  return useQuery({
    queryKey: ['repos'],
    queryFn: fetchRepos,
  })
}

function Offline() {
  return <RiWifiOffLine size={25} color="var(--red)"/>
}

function Repos() {
  const { data, status, fetchStatus } = useRepos()
  const offline = fetchStatus === "paused"

  if (status === 'pending') {
    return (
      <>
        <div>...</div>
        { offline && <Offline/> }
      </>
    )
  }

  if (status === 'error') {
    return <div>There was an error fetching the repos</div>
  }

  return (
    <>
      <ul>
        { data.map(repo => <li key={repo.id}>{repo.full_name}</li>) }
      </ul>
      { offline && <Offline/> }
    </>
  )
}

export default function App() {
  const [show, setShow] = React.useState(false)

  return (
    <div className="container">
      <button className="button" onClick={() => setShow(!show)}>
        {show ? 'Hide App' : 'Load App'}
      </button>
      { show ? <Repos /> : null }
    </div>
  )
}
```

And if you were to log the query after going offline, you'd see this.

```js
{
  "status": "pending",
  "data": undefined,
  "fetchStatus": "paused"
}
```

As you know, the `status` gives us information about the data in the cache at the `queryKey`, and the `fetchStatus` gives us information about the `queryFn`.

Because the status is `pending`, we know that there's no data in the cache. And because the `fetchStatus` is `paused`, we also know that the device is offline and React Query didn't attempt to execute the `queryFn`.

!!!This is another reason why you want to use `isPending` for showing or hiding a loading indicator instead of `isLoading`. Remember, `isLoading` is derived from the status and `fetchStatus` properties.

```js
const isLoading = status === 'pending' && fetchStatus === 'fetching'
```

In the scenario where a device goes offline, `fetchStatus` will be _paused_ and therefore, `isLoading` will be `false` even though we don't have any data.

Now here's a question for you. How do you think our app behaves if we go offline _after_ data has already been fetched and added to the cache?

Try it for yourself.

As you probably guessed, going offline does _not_ clear the cache.

This means that if a device goes offline after data has already been fetched and added to the cache, the user will still be able to see the data that was fetched before they went offline. Then, if the device regains connectivity, React Query will automatically attempt to re-fetch the data and update the cache.

Now, as always with React Query, there are ways to customize how it behaves when a device goes offline and you can do so via its `networkMode` option.

The default value of `networkMode` is `online`, which as you've seen, tells React Query to "pause" the query and not attempt to execute the `queryFn`.

This is a reasonable default, but it doesn't work in every scenario.

For example, what if we had a query that doesn't need a network connection to work? Take this simple one from one of the very first lessons in the course:

```js
const { data } = useQuery({
  queryKey: ['luckyNumber'],
  queryFn: () => Promise.resolve(7),
})
```

There's no reason to pause a query like this just because the device is offline.

In these scenarios, you can set the `networkMode` to `always` which will tell React Query to _always_ execute the `queryFn`, regardless of the network status.

When you do, `refetchOnReconnect` will automatically be set to `false` since regaining the network connection is no longer a good indicator that stale queries should be refetched.

Another option is to set `networkMode` to `offlineFirst`. In this mode, the first request is always fired, and then potential retries are paused if the initial request failed because of a missing network connection.

__When would this mode be a good choice? Every time you have an additional caching layer in between your API and React Query. A good example of this is the browser cache itself.__

If we take a look at a request made to the GitHub API in our browser devtools, we can see that it responds with the following Response Header:

```bash
cache-control: public, max-age=60, s-maxage=60
```

This header will instruct the browser to cache the response for 60 seconds, which means that every subsequent request within that time period that React Query makes will not actually hit the GitHub API, but will instead be served from the browser's cache.

Source         |  Initial   |  2nd fetch
--------------------------------------------------
DATA           | ['repos']   | ['repos']
BROWSER CACHE  | -           | ['repos']
QUERY CACHE    | ['repos']   | ['repos']
COMPONENT TREE | OBSERVER    | -

Reading from the browser cache is not only extremely fast, it also works while we are offline! However, with React Query's default `networkMode` of online, because all requests are paused when the device is offline, we can't take advantage of it.

This is where setting the `networkMode` to `offlineFirst` can help us out.

With `offlineFirst`, if a request has been made and stored in the browser's cache before the device goes offline, React Query will still invoke the `queryFn`, which will call fetch, getting data from the browser's cache and returning it to React Query. If there's no data in the browser's cache, React Query will pause the query and wait until the device regains connectivity to try again.

We can see this in action with the following app.

After the app loads, open up the browser's devtools, go to the Network tab and set your network to `Offline`. From there, select the _[repos]_ query in the Query devtools and then click on `Reset`.

What you'll see is that for 60 seconds, any time you click on _Reset_, the `queryFn` will run, getting the data from the browser's _disk_ cache and returning it to React Query. After 60 seconds, if you click _Reset_, the browser cache will have expired and the `queryFn` will pause, waiting for the device to regain connectivity to run again.

🚨 Don't Disable Browser Cache
_If you're not seeing the behavior described above, it's likely because you've disabled your browser's cache._

_To change it, head back to the Network tab in your browser's devtools and make sure that Disable cache is unchecked._

Now dealing with offline support when it comes to fetching data isn't terribly difficult, and React Query's default behavior is usually good enough most of the time. However, things get a little more complicated when we start talking about __mutations__.

Because mutations have side effects on the server, unlike queries, we have to be a little more deliberate with how we handle them when the device reconnects.

Thankfully, React Query's default strategy for this scenario does a lot of the heavy lifting for us.

When mutations occur when a device is offline, React Query will keep track of them in a __queue__. Then, once the device goes back online, it will unload the queue of mutations in the exact same order that they occurred, in __parallel__.

We can see this in action by taking another look at the app we built in the Optimistic Updates lesson.

If you haven't already, toggle the network in the Query devtools, interact with the app, then toggle the network again to turn it back on. For the most part, you'll see that the app behaves pretty well.

The reason this works so well is because `onMutate`, which writes to the cache, is called before the mutation gets paused. Once we go online again, we can see that each checkbox changes states one by one - in the order in which they ocurred.

There is one change we could make to make it even better though. Can you spot it?

Right now, once finished, every mutation calls `queryClient.invalidateQueries`. This was fine before, but now we have a scenario where multiple mutations will all affect the same entity. The result, as we can clearly see, is an eventually consistent UI – but those in-between invalidations show us an intermediate server state that causes the UI to jump a bit.

Instead, it would be ideal if when the app reconnected, it only invalidated the query _once_, at the very end of the mutation chain.

To do this, we need to get a little clever.

First, inside of `onSettled` (which will run when all the other callbacks have finished running), let's only `invalidate` the query if there are no other mutations going on at the moment. This way we can get rid of those in-between invalidations that cause the UI to jump.

To do this, we can use `queryClient`'s `isMutating` API. The way it works is it returns an integer representing how many mutations, if any, are currently happening.

Of course, we only want to invalidate our query if there is 1 mutation happening – our own.

```diff
 onSettled: () => {
+  if (queryClient.isMutating() === 1) {
     return queryClient.invalidateQueries({ queryKey: ['todos', 'list'] })
+  }
 }, 
```
But wouldn't this cause problems if we had other, unrelated mutations happening at the same time? Yes, it would. So instead of just checking if there are no other mutations happening, what we really want to do is check if there are no other mutations happening that affect todo lists.

Luckily, React Query allows us to __tag__ our mutations with a `mutationKey` and pass them as a filter to `isMutating`. This is pretty similar to passing a `queryKey` to a Query, except that it's optional:

```diff
 onSettled: () => {
+  if (queryClient.isMutating({ mutationKey: ['todos', 'list'] }) === 1) {
     return queryClient.invalidateQueries({ queryKey: ['todos', 'list'] })
+  }
 },
```

And if we throw this into our app, notice how the UI no longer jumps when you go back online.

Much better!

By only invalidating the query if there are no other mutations happening that affect todo lists, we've been able to get rid of that jump in the UI while still keeping the app consistent with the server when it comes back online.

## 🛜 networkMode and Mutations
What's cool about `networkMode` is that it's not just for queries, but also mutations.

The reason our app works the way it does is because the default `networkMode` for mutations, like queries, is `online`. This means that when the device is offline and a mutation is made, React Query will "pause" the mutation and add it to a queue.

Just like with queries, if you want to change this behavior, you can do so via `networkMode`.