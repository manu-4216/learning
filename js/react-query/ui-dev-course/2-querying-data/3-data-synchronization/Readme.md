# Title

If you've been developing software for any amount of time, you've undoubtedly heard this famous quote by Phil Karlton:

"There are only two hard things in Computer Science: cache invalidation and naming things."

Notice that it's not caching that's hard – after all, we've seen how simple it is to stick things inside of a Map. Instead, it's the invalidation of that cache that's the tricky part.

So how exactly does React Query handle this complexity? From a high level, it simply tries to keep the data we see on our screen, which is a representation of the state of the server at the time when the data was fetched, as up-to-date as possible.

**Unfortunately, as you know, server state is a living thing. It can change at any time and for many reasons. So in a way, you can think of React Query as a data synchronization tool.**

As an example, let's think about a Bug Tracking web app.

In this scenario, you're usually not the only developer filing or closing issues - it's a highly collaborative environment. Yet, at the same time, it's common for users of a web app like this to keep their browser session open for long durations at a time.

So if you've opened the app when you started working in the morning, and then came back to it after a few hours of focus time, what are the odds that the state on the client will match the state on the server? They're probably close to zero.

To solve this, we need to decide when values in the cache should become invalidated – meaning, the cache should resync with the server state.

The default configuration for most caches is to have the cache invalidate after a certain period of time. We can see this in action whenever we use the Github API by looking at the responses `cache-control` header.

```bash
cache-control: public, max-age=60
```

This header instructs the browser to not make any further requests to the same url within the next `60` seconds. Instead, it will serve the resource from the browser's cache.

**The problem, as we've seen, is React Query doesn't make the request and therefore, it doesn't know about the `cache-control` header. Thankfully, React Query has a similar concept that it calls `staleTime`.**

In React Query terms, **stale** is the opposite of **fresh**. As long as a query is considered _fresh_, data will **only** be delivered from the cache. And _staleTime_ is what defines the time (in milliseconds) until a query is considered _stale_.

So, for example, if we set our `staleTime` in React Query to 60 seconds, we'd get similar behavior in that our `queryFn` would not be executed within that time frame.

So knowing that, the next question one typically has is what is the default `staleTime`.

Believe it or not, the answer is `0`.

Yes, zero as in zero milliseconds. This might be quite surprising, because it means every query is instantly considered **stale**.

The docs define this as _"aggressive but sane defaults"_.

Aggressive, because it means we might be refetching from the server more often than we need to, but sane because fetching too often is the _lesser evil_ of the two options.

It's a bit like re-renders in React. Yes, we all want to minimize our application's re-renders, but having too many is significantly better than having too little where your view could be out of sync with your application's state.

Also, if the default value weren't 0, what would be a better default? 20 seconds? 30? 1 minute? It's one of those cases that you can't reliably set up for every possible situation. The answer is always **it depends**.

Specifically, it depends on the resource in question: How often is it updated? How accurate does the data displayed on your screen need to be? How collaborative is the environment you're working in?

The answer to these questions should be decided by developers on a case by case basis.

If we fetch a Twitter (X 🫥) post with all its likes and comments, it's likely stale pretty fast. On the other hand, if we fetch exchange rates that update on a daily basis, well, our data is going to be quite accurate for some time even without refetching.

So with all this in mind, React Query defaults to trying to keep our data as up-to-date as possible by just assuming that any data it fetches is already instantly outdated. Of course, if you don't agree with that, _staleTime_ is easily customizable.

```js
useQuery({
  queryKey: ['repos', { sort }],
  queryFn: () => fetchRepos(sort),
  staleTime: 5 * 1000, // 5,000 ms or 5 seconds
})
```

By passing a staleTime of 5000 to useQuery, we tell React Query to not make the query stale until the data is older than 5 seconds.

Naturally, this brings up another question: what happens when a query does become **stale**?

The answer, again, may be quite surprising: _nothing_.

All a stale query does is instruct React Query to update the cache in the background when appropriate.

We can see this in action by looking at the differences between these two visuals, the first showing what happens when isStale is false, and the second when it's true.

```
visuals here
```

In both visuals, the data is being delivered straight from the cache. However, in the second one where the query is stale, after delivering the data, React Query resynchronizes in the background and updates the cache.

Now React Query didn't invent this caching strategy, it's known as _Stale While Revalidate_, but what makes it so powerful is that it allows React Query to optimize for the UX of the application by updating the UI instantly, while also keeping the data up-to-date in the background.

The principle is that **stale** data is better than **no** data.

This does bring up one final question though: how exactly does React Query know when to refetch the data and update the cache? Earlier I mentioned it does so "when appropriate", but that's not particularly helpful.

There are four scenarios (or _"triggers"_) when this happens, and you've already seen the first one.

1. The queryKey changes
   This is the trigger we see in the example above when the sort changes. If a queryKey changes and the query is stale, React Query will refetch the data and update the cache.

2. A new observer mounts
   Observers are created by useQuery, so every time we have a new component that mounts on the screen (like when a user opens a dialog or when they navigate to a different screen in our SPA), if the query is stale, React Query will refetch the data and update the cache.

3. The window receives a focus event
   This is one of the triggers that helps React Query provide a nice user experience out of the box. Whenever a user switches back to the tab where our application is running, if the query is stale, React Query will refetch the data and update the cache.

4. The device goes online
   This is another example of React Query providing a delightful user experience out of the box. If a device goes offline and then reconnects (👋 you subway users), if the query is stale, React Query will refetch the data and update the cache.

### Customizing Triggers

Of course, if you think you're smarter than the defaults, you're more than welcome to turn them off when you create your query.

```js
useQuery({
  queryKey: ['repos', { sort }],
  queryFn: () => fetchRepos(sort),
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
})
```

However, if you're just wanting to be more conservative with your refetches, the better option is to just increase your staleTime.

And if you're really worried (and confident the data will never change), you can even make cached data **fresh** forever by setting _staleTime_ to _Infinity_:

```js
useQuery({
  queryKey: ['repos', { sort }],
  queryFn: () => fetchRepos(sort),
  staleTime: Infinity,
})
```

Just remember that whatever happens in terms of refetching does not at all influence how data is delivered from the cache. React Query will always deliver the data from the cache if it exists, even if that data is no longer fresh.

`staleTime` just tells React Query when to update the cache in the background when a trigger occurs.

And since it may be the most important React Query concept to understand, here's a quick recap:

1. React Query will always give us cached data instantly, even if it's not fresh.

2. By default, all queries are instantly considered stale since staleTime defaults to 0.

3. If a query is stale, React Query will refetch the data and update the cache when a trigger occurs(queryKey change, new observer mounts, window focus, device goes online). NOTE: Does this trigger a re-render ? See bellow.

4. You can disable any trigger, but it's often better to think about how long a resource should be considered fresh and configure that as staleTime.

NOTE: If a query is stale, and a trigger happens, the component re-renders "if it needs to". This is a fuzzy term because there are lots of optimizations under the hood (that we are covering in a later lesson). If the refetch yields no difference in data and you are not using any meta information like `isFetching` or `dataUpdatedAt` in your component, it will not re-render.
