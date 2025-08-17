# Building an Adapter

React Query is one of the most loved libraries in the React ecosystem because it drastically simplifies the mental model for handling asynchronous data.

However, despite its wild popularity, React Query is actually just a thin layer on top of a framework-agnostic core called TanStack Query. What this means is that any library, not just React, can use TanStack Query to reap the benefits of its simplicity.

As of this writing, TanStack Query already has official _adapters_ for React, Vue, Solid, and Svelte – and they all follow the same principles.

1. They create an _Observer_ when a component is created.
Observers are the glue between the data in the cache and the framework's component. Every component needs its own Observer for the entire lifecycle of the component.

2. They _subscribe_ to changes in the Observer.
The QueryCache serves as the central hub for tracking Query states. It knows the query's fetching status, what data is available, and the status of the query.

Observers can subscribe to changes for specific QueryKeys. The cache notifies these observers whenever the state of their subscribed queries changes, ensuring components stay up-to-date with the latest query information.

3. They ensure components update the DOM when a change occurs.
How exactly this happens depends on the framework you're using. In React, we do this by re-rendering the whole component, but frameworks like Solid achieve this via fine-grained reactivity.

So with all that said, we figure what better way to understand how React Query works under the hood than to build your own adapter? And what better library to build one for than a tried and true classic, jQuery?

## 😅A heads up

It's been about a decade since I've written a serious jQuery application, so though this might not be the best jQuery code you've ever seen, hopefully it's good enough to get the concepts across.

The first thing we'll need to do is install the standalone @tanstack/query-core package, which contains all the "low-level" tools we'll need to build an adapter.

```js
npm install @tanstack/query-core
```

From there, let's start with the end in mind. Here's the final jQuery code that we're trying to make work:

```js
import { QueryClient } from "@tanstack/query-core";

$(document).ready(() => {
  const queryClient = new QueryClient();

  $("#app").useQuery({
    queryClient,
    queryOptions: {
      queryKey: ["repoData", "query"],
      queryFn: async () => {
        console.log("fetching...");
        const { data } = await axios.get(
          "https://api.github.com/repos/TanStack/query"
        );
        return data;
      },
      staleTime: 2 * 1000,
    },
    update: (_event, { status, error, data }) => {
      if (status === "pending") {
        $("#app").text("loading...");
      } else if (status === "error") {
        $("#app").text(`Something went wrong: ${error.message}`);
      } else {
        $("#app").text(`${data.name}: ${data.description}`)
      }
    },
  })
})
```

When our `#app` is ready, we'll call our custom jQuery UI widget, `useQuery`, passing it a `queryClient` and some `queryOptions` that you're already familiar with.

Then, whenever the Observer detects a change, it'll call `update`, updating the UI.

Now let's dive into our adapter.

In order to create our custom jQuery UI widget, we can use $.widget, passing it the name of our widget – `useQuery` and giving it a _create method. You can think of _create as the constructor of our widget.

```js
$.widget("custom.useQuery", {
  _create() {

  }
})
```

Now you've got to admit it...
From there, we need to take the `queryClient` and `queryOptions` that were passing in when we invoked $("#app").useQuery({}) and instantiate a new `QueryObserver` with them.

Similar to props, you can get access to the `queryClient` and `queryOptions` via this.options.

```js
import { QueryObserver } from "@tanstack/query-core";

$.widget("custom.useQuery", {
  _create() {
    this._observer = new QueryObserver(
      this.options.queryClient,
      this.options.queryOptions
    );
  }
})
```

Now that we have our Observer, the next thing we need to do is subscribe to it so that we can be notified of any changes. To do that, we can call the aptly named subscribe method.

```js
import { QueryObserver } from "@tanstack/query-core";

$.widget("custom.useQuery", {
  _create() {
    this._observer = new QueryObserver(
      this.options.queryClient,
      this.options.queryOptions
    );

    this._observer.subscribe(() => {
      
    });
  }
})
```

Similar to React, whenever we subscribe to something, we need to make sure we unsubscribe from it as well so we don't get any memory leaks.

To unsubscribe from our Observer, we can call the `unsubscribe` method that `subscribe` returns. We'll do this inside of our widget's _destroy method.

```js
import { QueryObserver } from "@tanstack/query-core";

$.widget("custom.useQuery", {
  _create() {
    this._observer = new QueryObserver(
      this.options.queryClient,
      this.options.queryOptions
    );

    this._unsubscribe = this._observer.subscribe(() => {
      
    });
  },
  _destroy() {
    this._unsubscribe();
  }
})
```

So far, so good.

Now that we're subscribed to changes on our Observer, let's actually do something when a change does occur.

First, we'll want to get the current state of the Query. To do that, we can call the getCurrentResult method on our Observer.

```js
import { QueryObserver } from "@tanstack/query-core";

$.widget("custom.useQuery", {
  _create() {
    this._observer = new QueryObserver(
      this.options.queryClient,
      this.options.queryOptions
    );

    this._unsubscribe = this._observer.subscribe(() => {
      const result = this._observer.getCurrentResult();
    });
  },
  _destroy() {
    this._unsubscribe();
  }
})
```

And now that we have the state of the query, we need to invoke the update callback that we passed in when we called $("#app").useQuery({}) with that state.

To do that, we can use jQuery's built-in `_trigger` function – passing it the name of the event (update), the event itself (which is irrelevant here so we'll just pass it null), and any data we want to pass along (in this case, the result).

```js
import { QueryObserver } from "@tanstack/query-core";

$.widget("custom.useQuery", {
  _create() {
    this._observer = new QueryObserver(
      this.options.queryClient,
      this.options.queryOptions
    );

    this._unsubscribe = this._observer.subscribe(() => {
      const result = this._observer.getCurrentResult();
      this._trigger("update", null, result);
    });
  },
  _destroy() {
    this._unsubscribe();
  }
})
```

Now whenever our Observer detects a change, it'll call our `update` callback with the latest state of the query which will then update the UI – nice.

At this point, we have a basic adapter around the Query core. With this, we'll get automatic refetching, caching, request deduplication, auto garbage collection, and retries.

There are, however, just a couple more things we can add to make it even better.

In order to subscribe to browser events that enable automatic refetches on `windowFocus` and `reconnect`, we have to mount our `QueryClient`.

In React, this is the job of the `QueryClientProvider`. Since we obviously don't have something like that currently, we can also do it inside `_create` (and the cleanup in the `_destroy` function).

It doesn't matter that this might get called multiple times - the QueryClient will dedupe those and only call subscribe once.

```js
import { QueryObserver } from "@tanstack/query-core";

$.widget("custom.useQuery", {
  _create() {
    this.options.queryClient.mount()
    this._observer = new QueryObserver(
      this.options.queryClient,
      this.options.queryOptions
    );

    this._unsubscribe = this._observer.subscribe(() => {
      const result = this._observer.getCurrentResult();
      this._trigger("update", null, result);
    });
  },
  _destroy() {
    this.options.queryClient.unmount()
    this._unsubscribe();
  }
})
```

Next, we need to give the consumer of our widget the ability to dynamically update the `queryOptions` that they pass in. Right now, if they were to dynamically change one of the options, nothing would happen.

To do this, we can use the `_setOption` method that the widget provides. This method will get called whenever a consumer of our widget calls `$("#app").useQuery("option", "queryOptions", newQueryOptions)` – again, giving them the ability to dynamic swap out their queryOptions.

Whenever `_setOption` is called, we'll check if the key is `queryOptions` and if it is, we'll call the `setOptions` method on our Observer with the new options.

```js
import { QueryObserver } from "@tanstack/query-core";

$.widget("custom.useQuery", {
  _create() {
    this.options.queryClient.mount()
    this._observer = new QueryObserver(
      this.options.queryClient,
      this.options.queryOptions
    );

    this._unsubscribe = this._observer.subscribe(() => {
      const result = this._observer.getCurrentResult();
      this._trigger("update", null, result);
    });
  },
  _setOption(key, value) {
    this._super(key, value);

    if (key === "queryOptions") {
      this._observer.setOptions(value);
    }
  },
  _destroy() {
    this.options.queryClient.unmount()
    this._unsubscribe();
  }
})
```

And finally, a little performance optimization.

We know that the QueryCache informs the Observer about every change that happens to the query, but as we saw in the performance optimization lesson, the observer can still decide to not render the component if the change is irrelevant to it. After all, if a field changes that the component doesn't care about, there's no point in letting the subscriber know about it.

This feature is called property tracking and it's turned on by default for React Query, but not for the Query Core since some frameworks (like Solid) can do this on their own.

If we want this optimization for our jQuery adapter as well, we need to opt into it by wrapping the result that our update callback receives with the Observer's trackResult function.

```js
import { QueryObserver } from "@tanstack/query-core";

$.widget("custom.useQuery", {
  _create() {
    this.options.queryClient.mount()
    this._observer = new QueryObserver(
      this.options.queryClient,
      this.options.queryOptions
    );

    this._unsubscribe = this._observer.subscribe(() => {
      const result = this._observer.getCurrentResult();
      this._trigger(
        "update", 
        null, 
        this._observer.trackResult(result)
      );
    });
  },
  _setOption(key, value) {
    this._super(key, value);

    if (key === "queryOptions") {
      this._observer.setOptions(value);
    }
  },
  _destroy() {
    this.options.queryClient.unmount()
    this._unsubscribe();
  }
})
```

With that, the `update` callback will now only ever be called if one of the properties on the result has changed and our adapter is complete.

I hope this experiment has demonstrated the ease of building a framework-specific adapter on top of the Query Core.

At its heart, TanStack Query is a conceptual approach to managing asynchronous state. The core principles remain consistent, with only the implementation details varying to suit each framework's unique characteristics.