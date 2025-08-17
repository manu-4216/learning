# Error Handling

At this point in the course, we've covered a lot of examples when things go right. However, in the real world, this isn't always the case. Occasionally, Promise rejections occur, and when they do – despite the natural tendency to want to ignore them and hope for the best – it's usually a good idea to handle them appropriately.

And despite what browsing the modern web may have you believe, infinite spinners is not an adequate error handling strategy.

The first line of defense, as we've seen, is to throw an error in the `queryFn`.

In fact, whether you throw an error, call the reject method for a manually-constructed promise, or return the results of `Promise.reject()` – any promise rejection tells React Query that an error occurred and to set the status of the query to error.

```js
function useRepos() {
  return useQuery({
    queryKey: ["repos"],
    queryFn: async () => {
      const response = await fetch(
        "https://api.github.com/orgs/TanStack/repos"
      );

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`);
      }

      return response.json();
    },
  });
}
```

Now there may come a time when you need to debug or wrap the response of your fetch request inside of your `queryFn`. To do this, you may be tempted to manually catch the error yourself.

```js
function useRepos() {
  return useQuery({
    queryKey: ["repos"],
    queryFn: async () => {
      try {
        const response = await fetch(
          "https://api.github.com/orgs/TanStack/repos"
        );

        if (!response.ok) {
          throw new Error(`Request failed with status: ${response.status}`);
        }

        return response.json();
      } catch (e) {
        console.log("Error: ", e);
      }
    },
  });
}
```

This looks fine, but now we have a major problem. By catching the error yourself, unless you throw it again inside of the catch block, you're effectively swallowing the error, preventing it from making its way up to React Query.

This has a number of downsides, the most obvious being that React Query won't know that an error occurred and therefore, won't be able to update the status of the query correctly.

A less obvious downside is that React Query also won't know that it should retry the request again. In fact, by default, when a request fails, React Query will perform 3 retries, using an exponential backoff algorithm to determine how long to wait between each one.

This means each attempt is exponentially longer than the previous, starting with a delay of 1 second and maxing out at 30 seconds.

Of course, as most things with React Query, this default behavior is completely customizable via the `retry` and `retryDelay` options.

`retry` tells React Query how many times to retry the request, and `retryDelay` tells it how long to wait between each failed attempt.

So in the code below, React Query will retry the request 5 times, with a delay of 5000 milliseconds between each attempt.

```js
useQuery({
  queryKey: ["repos"],
  queryFn: fetchRepos,
  retry: 5,
  retryDelay: 5000,
});
```

If you need even more granular control, you can pass a function to both options and they'll receive the `failureCount` and the `error` as arguments that you can use to derive your values.

```js
useQuery({
  queryKey: ["repos"],
  queryFn: fetchRepos,
  retry: (failureCount, error) => {},
  retryDelay: (failureCount, error) => {},
});
```

So for example, if we wanted to provide our own custom algorithm for the delay between retries as well as only retrying an error that has a status code in the 5xx range, we could do something like this.

```js
useQuery({
  queryKey: ["repos"],
  queryFn: fetchRepos,
  retry: (failureCount, error) => {
    if (error instanceof HTTPError && error.status >= 500) {
      return failureCount < 3;
    }
    return false;
  },
  retryDelay: (failureCount) => failureCount * 1000,
});
```

And while these retries are happening, the query will remain in a `pending` state.

Though it often doesn't matter to our users if the `queryFn` needs to be executed more than once before it gets the data, if you need them, React Query will include the `failureCount` and `failureReason` properties in the object that `useQuery` returns.

Additionally, both values will be reset as soon as the query goes into a success state.

These values give you the flexibility to update your UI in the event of a failed data request. For example, you could display a message to the user that the request is taking longer than expected, or even get cute with it and show them how many requests you've tried to make.

Note that if you do want to configure the `retry` or `retryDelay` settings yourself, it's usually a good idea to do so on a global level to ensure _consistency_ throughout your application.

```jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 5,
      retryDelay: 5000,
    },
  },
});
```

Of course, retrying doesn't guarantee that the request will eventually succeed, it just gives it a few more chances. In the scenario where it does fail and the query goes into an error state, we still need to handle that gracefully.

The first option, as we've seen numerous times throughout this course so far, is to check the status of the query and render a generic error UI if it's in an error state.

```jsx
if (status === "error") {
  return <div>There was an error fetching the data</div>;
}
```

And one thing we haven't seen is if you want to get more specific, you can always access the exact error message and display that to the user via `error.message`.

## Using ErrorBoundary

This approach is fine, but the tradeoff is that it's coupled to an individual query and component. Often times when you're managing error UI in a component based architecture, it's nice to have a broader, higher level error handler that can catch and manage errors that occur anywhere in your app.

Thankfully, React itself comes with a nice solution for this problem in Error Boundaries.

If you're not familiar, an `ErrorBoundary` is a React component that is able to catch an error that occurs anywhere in its children and display a fallback UI.

```jsx
<ErrorBoundary fallback={<Error />}>
  <App />
</ErrorBoundary>
```

And what makes them powerful is because they're just components, you can have has many as you'd like and place them anywhere in your app. This gives you granular control over both how errors are handled and what the user sees when they occur.

```jsx
<ErrorBoundary fallback={<GlobalError />}>
  <Header />
  <ErrorBoundary fallback={<DashboardError />}>
    <Dashboard />
  </ErrorBoundary>
  <ErrorBoundary fallback={<ProfileError />}>
    <Profile />
  </ErrorBoundary>
  <Footer />
</ErrorBoundary>
```

While you can create your own `ErrorBoundary` component, it's generally recommended to use the officially unofficial `react-error-boundary` package.

The downside of Error Boundaries, unfortunately for us, is that Error Boundaries can only catch errors that occur during _rendering_.

Even with React Query, data fetching is a side effect that happens outside of React's rendering flow. This means that if an error occurs during a fetch in a `queryFn`, it won't be caught by an Error Boundary.

That is, unless we can figure out a way to tell React Query to throw the error again after it catches it itself.

As always, React Query has a configuration option which enables this – `throwOnError`.

When true, `throwOnError` tells React Query to throw an error when one occurs, so that an `ErrorBoundary` can catch it and display its fallback UI.

Because we've told React Query to `throwOnError` and we've wrapped our `TodoList` in an `ErrorBoundary`, we were able to move the tightly coupled error handling logic from within the component to a more global, higher level error handler.

And even more important, if we were to add more children components, any data fetching errors that happen in them would be managed by the same `ErrorBoundary`.

## Resetting the Error Boundary

Now there's one more scenario you have to consider that you may have not thought about and that is resetting the Error Boundary. For example, what if you only want to show the error UI for a certain amount of time, or until the user clicks a button to retry the request?

If you think about it, there are really two parts to this. First, we need a way to literally "reset" the `ErrorBoundary` and to stop showing the fallback UI, and second, we need a way to tell React Query to refetch the query data.

To "reset" the `ErrorBoundary` and stop showing the fallback UI, we can use the `resetErrorBoundary` function that `react-error-boundary` passes to the `FallbackComponent`.

```jsx
import TodoList from "./TodoList";
import { ErrorBoundary } from "react-error-boundary";

function Fallback({ error, resetErrorBoundary }) {
  return (
    <>
      <p>Error: {error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      <TodoList />
    </ErrorBoundary>
  );
}
```

To tell React Query to refetch the query data, well... I wish it were as simple as just calling a function, but it's a little more involved.

First, we'll use React Query's own boundary, `QueryErrorResetBoundary`.

The way `QueryErrorResetBoundary` works is you give it a function as its `children` prop, and when React Query invokes that function, it'll pass to it a reset function that you can use to reset any query errors within the boundaries of the component.

```jsx
<QueryErrorResetBoundary>
  {({ reset }) => (

  )}
</QueryErrorResetBoundary>
```

Now if we pass `reset` as an `onReset` prop to the `ErrorBoundary` component, whenever `resetErrorBoundary` is invoked, the `onResetfunction` will run, invoking `reset`, resetting any query errors and thus refetching the query data.

```jsx
<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary
      resetKeys={[selectedBookId]}
      FallbackComponent={Error}
      onReset={reset}
    >
      <Book bookId={selectedBookId} />
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

And as we've seen before, if you need even more control over how or which errors are thrown, you can pass a function to `throwOnError`.

When you do, that function will be passed two arguments, the error that occurred and the query.

```js
throwOnError: (error, query) => {
  //
};
```

If the function returns true, the error will be thrown to the `ErrorBoundary`. Otherwise, it won't.

So for example, the _downside_ of our current implementation is that _all_ errors will be thrown to the `ErrorBoundary`, even ones that occur during background refetches.

Most likely, if the user already has data and a background refetch fails, we want it to fail silently. To do that, we can return true from `throwOnError` if `query.state.data` is `undefined`. Meaning throw only if there is no `data`. Don't throw otherwise.

```js
function useTodos() {
  return useQuery({
    queryKey: ["todos", "list"],
    queryFn: fetchTodos,
    retryDelay: 1000,
    throwOnError: (error, query) => {
      return typeof query.state.data === "undefined";
    },
  });
}
```

Or if you only wanted errors in the 5xx range to be thrown to the `ErrorBoundary`, you could do something like this.

```js
function useTodos() {
  return useQuery({
    queryKey: ["todos", "list"],
    queryFn: fetchTodos,
    retryDelay: 1000,
    throwOnError: (error, query) => {
      return error.status >= 500;
    },
  });
}
```

And as always, if you wanted to tweak the default, global behavior for all queries, you could set it on the `QueryClient` itself.

```js
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: (error, query) => {
        return typeof query.state.data === "undefined";
      },
    },
  },
});
```

So at this point you've seen how combining Error Boundaries with `throwOnError` gives you a declarative way to handle any error that occurs in your app, but sometimes, the simple, imperative solution is the right approach.

## Imperative way - display a toast across the app with QueryCache onError

For example, there may be a time when you just want to show a toast notification when an error occurs. In this scenario, it wouldn't make sense to throw the error to an `ErrorBoundary` because you're not trying to display a fallback UI, you're just trying to show a toast.

Without React Query, you'd most likely end up with something like this – where you use `useEffect` to encapsulate the side effect toast logic.

```jsx
function useTodos() {
  const query = useQuery({
    queryKey: ["todos", "list"],
    queryFn: fetchTodos,
    retryDelay: 1000,
  });

  React.useEffect(() => {
    if (query.status === "error") {
      toast.error(query.error.message);
    }
  }, [query.error, query.status]);

  return query;
}
```

This works (in our simple app), but our code now contains the worst kind of bug – one that won't appear right away. Can you spot it?

What would happen if we called `useTodos` again in another part of our app? Assuming an error occurred, we'd end up with two toasts, one for each invocation of `useTodos`. Obviously that's not great.

In this scenario, what we really want is a global callback that is only invoked once per query – not per invocation of the hook. Thankfully, React Query also provides a simple way to do this via the `QueryClient`.

You already know that the `QueryClient` holds the `QueryCache`, but what you may not know is that when you create the `QueryClient`, you can also create the `QueryCache` yourself if you need more control over how the cache is managed.

For example, in our scenario, we want to show a toast whenever the query goes into an error state. We can do that by putting our toast logic into the `onError` callback when we create the `QueryCache`.

Of course, how you handle errors is dependent on your app's requirements, but React Query gives you the flexibility to handle them in a way that makes sense for you.

If you'd like a opinionated approach, here's the default configuration we go with:

```jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: (error, query) => {
        return typeof query.state.data === "undefined";
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (typeof query.state.data !== "undefined") {
        toast.error(error.message);
      }
    },
  }),
});
```

With this setup, if there's data in the cache and the query goes into an error state, since the user is most likely already seeing the existing data, we show a toast notification. Otherwise, we throw the error to an `ErrorBoundary`.

By setting up this configuration once globally in your app, you'll never have to worry about error handling in your components again.
