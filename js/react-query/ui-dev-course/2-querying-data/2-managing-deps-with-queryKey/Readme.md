# Imperative vs declarative query

There comes a time in every course where you have to take the leap from the contrived, comfortable lands of tutorial based code to the untamed jungles of the real-world. The best courses are the ones that make this transition feel effortless. Consider this your first step into the jungle.

At this point, you should feel comfortable using useQuery to manage asynchronous state that comes from a static endpoint.

```js
function useRepos() {
  return useQuery({
    queryKey: ['repos'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.github.com/orgs/TanStack/repos'
      )

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`)
      }

      return response.json()
    },
  })
```

Unfortunately, the real world is not so static. In fact, static endpoints are usually the exception, not the norm.

Specifically with the Github API we've been using, you're able to tell it how to sort the results it gives back to you. The way you do this is by passing it a sort parameter which can be either created, updated, pushed, or full_name.

```js
fetch('https://api.github.com/orgs/TanStack/repos?sort=created')
```

So with that in mind, how would you go about updating the useRepos hook to accept a sort parameter that it could then pass along as the URL to fetch?

Your first instinct is to probably do something like this.

```js
function useRepos(sort) {
  return useQuery({
    queryKey: ['repos'],
    queryFn: async () => {
      const response = await fetch(
        `https://api.github.com/orgs/TanStack/repos?sort=${sort}`
      )

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`)
      }

      return response.json()
    },
  })
}
```

Unfortunately, this won't work. And before I tell you why, I want you to take a moment and try to think it through for yourself. That's because the `queryKey` is static, and not depending on the `sort`. So the wrong cache data will be returned when the `sort` changes.

Odds are, you might wrongly assume that React Query will re-run the queryFn whenever the component re-renders. That's not how it works.

In hindsight, this should be quite obvious. A component can re-render for a variety of reasons, and we don't want to refetch whenever that happens.

Now you could do something like this, where you tell React Query to refetch the data whenever the sort changes.

```js
const { data, status, refetch } = useRepos(selection)

...js
onChange={(event) => {
  const sort = event.target.value
  setSelection(sort)
  refetch()
}}
```

But this is an _imperative_ solution to the problem, and in the world of React, the _declarative_ solution is king.

So how do we solve this declaratively?

Thankfully, the solution is fairly simple and it has to do with something you're already familiar with - the `queryKey`.

> Whenever a value in the `queryKey` array changes, React Query will re-run the `queryFn`. What that means is that anything you use inside of the `queryFn` should also be included in the `queryKey` array.

### Wait a minute

Now I know what you're thinking – that sounds awfully similar to `useEffect`'s dependency array, and you already convinced me previously that useEffect's dependency array is bad.

Fair, but the `queryKey` doesn't have many of the drawbacks that useEffect has.

In particular, you don't have to worry about things in the queryKey being "referentially stable". You can put Arrays and Objects in there, and React Query will hash them deterministically.

The only requirement is that the `queryKey` is JSON serializable. If you want to use a _Map_ or _Set_, you would need to provide your own `queryKeyHashFn`.

## Declare the dependency with queryKey

So with this in mind, let's update our queryKey now to include the sort parameter.

```js
function useRepos(sort) {
  return useQuery({
    // use an object in case there will be more query params
    queryKey: ['repos', { sort }],
    queryFn: async () => {
      const response = await fetch(
        `https://api.github.com/orgs/TanStack/repos?sort=${sort}`
      )

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`)
      }

      return response.json()
    },
  })
}
```

But perhaps the more interesting question here is how does this work under the hood?

As you know, `queryKeys` directly correspond to entries in the cache. After all, they are the key of our cache's Map.

**When a value in the _queryKey_ array changes, something interesting happens – our observer changes what it's observing.**

It goes from being subscribed to one key to another:

```diff
- ['repos', { sort: 'created' }]
+ ['repos', { sort: 'updated' }]
```

This is what makes the `queryKey` so powerful.

By storing data by its dependencies, React Query makes sure that fetches with different parameters will never overwrite each other. Instead, they are cached independently alongside each other under different keys, so that you get constant time lookups when switching between them.

After all, that is mostly what caching is about: being able to deliver data that we have previously fetched as quickly as possible. And conveniently, this is also what allows us to trigger automatic fetches if a value in the `queryKey` changes.

It's also the reason why React Query doesn't suffer from race conditions - it's all handled for you.

**The only thing you need to make sure of, is to include every value that you use inside the queryFn, in the queryKey array.**

Of course, doing this manually can become error prone if more parameters are added over time. That's why React Query also comes with its own eslint-plugin that can help you catch those human mistakes.

```json
@tanstack/eslint-plugin-query
```

Once installed, you'll get a nice error message if you try to use something inside the queryFn that is not part of the queryKey, and it'll even offer suggestions for fixing the problem.

Example:

```bash
ESLint: The following dependencies are missing in your queryKey: sort(@tanstack/query/exhaustive-deps)
```
