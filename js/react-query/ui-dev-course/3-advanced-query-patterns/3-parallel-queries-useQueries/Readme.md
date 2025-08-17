At this point, you've seen various examples of how useQuery creates a simple abstraction over managing asynchronous state. However, all of those examples had one thing in common – they all fetched a _single_ resource.

In the contrived world of carefully crafted tutorials, this is fine. But in the real world, you're almost never fetching just a single resource.

Any serious application will likely have multiple queries happening in parallel, and an obvious principle of web development is that:

> **The more you can do in parallel, the better.**

For example, suppose we were creating an overview Dashboard of our GitHub org. Next to displaying all repos, we also want to display all members of that org.

Those two resources have nothing to do with each other. They're not dependent, and there's no need to wait for one request to resolve before starting the other.

In this scenario, you'd want to run them both in _parallel_ so that you can show the data to the user as quickly as possible.

PARALLEL QUERIES

        ***/repos**********************************************
        ***/members****************

time ---/mount--------------------/render members------------/render repos----->

React Query has a bunch of ways to accomplish this, the simplest being to just call useQuery multiple times:

```js
function useRepos() {
  return useQuery({
    queryKey: ['repos'],
    queryFn: fetchRepos,
  })
}

function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: fetchMembers,
  })
}
```

Now when we call these custom hooks, React Query will trigger the fetches simultaneously and data will be displayed as soon as it's available, regardless of which query resolves first.

```js
export default function App() {
  // invoke the 2 hooks, and they will be processed in parallel
  const repos = useRepos()
  const members = useMembers()

  return (
    <div>
      <h1>TanStack Dashboard</h1>
      <h2>Repos</h2>
      {repos.isPending ? <p>Loading repos...</p> : null}
      {repos.isError ? <p>Error loading repos: {repos.error.message}</p> : null}
      {repos.isSuccess ? (
        <ul>
          {repos.data.map((repo) => (
            <li key={repo.id}>{repo.name}</li>
          ))}
        </ul>
      ) : null}

      <hr />

      <h2>Members</h2>
      {members.isPending ? <p>Loading members...</p> : null}
      {members.isError ? (
        <p>Error loading members: {members.error.message}</p>
      ) : null}
      {members.isSuccess ? (
        <ul>
          {members.data.map((member) => (
            <li key={member.id}>{member.login}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
```

With this approach, we have two separate parts of the UI, each making its own query.

This works, but as is, our app has the traditional SPA like behavior of showing loading indicators across multiple parts of the UI, all of which will get replaced with data at different times. If you're not careful, this could lead to some jarring, layout shifting behavior.

If that's not necessary (or desired) and you'd rather wait until all the queries are done before rendering any of the UI, you have a few different options.

First, as you've seen before when we discussed dependent queries, you could combine the multiple fetch requests into a single query with the help of `Promise.all`.

```js
function useReposAndMembers() {
  return useQuery({
    queryKey: ['reposAndMembers'],
    queryFn: () => {
      return Promise.all([fetchRepos(), fetchMembers()])
    },
  })
}
```

Now you'd have a consolidated loading state, error state, and data for both resources – making it easier to show a unified UI.

However, again as we saw in the dependent queries lesson, this approach has some downsides.

1. repos and members will always fetch and refetch together
2. repos and members will always error together
3. We can't re-use repos or members separately in other parts of our app

Even though they have no correlation, we've cached and therefore coupled our two resources together. It works, and it's arguably easier to manage, but it comes at the cost of flexibility.

If you think about it, what we really want here is the ability to cache the resources separately, but still call them together in a unified hook. That combination would give us the best of both worlds.

This is essentially what the `useQueries` hook does.

You pass it an array of queries, and similar to `Promise.all`, it will run them in parallel and return an array of results where the order of the elements is the same as the order of the `queries`.

```js
function useReposAndMembers() {
  return useQueries({
    queries: [
      {
        queryKey: ['repos'],
        queryFn: fetchRepos,
      },
      {
        queryKey: ['members'],
        queryFn: fetchMembers,
      }
    ]
  })
}

...

const [repos, members] = useReposAndMembers()
```

This gives you the flexibility of caching repos and members separately, with the convenience of a single hook.

And with the Power of JavaScript™, you can easily derive any value you need from the array.

For example, if you wanted to show a loading indicator while any of the queries were still fetching, you could derive that value like this.

```js
const queries = useReposAndMembers()

const areAnyPending = queries.some((query) => query.status === 'pending')
```

Or if you only wanted to show a loading indicator while **all** of the queries were still fetching, you could derive that one like this.

```js
const queries = useReposAndMembers()

const isAnyPending = queries.every((query) => query.status === 'pending')
```

Regardless, you have the ability to inspect each query individually, while also being able to look at all of the queries as a whole.

## Sharing Query Options

**Query Options** is the object that you pass to hooks like `useQuery` or `useQueries`. They always consist of `queryKey` and `queryFn`, but might have many more properties like `staleTime` or `gcTime`.

To make them sharable between different hooks, it's usually a good idea to separate them into constants, and then import them where needed:

```js
export const repoOptions = {
  queryKey: ['repos'],
  queryFn: fetchRepos,
}

export const membersOptions = {
  queryKey: ['members'],
  queryFn: fetchMembers,
}

// use these alone in individual `useQuery`
const useRepos = () => useQuery(repoOptions)
const useMembers = () => useQuery(membersOptions)

// or/and use these inside `useQueries`
const useReposAndMembers = () =>
  useQueries({
    queries: [repoOptions, membersOptions],
  })
```

Perhaps the best part about the useQueries hook that we haven't talked about yet is that the array of queries you pass to it can be _dynamic_.

What that enables is the ability to create an arbitrary number of queries based on some input.

For example, let's say you wanted to fetch all the issues for all the repos in your org. Here's how you could approach it.

1. Get the repos with a `useRepos` hook

```js
function useRepos() {
  return useQuery({
    queryKey: ['repos'],
    queryFn: fetchRepos,
  })
}
```

2. Get the issues of every repo with a `useIssues` hook

This one is a little more involved.

First, we're going to want to have `useIssues` accept an array of repos as its only argument.

```js
function useIssues(repos) {
  //...
}
```

Next, we can invoke useQueries, mapping over repos to create our queries array.

```js
function useIssues(repos) {
  return useQueries({
    queries: repos?.map((repo) => ({
      // ...
    })),
  })
}
```

For the `queryKey`, let's use a key that represents the entry in the cache – `repos/${repo.name}/issues`.

```js
function useIssues(repos) {
  return useQueries({
    queries: repos?.map((repo) => ({
      queryKey: ['repos', repo.name, 'issues'],
    })),
  })
}
```

For the `queryFn`, we'll want to fetch all of the issues for the repo we're currently iterating over and return them to be put in the cache.

```js
function useIssues(repos) {
  return useQueries({
    queries: repos?.map((repo) => ({
      queryKey: ['repos', repo.name, 'issues'],
      queryFn: async () => {
        const issues = await fetchIssues(repo.name)
        // change the data to also include the repo name. This is used later on
        return { repo: repo.name, issues }
      },
    })),
  })
}
```

The last thing we'll want to do is make sure that if `repos` is `undefined` (which it will be while the query is `pending`), that our queries property is still an empty array.

There are a few ways we could do this, the simplest being with JavaScript's nullish coalescing operator. Or `||`.

```js
function useIssues(repos) {
  return useQueries({
    queries:
      repos?.map((repo) => ({
        queryKey: ['repos', repo.name, 'issues'],
        queryFn: async () => {
          const issues = await fetchIssues(repo.name)
          return { repo: repo.name, issues }
        },
      })) ?? [],
  })
}
```

Now, for every `repo` inside of our `repos` array, we're creating a new query that fetches the issues for that `repo` and updates the cache. So we will have:

- 1 query for fetching all the repos (length n)
- n queries, one for each repo, to fetch all the issues of that repo

This is what makes `useQueries` so powerful – it allows us to dynamically create an arbitrary number of queries (n repos), all in parallel.

NOTE: you can do the same with `Promise.all` inside `useQuery` -> `queryFn`, but then you won't have access to the individual results as they come.

And if we throw our hooks into a real app, we can see them in action.

```js
import { useQuery, useQueries } from '@tanstack/react-query'
import { fetchRepos, fetchIssues } from './api'

function useRepos() {
  return useQuery({
    queryKey: ['repos'],
    queryFn: fetchRepos,
  })
}

function useIssues(repos) {
  return useQueries({
    queries:
      repos?.map((repo) => ({
        queryKey: ['repos', repo.name, 'issues'],
        queryFn: async () => {
          const issues = await fetchIssues(repo.name)
          return { repo: repo.name, issues }
        },
      })) ?? [],
  })
}

export default function App() {
  const repos = useRepos()
  const issues = useIssues(repos.data) // Note: repos.data can be undefined

  return (
    <div>
      <h1>TanStack Dashboard</h1>
      <h2>Repos</h2>
      {repos.isPending ? <p>Loading repos...</p> : null}
      {repos.isError ? <p>Error loading repos: {repos.error.message}</p> : null}
      {repos.isSuccess ? (
        <ul>
          {repos.data.map((repo) => {
            const repoIssues = issues.find(
              (query) => query.data?.repo === repo.name
            )

            const length = repoIssues?.data.issues.length

            return (
              <li key={repo.id}>
                {repo.name}
                {repoIssues
                  ? ` (${length === 30 ? '30+' : length} issues)`
                  : null}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
```

Without `useQueries`, the only other way to achieve this would be to render a separate component for each repo, and then fetch the issues inside of it.

```js
export default function App() {
  const repos = useRepos()

  return (
    <div>
      <h1>TanStack Dashboard</h1>
      <h2>Repos</h2>
      {repos.isPending ? <p>Loading repos...</p> : null}
      {repos.isError ? <p>Error loading repos: {repos.error.message}</p> : null}
      {repos.isSuccess ? (
        <ul>
          {repos.data.map((repo) => {
            return (
              <li key={repo.id}>
                {repo.name}
                <RepoIssues repo={repo.name} />
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
```

This would work, but the tradeoff is if you needed to derive a value based on all the queries, you'd have a problem.

For example, say we wanted to update the UI of our app to include the _total_ number of issues across all repos.

If all you did was render a separate component for each `repo`, fetching the `issues` inside of it, it would be tricky to derive the total number of issues across all repos since the queries would be isolated.

However, if you used `useQueries` as we did initially, you'd have a couple options.

First, you could just use the Power of JavaScript™ to derive the total number of issues from the array of queries.

```js
const repos = useRepos()
const issues = useIssues(repos.data)

const totalIssues = issues
  // if data is not yet loaded, consider that issue count as 0
  .map(({ data }) => data?.issues.length ?? 0)
  .reduce((a, b) => a + b, 0)
```

Or if you prefer, `useQueries` also comes with a `combine` option that does the same thing, just built in to the `useQueries` API itself.

The way it works is you pass `combine` a function that takes the array of queries as its first argument, and whatever it returns will be what `useQueries` returns.

So for example, if we wanted to use `combine` in order to add a `totalIssues` property to the object returned from `useIssues`, we could do something like this.

```js
function useIssues(repos) {
  return useQueries({
    queries:
      repos?.map((repo) => ({
        queryKey: ['repos', repo.name, 'issues'],
        queryFn: async () => {
          const issues = await fetchIssues(repo.name)
          return { repo: repo.name, issues }
        },
      })) ?? [],
    combine: (issues) => {
      const totalIssues = issues
        .map(({ data }) => data?.issues.length ?? 0)
        .reduce((a, b) => a + b, 0)

      // return both the query result of each issues, and the
      return { issues, totalIssues }
    },
  })
}

export default function App() {
  const repos = useRepos()
  const { issues, totalIssues } = useIssues(repos.data)

    return (
      //...
    )
}
```

Another example:

```js
const result = useQueries({
  queries: [
    { queryKey: ['user'], queryFn: fetchUser },
    { queryKey: ['posts'], queryFn: fetchPosts },
  ],
  combine: (results) => {
    const [user, posts] = results
    return {
      data: {
        user: user.data,
        posts: posts.data,
      },
      isLoading: results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
    }
  },
})
```

`combine` runs once initially, then again every time one of the queries updates.(like `data`, `status` changes).

Regardless of which option you choose, the bigger point is that `useQueries` gives you the flexibility to create an arbitrary number of queries, all in parallel, and then _derive_ any value you need from all the queries as a whole.

## For TypeScript Users

The types for `useQueries` are pretty advanced. If you pass in a static Array, you'll get a tuple returned so that you can safely destructure. This should work even if each query returns a different shape. For dynamic Arrays, you'll get an Array of `QueryResult` back.

It's especially important to leverage type inference as much as possible here. Chances are that something will break if you try to specify a specific type parameter.

Have a look at this [TypeScript playground](https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAbzgVwM4FMCKz1WO1OAXzgDMoIQ4ByAARgEMA7VRgYwGsB6KdBtmAFoAjjigBPagFgAULLYQW8ANq9IqADRwQ6EACNcqALpwAvCgzZc+VAAoEsuHFHWCALjjLHTxN5-OxcQBpdHEPZWo1CFRqIw0-HxcJADEmD1sASjMAPjgABQoQYAwAOl5UCAAbADd0W2pSCAhqDPiZfyI2-wd2-wDcYNDw6h19Q1iuvqTxVPSs01yCymL0MoIq2tsARlaEzu842SIM2Vko1BKAEwZGWS4uOAA9AH5TmVGDKAvr25l7p9eciBCiUcGKqBwhHMaCwYhs9m8SRs4S2GgATBoAMxGEogBhgWzAS45OC2BI9Pr9CQhMKeajgyHULREw69fzTWak+aLQorNYVGp1Im7NnEbwZEXHN4Mgh3B4vIA) for some examples.
