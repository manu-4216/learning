As an application using React Query grows, so too will the complexity around managing query keys. We've seen a subtle example of this already when dealing with mutations.

You define a `queryKey` in a custom hook in one part of your app, and then in order to invalidate or mutate that query, you need to use the same key in another hook in a different part of your app.

```js
export default function useTodos(sort) {
  return useQuery({
    queryKey: ["todos", "list", { sort }],
    queryFn: () => fetchTodos(sort),
  });
}
```

```js
useMutation({
  mutationFn,
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["todos", "list"],
    });
  },
});
```

Until this point, we've just been recreating the `queryKey` array and hoping for the best. It works, but it's the exact sort of thing that will derail your afternoon when you make a typo in one of the keys.

## Query Key Factories

One approach to managing this complexity is to use Query Key Factories, where you define all of your `queryKeys` in a single location.

```js
export const todoKeys = {
  allLists: () => ["todos", "list"],
  list: (sort) => ["todos", "list", { sort }],
};
```

Now, anywhere you need access to a queryKey, you can do so by importing the todoKeys object.

```js
import { useQuery } from "@tanstack/react-query";
import { todoKeys } from "./keys";

export default function useTodos(sort) {
  return useQuery({
    queryKey: todoKeys.list(sort),
    queryFn: () => fetchTodos(sort),
  });
}
```

```js
import { useMutation } from "@tanstack/react-query";
import { todoKeys } from "./keys";

useMutation({
  mutationFn,
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: todoKeys.allLists(),
    });
  },
});
```

It's subtle, but now you don't need to worry about typos derailing your afternoon or the specific hierarchy of individual query keys.

We can even take this a bit further if you're _really_ worried about duplication by using a bit of composition.

Notice that inside our factory, we've written the strings 'todo' and 'list' multiple times.

```js
export const todoKeys = {
  allLists: () => ["todos", "list"],
  list: (sort) => ["todos", "list", { sort }],
};
```

To address this, you can create more specific keys by composing them from the more generic ones.

```js
const todoKeys = {
  all: () => ["todos"],
  allLists: () => [...todoKeys.all(), "list"],
  list: (sort) => [...todoKeys.allLists(), { sort }],
};
```

Now each key is built upon the previous one and only appends what specifically makes it unique.

The tradeoff, of course, is it's less readable which makes it harder to tell what each key will eventually contain.

### For TypeScript Users

To get the most narrow type inferred for your `queryKeys`, you'll probably want to add a **const assertions** to each of them:

```ts
const todoKeys = {
  all: () => ["todos"] as const,
  allLists: () => [...todoKeys.all(), "list"] as const,
  list: (sort: string) => [...todoKeys.allLists(), { sort }] as const,
};
```

The last thing on Query Key Factories is that it's recommended to create _one factory per feature_, and have all `queryKeys` in that factory start with the same prefix - usually the name of the feature. This will make sure keys won't overlap, but you can still keep the keys close to where they are used.

### The drawback of separation

Now Query Key Factories are a decent pattern as they help you avoid having to both remember and re-type keys every time you need them. This will give you discoverability while coding, and a bit of safety when refactoring. They do, however, have one drawback – they separate the `queryKey` and the `queryFn` from each other.

As we've learned before, the `queryKey` and `queryFn` are an inseparable pair since the `queryKey` defines the dependencies that are needed inside the `queryFn`. By separating them, you create a layer of abstraction that might make things harder to follow down the road.

## Query Factories

To solve this, what if we take the concept of Query Key Factories to the next level by creating **Query Factories** instead?

We've already seen a bit of this pattern previously when we talked about prefetching.

As a reminder, we needed to use the same options for both `queryClient.prefetchQuery` and `useQuery`. We did that by extracting the options object to a maker function that we could then invoke whenever we needed the options object.

```js
// shared query Factory
function getPostQueryOptions(path) {
  return {
    queryKey: ['posts', path],
    queryFn: () => fetchPost(path),
    staleTime: 5000
  }
}

...

function usePost(path) {
  return useQuery(getPostQueryOptions(path))
}

...

<a
  onClick={() => setPath(post.path)}
  href="#"
  onMouseEnter={() => {
    queryClient.prefetchQuery(getPostQueryOptions(post.path))
  }}
>
  {post.title}
</a>
```

The idea of Query Factories is to combine this pattern with the Query Key Factories pattern from earlier so that we have one object that will not only contain our `queryKeys`, but also the query options object.

```js
const todoQueries = {
  all: () => ["todos"],
  allLists: () => [...todoQueries.all(), "list"],
  list: (sort) => ({
    queryKey: [...todoQueries.allLists(), sort],
    queryFn: () => fetchTodos(sort),
    staleTime: 5 * 1000,
  }),
  allDetails: () => [...todoQueries.all(), "detail"],
  detail: (id) => ({
    queryKey: [...todoQueries.allDetails(), id],
    queryFn: () => fetchTodo(id),
    staleTime: 5 * 1000,
  }),
};
```

Now we have the best of both worlds. You can still create `queryKeys` via composition, but now the `queryKeys` and the `queryFns` are kept together.

And as always, you can still customize options per `useQuery` invocation by merging the options object with any new property you want.

```js
const { data } = useQuery({
  ...todoQueries.list(sort),
  refetchInterval: 10 * 1000,
});
```

Admittedly, what makes this pattern a bit awkward to work with is the fact that different entries have different shapes. Some entries, like allLists, exist just to help us form a hierarchy and to make it easier to create `queryKeys` for other entries, like the `queryKey` for list. Other entries, like list and detail, are actual query objects that can be passed to `useQuery`.

It's not a massive problem, but you just have to be attentive when working with this pattern.

For example, can you spot the problem with this code?

```js
queryClient.invalidateQueries(todoQueries.allLists());
```

`invalidateQueries` takes in an object with a `queryKey` property, but `todoQueries.allLists()` returns an array.

Here's the fix.

```js
queryClient.invalidateQueries({ queryKey: todoQueries.allLists() });
```

What about this one?

```js
queryClient.invalidateQueries(todoQueries.detail(id));
```

Trick question, there is no bug. Though the object that we're passing to invalidateQueries contains a few extra properties, React Query will just ignore those.

This is where using `TypeScript` is nice because it will tell us when we're doing something dumb wrong.

### For TypeScript Users

To make Query Factories type safe, you do have to use the exported `queryOptions` function from React Query:

```ts
import { queryOptions } from "@tanstack/react-query";

list: (sort: string) =>
  queryOptions({
    queryKey: [...todoKeys.allLists(), "list"],
    queryFn: () => fetchTodos(sort),
    staleTime: 5 * 1000,
  });
```

This function ensures that you don't pass wrong values, like a mistyped `staletime` to it, and it will also make sure that the `QueryFunctionContext`, which is passed to the `queryFn`, has the correct types.

And if you're unable to use `TypeScript` and want to avoid the different shapes problem, you might want to consider **always returning an object** from each method to keep it consistent.

```js
const todoQueries = {
  all: () => ({ queryKey: ["todos"] }),
  allLists: () => ({
    queryKey: [...todoQueries.all().queryKey, "list"],
  }),
  list: (sort) => ({
    queryKey: [...todoQueries.allLists().queryKey, sort],
    queryFn: () => fetchTodos(sort),
    staleTime: 5 * 1000,
  }),
  allDetails: () => ({
    queryKey: [...todoQueries.all().queryKey, "detail"],
  }),
  detail: (id) => ({
    queryKey: [...todoQueries.allDetails().queryKey, id],
    queryFn: () => fetchTodo(id),
    staleTime: 5 * 1000,
  }),
};
```

This streamlines the return values, but makes composition a bit more verbose. You'd also need to be aware which values we can be passed to `useQuery`, and which ones aren't "real" query objects.
