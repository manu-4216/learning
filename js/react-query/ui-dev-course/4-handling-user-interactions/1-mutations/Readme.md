# Mutations

Every state manager does two things – gives you data and lets you update it.

Take `React.useState`. It returns a tuple where the first element is the state and second is a function to update that state.

```jsx
const [number, setNumber] = useState(0)
```

Of course, this is for _client_ state. We know that we can safely call `setNumber` whenever we'd like because we are the owner of the state. For all intents and purposes, we can treat this update as if it were synchronous.

But what about _asynchronous_ state updates?

In that scenario, we're not the owner of the state, so even if we were to write directly to the cache, it would just be overwritten with the next refetch.

As an example, let's say we wanted to update a user entity in our database and could do so from the frontend by sending a `PATCH` request.

```js
function updateUser({ id, newName }) {
  return fetch(`/user/${id}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: newName,
    }),
  }).then((res) => res.json())
}
```

This, of course, doesn't happen immediately - it wouldn't be async state if it did.

When we make these sorts of updates, they go through a similar lifecycle as a query would: `pending` -> `error` or `success`.

So with that, what if we just used `useQuery` to make a request to the server that performs an update? Something like this.

```js
function useUpdateUser(id, newName) {
  return useQuery({
    queryKey: ['user', id, newName],
    queryFn: () => updateUser({ id, newName }),
  })
}
```

It's an interesting idea, but there are several reasons why this wouldn't work.

For one, the query would run immediately when the component mounted. We'd likely want to wait for a specific event (like the user clicking a submit button) before we ran it. We could work around this with the `enabled` option, but even worse - queries are meant to run multiple times, often _automatically_.

Running a query (like getting a list of articles) should be an **idempotent** operation and have no side effects on the server. Meaning, React Query should be able to run a query as often as it wants, without unintended (or any) consequences.

Updates, by definition, are neither _idempotent_ nor free of side effects. Every time we perform an update, data might be written to the database, or a PDF might be generated, or an email might be sent to someone.

All these side effects are not something that we want to trigger automatically or more than once. Instead, we want them to happen _imperatively_ when a specific event occurs.

For this, React Query offers another hook called `useMutation`.

Now I'll get this out of the way, it probably doesn't work how you'd expect it to (so stick with me here).

Just as `useQuery` manages the lifecycle of a request rather than directly fetching data, `useMutation` manages the lifecycle of a mutation rather than directly performing the mutation itself.

Here's how it works.

When you invoke `useMutation`, you give it an object with a `mutationFn` method. What it gives you is an object with a `mutate` method.

```js
const { mutate } = useMutation({ mutationFn })
```

When you invoke `mutate`, React Query will take the argument you pass to it, and invoke the `mutationFn` with it.

So if we adapt our `updateUser` example from earlier to include React Query, here's how it would look.

First, we encapsulate `useMutation` inside of a custom hook – passing it `updateUser` as its `mutationFn`.

```js
function useUpdateUser() {
  return useMutation({
    mutationFn: updateUser,
  })
}
```

Then, inside of the component, we invoke `mutate` whenever the mutation event occurs. In this case, it'll be when a `form` is submitted.

The object we pass to it will be passed along to the `mutationFn` as an argument.

```jsx
function useUpdateUser() {
  return useMutation({
    mutationFn: updateUser,
  })
}

function ChangeName({ id }) {
  const { mutate } = useUpdateUser()

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const newName = new FormData(event.currentTarget).get('name')
        mutate({ id, newName })
      }}
    >
      <input name='name' />
      <button type='submit'>Update</button>
    </form>
  )
}
```

## For TypeScript Users

For types to flow through mutations correctly, it's important to type the `mutationFn`. This is the same principle as Queries, but it's easy to miss because the `mutationFn` also takes parameters.

### More details

In our example, even if `updateUser` is typed correctly:

```ts
declare function updateUser(user: {
  id: string
  newName: string
}): Promise<User>
```

our `mutationFn` input is not typed unless we make it explicit:

```ts
type Payload = { id: string; newName: string }

function useUpdateUser() {
  return useMutation({
    mutationFn: (payload: Payload) => updateUser(payload),
  })
}
```

## Return result from useMutation: status

Now I know what you're probably thinking – "it doesn't look like `useMutation` is doing much of anything. Why not just call `updateUser` directly?".

Remember, the entire point of `useMutation` is to manage the lifecycle of the mutation – not to mutate anything itself, even the cache. You won't really see the benefit of it until you look at it from that perspective – and to do that, you have to look at what it returns.

When you invoke `useMutation`, along with the `mutate` function, you'll also get back a `status` property that tells you the current state of the mutation – `pending`, `error`, `success`, or `idle` (the _default_ state of the mutation before `mutate` has been called).

So for example, if we wanted to disable the submit button while the mutation was in flight, we could do something like this.

```ts
function ChangeName({ id }) {
  const { mutate, status } = useUpdateUser()

  return (
    //...
    <button type="submit" disabled={status === "pending"}>
      { status === "pending" ? '...' : "Update" }
    </button>
  )
```

## onSuccess callback (passed to oseMutation, and mutate)

And more than just observing the `status`, we can also hook into different moments in the mutation's lifecycle by adding `onSuccess`, `onError`, or `onSettled` callbacks to both:

- the second argument to `mutate`,
  or
- as properties on the object passed to `useMutation`.

For example, we probably want to reset the form _after_ the mutation was successful. We can do that by passing an object with an _onSuccess_ callback as the second argument to _mutate_.

```tsx
const handleSubmit = (event) => {
  event.preventDefault()
  const formData = new FormData(e.target)
  const newName = formData.get('name')

  mutate(
    { id, newName },
    // 2nd argument to mutate
    {
      // run only for this mutate, so UI specific
      onSuccess: () => event.currentTarget.reset(),
    }
  )
}
```

And inside of `useMutation`, if we wanted to show an alert when the mutation was successful, we could do something like this.

```js
// run to all usages of useUpdateUser
function useUpdateUser() {
  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      alert('name updated successfully')
    },
  })
}
```

And whatever is returned from the `mutationFn` – in this case, the return value of `updateUser`, will be passed as the first argument to `onSuccess`.

So assuming that `updateUser` returns a promise that resolves with the updated user, we could do something like this.

```js
function useUpdateUser() {
  return useMutation({
    mutationFn: updateUser,
    onSuccess: (newUser) => {
      alert(`name updated to ${newUser.name}`)
    },
  })
}
```

## Updating the data after a mutation

Admittedly, this aspect of `useMutation` isn't particularly interesting. The interesting bits are when you start looking at how mutations and queries can work together.

For example, what if instead of just showing an `alert`, you wanted to actually do something useful and _update the cache_ with the new user?

The simplest way is to do it _imperatively_ by invoking `queryClient.setQueryData` in the `onSuccess` callback. `setQueryData` works as you'd expect, you give it a query key as its first argument and the new data as the second.

```js
function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (newUser) => {
      queryClient.setQueryData(['user', newUser.id], newUser)
    },
  })
}
```

Now, once the mutation has finished and the `onSuccess` callback runs, the cache will be updated with the new user.

It's important to note that React Query doesn't distinguish where data comes from. Data we write to the cache manually will be treated the same as data put into the cache via any other way – like a refetch or prefetch.

That means it will also be considered **fresh** for however long `staleTime` is set to.

### For TypeScript Users

`queryClient.setQueryData`, just like `getQueryData`, is typed to `unknown` by default because React Query cannot know what data should live under which `queryKey`.

Again, just like with `getQueryData`, this gets better if you use a key created from `queryOptions`:

```js
import { queryOptions } from '@tanstack/react-query'

const userOptions = (id: number) =>
  queryOptions({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
  })

queryClient.setQueryData(userOptions(newUser.id).queryKey, newUser)
```

## Using onSuccess 2nd argument: mutate arguments

And even if `updateUser` didn't return a promise that resolved with the updated user, we still have a few options to derive the new user in order to update the cache.

We saw that when React Query invokes `onSuccess`, the first argument it'll pass to it is whatever the `mutationFn` returns. That's nice, but in this case, it's the **second argument** that is more valuable to us.

It'll be the object that was passed to `mutate`, in our example, `{ id, newName }`.

```js
function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (dataReturnedByMutationFn, dataPassedtoMutate) => {
      const { id, newName } = dataPassedtoMutate
      //...
    },
  })
}
```

We can use this, along with the fact that if you pass a function as the second argument to `queryClient.setQueryData`, it will receive the **previous data** as an argument (if defined for that key), in order to derive the new user to update the cache.

```js
function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (dataReturnedByMutationFn, dataPassedtoMutate) => {
      const { id, newName } = dataPassedtoMutate

      queryClient.setQueryData(
        ['user', id], // or userOptions(newUser.id).queryKey,
        (previousUser) => {
          const cacheEntryAlreadyExists = Boolean(previousUser)

          if (cacheEntryAlreadyExists) {
            // NOTE: return a new object, don't mutate the old one
            return {
              ...previousUser,
              name: newName,
            }
          }

          // this is undefined if no entry is present in the cache for this key.
          // So the cache will not update
          return previousUser
        }
      )
    },
  })
}
```

Another thing to note is like most state managers in React, React Query requires updates to happen in an immutable way.

What this means is that when you update the cache, you should always return a `new` object, even if the object you're updating is the same as the previous one.

For example, you may be tempted to refactor the `setQueryData` invocation like this, where you just mutate the `previousUser` directly.

```js
//...
queryClient.setQueryData(['user', id], (previousUser) => {
  if (previousUser) {
    // incorrect
    previousUser.name = newName
  }

  // If returning undefined, React Query will bail out of the update
  // But it could also be null ??. That's why we don't return undefined directly
  return previousUser
})
```

But if you did, React Query wouldn't be able to detect the change (since the reference would stay the same) and notify any observers. Instead, you should **always return a new object**, even if it's the same as the previous one.

### For TypeScript Users

The functional updater has this form.

```ts
;(previousData: TData | undefined) => TData | undefined
```

This means you should always expect to get `undefined` passed since there's no guarantee that the Query already exists in the cache when you're updating it.

In these cases, you can just return `undefined` back and React Query will** bail out of the update**.

## Issue when multiple cache items would need to be updated

So far this has all been pretty straightforward – trigger a mutation and then update the cache imperatively when the mutation succeeds. But, it's not uncommon to have more than one cache entry you need to update when a mutation occurs.

This can happen pretty easily when we have a list with filters and sorting. Every time we change an input, React Query will create a new cache entry, which means one result might be stored multiple times, in different caches, and even in different positions (e.g. depending on the sorting criteria).

Let's look at an example which demonstrates the problem.

```jsx
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTodos, addTodo } from './api'

function useAddTodo() {
  return useMutation({
    mutationFn: addTodo,
    onSuccess: (data) => {
      console.log(JSON.stringify(data))
    },
  })
}

function useTodos(sort) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['todos', 'list', { sort }],
    queryFn: () => fetchTodos(sort),
    placeholderData: () =>
      queryClient.getQueryData(['todos', 'list', { sort }]),
    staleTime: 10 * 1000,
  })
}

export default function TodoList() {
  const [sort, setSort] = React.useState('id')
  const { status, data, isPlaceholderData, refetch } = useTodos(sort)
  const addTodo = useAddTodo()

  const handleAddTodo = (event) => {
    event.preventDefault()
    const title = new FormData(event.currentTarget).get('add')
    addTodo.mutate(title, {
      onSuccess: () => event.target.reset(),
    })
  }

  if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return <div>Error fetching todos</div>
  }

  return (
    <div style={{ opacity: isPlaceholderData ? 0.8 : 1 }}>
      <label>
        Sort by:
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value)
          }}
        >
          <option value='id'>id</option>
          <option value='title'>title</option>
          <option value='done'>completed</option>
        </select>
      </label>
      <ul>
        {data.map((todo) => (
          <li key={todo.id}>
            {todo.done ? '✅ ' : '🗒 '}
            {todo.title}
          </li>
        ))}
      </ul>
      <form
        onSubmit={handleAddTodo}
        style={{ opacity: addTodo.isPending ? 0.8 : 1 }}
      >
        <label>
          Add:
          <input type='text' name='add' placeholder='new todo' />
        </label>
        <button type='submit' disabled={addTodo.isPending}>
          Submit
        </button>
        <button type='button' onClick={refetch}>
          Refetch
        </button>
      </form>
    </div>
  )
}
```

Preview:

```
Sort by: | title |

🗒 Go shopping
✅ Learn JavaScript
✅ Learn React
🗒 Learn React Query

Add: |........| Submit  Refetch
```

Here we have a basic but ultimately incomplete Todo list app that contains a bunch of stuff we've already learned throughout the course.

We're triggering the `mutation` when the form is submitted, but we haven't implemented updating the cache yet because it's not as simple as just calling `queryClient.setQueryData` with the updated list.

The problem is, because of the sorting, we _might_ have multiple list entries in the cache. In this scenario, which one do we update?

```
// cache entries:
['todos', 'list', { sort: 'id' }]
['todos', 'list', { sort: 'title' }]
['todos', 'list', { sort: 'done' }]
```

Well, we'd probably want to update all of them. The problem is, even with just three `sort` options, this gets gross pretty quick.

Here's what it would look like.

```js
function useAddTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addTodo,
    // newToto: return of addTodo function
    onSuccess: (newTodo) => {
      queryClient.setQueryData(
        ['todos', 'list', { sort: 'id' }],
        (previousTodos) => [...previousTodos, newTodo]
      )

      queryClient.setQueryData(
        ['todos', 'list', { sort: 'title' }],
        (previousTodos) =>
          [...previousTodos, newTodo].sort((a, b) => {
            if (String(a.title).toLowerCase() < String(b.title).toLowerCase()) {
              return -1
            }

            if (String(a.title).toLowerCase() > String(b.title).toLowerCase()) {
              return 1
            }

            return 0
          })
      )

      queryClient.setQueryData(
        ['todos', 'list', { sort: 'done' }],
        (previousTodos) =>
          [...previousTodos, newTodo].sort((a, b) => (a.done ? 1 : -1))
      )
    },
  })
}
```

And this is the best case scenario. What would happen if the way we sorted the list in our `onSuccess` callback was _different_ than the way it was sorted on the backend where the actual mutation happens?

In this scenario, the user would see the list sorted one way until a refetch occurred, then they'd see the list sorted another.

That's not ideal.

## Better approach for fetch data update: invalidate multple cache entries

In scenarios like this where you have an arbitrary number of cache entries that all need to be updated, instead of updating them all manually, a better approach is just to invalidate all of them.

The reason being, when you invalidate a query, it does two things:

1. It refetches all _active_ queries (with observers) that match the invalidated key (because those are visible).
2. It marks the remaining queries as stale. So next time they become `active` (e.g. the user navigates to a screen that uses them), they will automatically refetch.

If we look at this from first principles, it makes a lot of sense.

When you invalidate a query, if that query has an observer (meaning it's `active` and most likely its data is being show to the UI), React Query will instantly refetch it and update the cache. Otherwise, it'll get marked as `stale` and React Query will refetch it the next time a trigger occurs.

Now the next obvious question, how do you invalidate a query?

Thankfully React Query makes this pretty simple and the best part is you don't have to worry about the specifics of how the cache is structured. All you have to do is invoke `queryClient.invalidateQueries`, passing it a `queryKey`.

```js
function useAddTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addTodo,
    onSuccess: () => {
      // NOTE: we return this
      return queryClient.invalidateQueries({
        queryKey: ['todos', 'list'],
      })
    },
  })
}
```

Reminder: the query cache contains:

```
['todos', 'list', { sort: 'id' }]
['todos', 'list', { sort: 'title' }]
['todos', 'list', { sort: 'done' }]
```

Now, by returning a promise from `onSuccess` (which is what `queryClient.invalidateQueries` returns), React Query can wait for the promise to resolve before it considers the mutation complete – avoiding potential UI flashes where the refetch occurs before the mutation has finished.

### More notes on invalidation

NOTE from blog: Promises returned from the `useMutation` callbacks are awaited by React Query, and as it so happens, `invalidateQueries` returns a Promise. If you want your mutation to stay in loading state while your related queries update, you have to return the result of `invalidateQueries` from the callback:

```js
// 🎉 will wait for query invalidation to finish
onSuccess: () => {
  return queryClient.invalidateQueries({
    queryKey: ['posts', id, 'comments'],
  })
}
```

As opposed to:

```js
// 🚀 fire and forget - will not wait
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: ['posts', id, 'comments'],
  })
}
```

## Automatic cache invalidation, using the cache callbacks

**Source**: https://tkdodo.eu/blog/automatic-query-invalidation-after-mutations#the-global-cache-callbacks

Mutations have callbacks - `onSuccess`, `onError` and `onSettled`, which you have to define on each separate `useMutation`. Additionally, the same callbacks exist on the `MutationCache`. Since there is only one `MutationCache` for our application, those callbacks are _"global"_ - they are invoked for every Mutation.

It's not quite obvious how to create a `MutationCache` with callbacks, because in most examples, the `MutationCache` is implicitly created for us when we create the `QueryClient`. However, we can also create the cache itself manually and provide callbacks to it:

```
import { QueryClient, MutationCache } from '@tanstack/react-query'

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess,
    onError,
    onSettled,
  }),
})
```

So how can the global callback help us with automatic invalidation? Well - we can just call `queryClient.invalidateQueries` inside the global callback:

```js
const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: () => {
      queryClient.invalidateQueries()
    },
  }),
})
```

But isn't that excessive (too many refetches) ?

Maybe, maybe not. It depends. One thing we have to clarify here is that an invalidation doesn't always equate to a refetch.

Reminder: Invalidation merely refetches all **active** Queries that it matches, and marks the rest as **stale**, so that they get refetched when they are used the next time.

More resources:
https://tkdodo.eu/blog/automatic-query-invalidation-after-mutations

Example:

Use meta option

---

### Going back to the course material

Again, the trick is that invalidation performs a refetch for _active_ queries. So instead of taking the response that comes back from the mutation and writing it to the cache manually, we completely ignore it and get the source of truth for the list from the server.

This has a few obvious advantages – we no longer have to re-implement server logic on the client, and our list will be guaranteed to be up to date.

Of course, it has the drawback of having to make another round-trip to the server, but this is in-line with React Query being a data synchronization tool. After server state has changed, it's usually a good idea to verify you have the latest data in the cache.

Another tradeoff is that the **non active** queries won't get refetched immediately (since they're just marked as `stale`). Usually this is what you want, but if you weren't worried about overfetching, you could add a `refetchType` property of `"all"` to your query options to force _all_ queries, regardless of their status, to refetch immediately.

```js
queryClient.invalidateQueries({
  queryKey: ['todos', 'list'],
  refetchType: 'all',
})
```

This would lead to an even more consistent cache after a mutation occurs.

Now there is one critical aspect to making `invalidateQueries` work that you may have not noticed. It even has a fancy name so we can put it in sparkles – **Fuzzy Query Key matching**.

When we invoked `invalidateQueries`, we passed it a query key of `['todos', 'list']`. This tells React Query to invalidate all queries that start with `['todos', 'list']`. That's why all three of our sort queries were invalidated even though none of them matched `['todos', 'list']` exactly.

```
['todos', 'list', { sort: 'id' }]
['todos', 'list', { sort: 'title' }]
['todos', 'list', { sort: 'done' }]
```

Notice that this worked because we structured our `queryKey` hierarchically. In fact, `queryKeys` are arrays in the first place because arrays have strict hierarchy built in.

Practically speaking, what this means is that you want to order your query keys from _generic_ to _specific_.

Again if we look at our example, `todos` is the most _generic_ thing - it refers to our "entity". Then, we have a hardcoded string _list_, which we've added to distinguish between different kinds of "todo" caches. Finally at the end, we can see the specific "sort".

Now let's say we extended our example by adding a _detail_ view to the UI. If we did that, we'd probably end up with a cache that looked like this.

```
['todos', 'list', { sort: 'id' }]
['todos', 'list', { sort: 'title' }]
['todos', 'detail', '1']
['todos', 'detail', '2']
```

And then, if we added another totally unrelated new feature, like our a Post view from the previous lesson, we might even have a cache that looked like this.

```
['todos', 'list', { sort: 'id' }]
['todos', 'list', { sort: 'title' }]
['todos', 'detail', '1']
['todos', 'detail', '2']
['posts', 'list', { sort: 'date' }]
['posts', 'detail', '23']
```

Now let's walk through how fuzzy matching would work if we invalidated `['todos', 'list']`.

```js
queryClient.invalidateQueries({
  queryKey: ['todos', 'list'],
})
```

First, React Query would look at the passed `queryKey`, take the first element of the array (`todos`), and filter everything down that matches that string.

```diff
['todos', 'list', { sort: 'id' }]
['todos', 'list', { sort: 'title' }]
['todos', 'detail', '1']
['todos', 'detail', '2']
- ['posts', 'list', { sort: 'date' }]
- ['posts', 'detail', '23']
```

Next, the remaining matches are compared against the second value of the key, list.

```diff
['todos', 'list', { sort: 'id' }]
['todos', 'list', { sort: 'title' }]
- ['todos', 'detail', '1']
- ['todos', 'detail', '2']
- ['posts', 'list', { sort: 'date' }]
- ['posts', 'detail', '23']
```

So what remains, all "todo lists", will be invalidated.

And it's not just the `queryKey` that you can filter against. For example, you could tell React Query to only match `stale` queries like this:

```js
queryClient.invalidateQueries({
  queryKey: ['todos', 'list'],
  stale: true,
})
```

or queries that are actively used (ones that have observers), like this.

```js
queryClient.invalidateQueries({
  queryKey: ['todos', 'list'],
  type: 'active',
})
```

And if you want complete control, you can even pass a `predicate` function to `invalidateQueries` which will be passed the whole query that you can use to filter against. If the function returns `true`, it'll match and be _invalidated_. If it returns `false`, it'll be _excluded_.

This is incredibly powerful, especially for cases where your `queryKey` structure doesn't allow you to target everything with one statement.

For example, you could target all detail queries, no matter their entity, like this.

```js
queryClient.invalidateQueries({
  predicate: (query) => query.queryKey[1] === 'detail',
})
```

Regardless, the key takeaway is that if you structure your `queryKeys` appropriately, relying on fuzzy matching, you can invalidate a whole subset of queries with a single call to `invalidateQueries`.
