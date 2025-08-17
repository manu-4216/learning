# Customizing defaults

## Intro

At this point, it should be pretty clear that React Query gives you a lot of flexibility when it comes to customizing your queries and mutations.

`staleTime`, `refetchInterval`, `refetchOnMount`, `refetchOnWindowFocus`, `refetchOnReconnect`, `gcTime`, and enabled are just a few of these options that we've used so far.

And up until this point, whenever we've needed to customize a query or mutation, we've done so by passing an options object directly to `useQuery` or `useMutation`.

```js
function useProject(id) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(id),
    staleTime: 10 * 1000,
  });
}
```

This worked fine, but as your application grows, you might find yourself repeating the same options over and over again.

For example, you might want to set a default `staleTime` of 10 seconds for any query that doesn't provide their own.

Of course, one way to fix this would be to create a shared options object that you can import anywhere you need it:

```js
import { defaultStaleTime } from "./options";

function useProject(id) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(id),
    staleTime: defaultStaleTime,
  });
}
```

But though it works, it's a brittle solution that doesn't scale well.

## Client defaults set at QueryClient creation, with defaultOptions

Thankfully, React Query gives you a simpler way to solve this problem with something it calls `Query Defaults`.

Any option that can be passed to `useQuery` (besides `queryKey`), can have its default value set by passing a `defaultOptions` object to your `queryClient` when you create it.

```js
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 1000,
    },
  },
});
```

Now, any query that doesn't have its own `staleTime` will use the default of 10 \* 1000 milliseconds.

```js
// uses the default staleTime of 10 seconds
function useProject(id) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(id),
  });
}

// uses the provided staleTime of 5 seconds
function usePost(path) {
  return useQuery({
    queryKey: ["posts", path],
    queryFn: () => fetchPost(path),
    staleTime: 5000,
  });
}
```

## Fuzzy matched defaults with setQueryDefaults

React Query also gives you the flexibility to define `defaultOptions` for a specific subset queries via **Fuzzy Matching**.

For example, assume we have the following keys in our cache:

```text
['todos', 'list', { sort: 'id' }]
['todos', 'list', { sort: 'title' }]
['todos', 'detail', '1']
['todos', 'detail', '2']
['posts', 'list', { sort: 'date' }]
['posts', 'detail', '23']
```

And assume we wanted to set the default `staleTime` for only Todo details (`todos/detail/n`) to 10 seconds.

We could do this by invoking `queryClient.setQueryDefaults`, passing it a `queryKey` and the options you want to apply to all queries that match that key.

```js
queryClient.setQueryDefaults(["todos", "detail"], { staleTime: 10 * 1000 });
```

Now, because of fuzzy matching, any query that matches `['todos', 'detail']` will inherit the default `staleTime` of 10 seconds:

```diff
- ['todos', 'list', { sort: 'id' }]
- ['todos', 'list', { sort: 'title' }]
['todos', 'detail', '1']
['todos', 'detail', '2']
- ['posts', 'list', { sort: 'date' }]
- ['posts', 'detail', '23']
```

## Priority overview

Between setting global defaults when you create the `queryClient`, setting defaults for a subset of queries via `setQueryDefaults`, and setting options via `useQuery`, you have fine-grained control over the options for any query or mutation in your app – and each takes precedence over the previous.

```js
const finalOptions = {
  ...queryClientOptions, // baseline client defaults for all queries
  ...setQueryDefaultOptions, // fuzzy matching defaults
  ...optionsFromUseQuery, // query specific options
};
```

And as I mentioned, any option that can be passed to useQuery (besides `queryKey`), can have a default value – even the `queryFn`.

This is particularly helpful if all requests in your app go to the same API.

For example, say we had two queries – one for fetching all posts and one for fetching a single post by its path.

```js
function usePostList() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const response = await fetch("/api/posts");

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      return response.json();
    },
  });
}

function usePost(path) {
  return useQuery({
    queryKey: ["posts", path],
    queryFn: async () => {
      const response = await fetch(`/api/posts${path}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch post: ${path}`);
      }

      return response.json();
    },
  });
}
```

If you were a slave to D.R.Y., you might be tempted to extract the `queryFn` into another function you could then share between the two queries.

```js
async function fetchPosts(path = "") {
  const baseUrl = "/api/posts";
  const response = await fetch(baseUrl + path);

  if (!response.ok) {
    throw new Error("Failed to fetch");
  }

  return response.json();
}
```

This works, but even though we've abstracted away all the shared fetching logic, you still need to remember to both include a `queryFn` in each query as well as pass the correct `path` to it.

```js
function usePostList() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: () => fetchPosts(),
  });
}

function usePost(path) {
  return useQuery({
    queryKey: ["posts", path],
    queryFn: () => fetchPosts(path),
  });
}
```

Instead, what if we utilized `setQueryDefaults` to set a default `queryFn` for all queries that match the ['posts'] key?

If we were able to do this, then we could simplify our queries to look like this, which would solve our problems.

```js
function usePostList() {
  return useQuery({
    queryKey: ["posts"],
  });
}

function usePost(path) {
  return useQuery({
    queryKey: ["posts", path],
  });
}
```

The key to this is being able to derive the request's URL from the `queryKey`, and you can get access to the queryKey from inside of the queryFn by using the `QueryFunctionContext` object that React Query passes to it.

```js
queryClient.setQueryDefaults(["posts"], {
  queryFn: async ({ queryKey }) => {
    const baseUrl = "/api/";
    const slug = queryKey.join("/");
    const response = await fetch(baseUrl + slug);

    if (!response.ok) {
      throw new Error("fetch failed");
    }

    return response.json();
  },
  staleTime: 5 * 1000,
});
```

Another benefit of this approach is that it makes it impossible to forget to include a variable in the `queryKey` that you need in the `queryFn`.

And of course, if you needed to, you can still override the default `queryFn` by providing your own when you call `useQuery`.
