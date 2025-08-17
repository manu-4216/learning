# Optimistic Updates

Recent resources: 
- https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query
- https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates#via-the-ui

When `fetching` data, we've seen how React Query gives you the tools to help you avoid having to show loading indicators to your users – keeping your UI snappy and responsive.

However, when `mutating` data, we haven't really seen that level of polish yet. Up to this point, we've only seen the default behavior of most web apps – the user clicks a button, a mutation is sent to the server, and the UI waits until the server responds with an OK before it shows the update.

We can see this clearly in our Todos example from the last lesson.

In this scenario, it's not too bad since it's pretty obvious to the user that the app is waiting for the server to confirm the new todo before adding it to the list.

However, what if we updated our app to be able to toggle the status of the todo item? In this scenario, if we wait for the server to confirm the update before updating the checkbox, it's going to feel laggy.

In these scenarios, if you already know what the final UI should look like after the mutation, you almost always want to show the user the result of their action immediately, and then _roll back_ the UI if the server responds with an error. This is such a common pattern that it even has a fancy name, __Optimistic Updates__.

So knowing what you already know about React Query, how would you go about implementing this?

Again, the idea is that we just want to assume the mutation succeeds and show the updates to the user immediately. In our example, that means toggling the checkbox as soon as the user clicks it.

To do that, we need to know when the mutation is pending. If it is, then the checkbox should be in the opposite state of what it was before (since, because Math, that's the only possible state change for a checkbox). If it's not, then it should remain the same.

Thankfully, as we know, `useMutation` gives us a `status` (as well as the derived `isPending`, `isError`, and `isSuccess` values) that we can use to determine if the mutation is in flight.

```js
function Todo({ todo }) {
  const { mutate, isPending } = useToggleTodo(todo.id)

  return (
    <li>
      <input
        type="checkbox"
        checked={isPending ? !todo.done : todo.done}
        onChange={mutate}
      />
      {todo.title}
    </li>
  )
}
```

This seems to work fine, and with this approach we don't need to handle rolling back the UI if the mutation fails. The reason for this is because we're just looking at the `status` of the mutation to derive the state of our checkbox, and not actually invalidating any queries or updating the cache _until_ the mutation is successful.

Again, here's how the full process works.

While the query is _pending_, the state of the checkbox will be the opposite of what's currently in the cache. From there, if the mutation succeeds, the query will be invalidated and the UI will remain the same (since it was already showing the optimistic update). If the mutation fails, then at that point the mutation is no longer _pending_ and the state of the checkbox will be whatever it was before mutation was attempted, which is also the exact value that's in the cache.

This approach is simple, but its simplicity is also its downfall.

Notice what happens when you click on multiple checkboxes in a row, before any mutation has time to complete and invalidate the query.

The state of the checkboxes will be consistent with the state of the server – eventually.

Because we're not updating the cache until _after_ the mutation is successful, if you click on multiple checkboxes in a row, there's a moment between when the original mutation has finished, and when the cache has been updated. In this moment, the state of the initial checkbox will be inconsistent with the state of the server.

It will fix itself after the last mutation has succeeded and the queries have been invalidated, but it's not a great experience for the user.

Instead of invalidating the queries when a mutation succeeds and relying on the `status` of the mutation to determine the state of the UI, what if we just update the cache optimistically and then roll it back if it fails?

Here's how that would work on a successful mutation.

> Interactive graphic shows mutations writing to the cache followed by the component tree, the mutations fetch from the database then trigger a refetch of the cache

And here's how it would work when a mutation failed.

> Interactive graphic shows mutations writing to the cache followed by the component updating. The mutations fetch from the database but it returns an error, so the mutations write to the cache again to rollback the component, then trigger a refetch of the cache

This would solve our race condition problem since it would return the cache to being the source of truth for the UI.

Let's start with our current, flawed implementation of `useToggleTodo`.

```js
function useToggleTodo(id) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => toggleTodo(id),
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: ['todos', 'list']
      })
    }
  })
}
```

The first thing we'll do is get rid of our `onSuccess` callback.

Since it doesn't run until _after_ the mutation has succeeded, it's too late for us to do anything optimistic with it.


```js
function useToggleTodo(id) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => toggleTodo(id)
  })
}
```

Next, we need a way to execute some code `before` the mutation is sent to the server. We can do this with the `onMutate` callback.

```js
function useToggleTodo(id) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => toggleTodo(id),
    onMutate: () => {
      
    }
  })
}
```

Now if we put our logic for updating the cache inside of `onMutate`, React Query will execute it before it sends the mutation to the server.

```js
function useToggleTodo(id, sort) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => toggleTodo(id),
    onMutate: () => {
      queryClient.setQueryData(
        ['todos', 'list', { sort }],
        (previousTodos) => previousTodos?.map((todo) =>
          todo.id === id ? { ...todo, done: !todo.done } : todo
        )
      )
    }
  })
}
```

Now if we throw that in our app, here's how it'll behave.

Note: we've also had to pass `sort` down to `useToggleTodo` in order to update the correct entry in the cache and we've updated our `Todo` component to no longer change its state based on the `isPending` value.

```js
import * as React from 'react'
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query'
import { fetchTodos, addTodo, toggleTodo } from './api'

// important code is here:
function useToggleTodo(id, sort) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => toggleTodo(id),
    onMutate: () => {
      queryClient.setQueryData(
        ['todos', 'list', { sort }],
        (previousTodos) => previousTodos?.map((todo) =>
          todo.id === id ? { ...todo, done: !todo.done } : todo
        )
      )
    }
  })
}

function useTodos(sort) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['todos', 'list', { sort }],
    queryFn: () => fetchTodos(sort),
    placeholderData: queryClient.getQueryData(['todos', 'list', { sort }]),
    staleTime: 10 * 1000
  })
}

function useAddTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addTodo,
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: ['todos', 'list']
      })
    }
  })
}


function Todo({ todo, sort }) {
  // no more use of isPending
  const { mutate } = useToggleTodo(todo.id, sort)

  return (
    <li>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={mutate}
      />
      {todo.title}
    </li>
  )
}


export function TodoList() {
  const [sort, setSort] = React.useState('id')
  const { status, data, isPlaceholderData } = useTodos(sort)
  const addTodo = useAddTodo()

  if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return <div>Error fetching todos</div>
  }


  const handleAddTodo = (event) => {
    event.preventDefault()
    const title = new FormData(event.currentTarget).get('add')
    addTodo.mutate(title, {
      onSuccess: () => event.target.reset()
    })
  }


  return (
    <div style={{ opacity: isPlaceholderData ? 0.8 : 1 }}>
      <label>
        Sort by:
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value)
        }}>
          <option value="id">id</option>
          <option value="title">title</option>
          <option value="done">completed</option>
        </select>
      </label>
      <ul>
        {data.map(todo => (
          <Todo todo={todo} key={todo.id} sort={sort} />
        ))}
      </ul>
           <form
        onSubmit={handleAddTodo}
        style={{ opacity: addTodo.isPending ? 0.8 : 1 }}
      >
        <label>Add:
          <input
            type="text"
            name="add"
            placeholder="new todo"
          />
        </label>
        <button
          type="submit"
          disabled={addTodo.isPending}
        >
          Submit
        </button>
      </form>
    </div>
  )
}
```

That's slick. Yet again, we have an asynchronous UI that feels synchronous.

Of course, we're not quite done yet. As is, we're assuming the mutation will succeed and we're updating the cache appropriately. However, what if it fails? In that scenario, we need to be able to _roll back_ the cache to whatever it previously was.

To do this, we can use the `onError` callback which will run if the mutation fails.

```js
function useToggleTodo(id, sort) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => toggleTodo(id),
    onMutate: () => {
      queryClient.setQueryData(
        ['todos', 'list', { sort }],
        (previousTodos) => previousTodos?.map((todo) =>
          todo.id === id ? { ...todo, done: !todo.done } : todo
        )
      )
    },
    onError: () => {

    }
  })
}
```

What we do next may be a bit surprising, so before looking at the implementation, I want to first make sure you understand the goal.

If the mutation fails, because we already optimistically updated the cache as if it would succeed, we need to roll back the cache to what it was before the mutation was attempted.

To do that, we need a two things – a snapshot of the cache as it was before the mutation was attempted, and a way to reset to cache to that snapshot.

For the snapshot, we actually want to get that inside of `onMutate` _before_ we update the cache optimistically.

```js
function useToggleTodo(id, sort) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => toggleTodo(id),
    onMutate: () => {
      const snapshot = queryClient.getQueryData(
        ['todos', 'list', { sort }]
      )

      queryClient.setQueryData(
        ['todos', 'list', { sort }],
        (previousTodos) => previousTodos?.map((todo) =>
          todo.id === id ? { ...todo, done: !todo.done } : todo
        )
      )
    },
    onError: () => {

    }
  })
}
```

Now we need a way to access `snapshot` inside of `onError` so we can reset the cache to that value if an error occurs.

Because this is a common problem, React Query will make whatever you return from `onMutate` available as the third argument in all the other callbacks.

So in our example, let's return a function from `onMutate` that, when invoked, will reset the cache to the `snapshot`.

```js
function useToggleTodo(id, sort) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => toggleTodo(id),
    onMutate: () => {
      const snapshot = queryClient.getQueryData(
        ['todos', 'list', { sort }]
      )

      queryClient.setQueryData(
        ['todos', 'list', { sort }],
        (previousTodos) => previousTodos?.map((todo) =>
          todo.id === id ? { ...todo, done: !todo.done } : todo
        )
      )

      // return this function, available as 3rd arg to useMutation `onError` etc 
      return () => {
        queryClient.setQueryData(
          ['todos', 'list', { sort }],
          snapshot
        )
      }
    },
    // access our rollback function and call it to reset the cache.
    onError: (error, variables, rollback) => {
      rollback?.()
    }
  })
}
```

Now, whenever an error occurs, because we've captured the previous state of the cache in a `snapshot` via a closure, we can invoke our `rollback` function, resetting the cache to what it was before the mutation was attempted.

At this point, the _must haves_ are done – we're just left with two other _nice to haves_ that we can add to bulletproof the experience even more.

First, we want to make sure that there are no other refetches happening before we manually update the cache. If we don't, and the refetches resolve after we've made the optimistic cache update, then they'll override the change, leading to an inconsistent UI.

To do this, we can call `queryClient.cancelQueries` before any other logic inside of `onMutate`.

```js
function useToggleTodo(id, sort) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => toggleTodo(id),
    onMutate: async () => {
      // add this code:
      // NOTE: canceled queries won’t show an error message.
      // They are silently stopped, and React Query doesn't treat them as failed.
      await queryClient.cancelQueries({
        queryKey: ['todos', 'list', { sort }]
      })

      const snapshot = queryClient.getQueryData(
        ['todos', 'list', { sort }]
      )

      queryClient.setQueryData(
        ['todos', 'list', { sort }],
        (previousTodos) => previousTodos?.map((todo) =>
          todo.id === id ? { ...todo, done: !todo.done } : todo
        )
      )

      return () => {
        queryClient.setQueryData(
          ['todos', 'list', { sort }],
          snapshot
        )
      }
    },
    onError: (error, variables, rollback) => {
      rollback?.()
    }
  })
}
```

Finally, `useMutation` supports another callback, `onSettled`, which will run after all its other callbacks, regardless of whether the mutation succeeded or failed.

It's a good idea to always _invalidate_ the necessary queries inside of `onSettled` just to make sure the cache is definitely in sync with the server. It probably is before this anyway (because of the optimistic update), but if for some reason it's not (like if the server responded with a different value than expected), invalidating the query will trigger a refetch and get the cache back in sync.

```js
    onSettled: () => {
      // make sure the cache is definitely in sync 
      return queryClient.invalidateQueries({
        queryKey: ['todos', 'list']
      })
    }
```

Pretty solid.

Before the mutation occurs, we cancel any ongoing fetching, capture a snapshot of the cache, update the cache optimistically so the user gets instant feedback, and return a rollback function that will reset the cache to the snapshot if the mutation fails. And just in case, after the mutation has finished, we invalidate the query to make sure the cache is in sync with the server.

As a rule of thumb, anytime the user needs instant feedback of an async operation, optimistic updates are usually the way to go.


__NOTES__ - issues with this approach of optimistic update, with static snapshot:

__Cons:__
- Freezes the entire state
- Prevents other concurrent updates
- Overwrites unrelated changes that happened after `onMutate`

__Another option:__

Instead of storing a full snapshot, only store the previous version of the updated item, and when rolling back, just revert that item, not the whole list.

__Advantages__:
- Other concurrent updates to different todos are preserved.
- Rollback is specific to the failed mutation.
- No need to worry about race conditions from unrelated items.


### Custom Abstraction

Since we writing optimistic updates to the cache involves quite a bit of code, it might be a good idea to abstract it away into a custom `useOptimisticMutation` hook if you're using this pattern often.

```js
useOptimisticMutation({
   mutationFn: () => toggleTodo(id),
   queryKey: ['todos', 'list', { sort }],
   updater: (previousTodos) => previousTodos?.map((todo) =>
     todo.id === id
       ? { ...todo, done: !todo.done }
       : todo
   ),
   invalidates: ['todos', 'list'],
 })
 ```

Here's an example code how that might look:

```js
 export const useOptimisticMutation = ({ mutationFn, queryKey, updater, invalidates }) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey,
      })

      const snapshot = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, updater)

      return () => {
        queryClient.setQueryData(queryKey, snapshot)
      }
    },
    onError: (err, variables, rollback) => {
      rollback?.()
    },
    onSettled: () => {
      return queryClient.invalidateQueries({
        queryKey: invalidates,
      })
    }
  })
}
```

Aditional note from Dominik:

 > One trick we’re going to show in a later lesson is to check of a “relevant” different mutation is in-flight (with `queryClient.isMutating` and skip the invalidation to avoid that wrong in-between step. The same could be done to apply rollbacks conditionally.

Typescript code [here](https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAbzgVwM4FMCyyYEMbAQB2ANChgIrLpQCeAwgDbDpExlU20DS6tZ2PAWIAxZEQDGwonAC+cAGZQIIOAHIAAniKo8EgNYB6KOlxSAtAEdqdNQFgAUI5i0w6OAHkwBEMF3AJAAVlMFQAHkc4OAAVABF8XDgAXhQifSIIAHdSSJiANVwoYFwAI0Z0VGS4ADcIYAATElzozjoRIni8KtwifkcAPiqEXJAcfEIidoAuOEFx0XEpCbC4hLJogqLS8tR+poco6y5eWhnWnj59qOQwevwaGYAKYCIwHBmWm1p2zsSAH1S9XQChe6HqAEpkoNPlwfgk4ADxECQUQwbkXtVcMw7jAKmcvidHLJHI50AAPSCwOASYi6cjoLw+PwECRzaRVCIHGK-KridJZHJcjaFYplCpVWoNfb9R5IUZCCbtMhHOgnMg3HE0MgYrENe6VWQzRmgZkBYIQUIrX7rTainb9SFJQbDLk0nTwFUMZiseApNDoc5MFhsR7gklckwwZBQGT+tkTWW5KLy+aTQVRKLENnoGa4VC0SRwUNQxBJjO4TK4YAer5Bn0AOgkPQk6EYrRYqETXIzGc9arLUVkYac3YzbrpqCIuFCAAsIL64J662x6wBzdAwc6-R59vjDgeL2velcYTdfbe7-goW73KD70dRSPRmTFp2lh+9o-BmD109bhI7gSlxwJO06oHOMDDj2g5lrIVwZsQACiUDKFATw0FAZCYlsYqoGQyiMIwJRmPojrOgeBFESRAD89ahrB8GZkQADKG4wOU9RPGR77QXAT4xoeXDLj+OrYvc7YVF2vGHEBpxwKJeq4nhB5DrBuSqQ4xIjoYhjkLg65TOGLhuDEED1BAQzyZxcBEMgIAlFqcDmaiMwlBAEDlD0ZBTiAOYgTARREKucjhuO8AwBAq6ruU0RmRZKTPNZtn2TQ3Hmr4GD1iYqAedU6CylZMwAKxkM5fkBdQ3m4L5MxqGocj3mFVlVEVjhNUgOK4GQKa4nIvIYMaGUsvGxBScmYzSNMRbcRFUUxXFiXgoxl4zAA2moEXmagahkGozC6DtiAgdAMC1XmEj1bIAC6jEareTxgCY1SEGgsVbTMACCKG4LQKxxYMiJEMioIQiWj3oM9ECvXFqC0SA06PI8m0QGRA7I-WDTJEkKQNAecDUUd9ZE8jpXEH5ACE6NlSFH5wDMyNJktSYKZqqBrRtMOHXtzJqDdkRDkAA)