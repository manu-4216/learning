# Performance optimisation

## React rerenders in general

If you've been building React apps for any amount of time, you may have experienced this scenario.

Your app is coming along nicely, when suddenly you notice it – a rendering issue. Nothing major, just a few stutters here and there.

So you do what any good developer would do, you open up the React devtools and notice that one of your components is rendering way more often than it should be. This isn't always an issue, but in this particular app you have a few expensive child components which are noticeable.

While it's usually a good idea to find ways to make the components render faster rather than render less – sometimes, it's unavoidable.

Thankfully, React itself gives us a few options to solve these problems – and to make sure we're on the same page, let's do a speed run of some React rendering fundamentals.

When it comes to rendering, the way React works is that whenever state changes, it will re-render the component that owns that state and all of its child components – regardless of whether or not those child components accept any props.

```text
Interactive diagram that shows a component’s state changing and React re-rendering it and all its child components
```

We can see this in action with this basic app. Notice that every time you click the button, even though the Wave component doesn't rely on any props, it still re-renders.

```jsx
// Wave.js
import * as React from "react";

function Wave() {
  console.count("Rendering Wave");
  return (
    <span role="img" aria-label="hand waving">
      👋
    </span>
  );
}

export default Wave;

// App.js
const App = () => {
  return (
    <>
      <Wave />
    </>
  );
};
```

To opt out of this default behavior and only re-render when props actually change, you can use React's `React.memo` higher-order component.

```jsx
export default React.memo(Wave);
```

Now, regardless of how many times we click our button, Wave will only render once, on the initial render.

But what happens if we make our `Wave` component a little more configurable.

Instead of receiving no props, let's pass it an `options` prop that we can use to configure the emoji. Specifically, we'll allow the consumer of `Wave` to be able to configure the emoji skin `tone` as well as if it's `animated`.

And if we refactor our app, here's how it behaves.

```jsx
<Wave options={{ animate: true, tone: 4 }} onClick={handleClick} />

// usage:
const [index, setIndex] = React.useState(0)

const handleClick = () => {
  setIndex(index + 1)
}

const options = {
  animate: true,
  tone: waveIndex
}
<Wave onClick={handleClick} options={options} />
```

That works great, but can you spot the problem now? Change the greeting and see what happens. Even though we're using `React.memo`, our `Wave` component is back to re-rendering every time `index` changes even though it doesn't rely on index at all.

Can you spot why that is? Here's a clue – it has to do with **referential equality**.

The way `React.memo` works is it'll only re-render the component when its props change. But that brings up an interesting question, how exactly does React determine if the props have changed? Simple, with the `===` identity operator.

The way our `Wave` component works is we're passing it two props, `options` and `onClick` – both of which are reference values.

```jsx
<Wave options={{ animate: true, tone: 4 }} onClick={handleClick} />
```

Because reference values are compared by their location in memory, even though the function looks the same and the properties on the object stay the same, we're technically creating and passing a brand new object and function on every render – nullifying the benefits of `React.memo`.

So how do we fix this? Well, we need to figure out a way for the values we pass as a props to be **referentially consistent** across renders.

Thankfully, React gives us some hooks for this – `useMemo` and `useCallback`.

Defined, `useMemo` lets you cache the result of a calculation between renders and `useCallback` lets you cache the function itself – keeping both referentially stable.

To memoize our `options` object, we can do something like this.

```jsx
const options = React.useMemo(() => {
  return {
    animate: true,
    tone: waveIndex,
  };
}, [waveIndex]);
```

And to memoize our `handleWaveClick` function, we can do something like this.

```js
const handleClick = React.useCallback(() => {
  setIndex(index + 1);
}, []);
```

And if we throw both of those into our app, we can see that our `Wave` component is now back to only rendering when it changes.

## Back to React Query

OK, so what does all of this have to do with React Query?

Well if you think about it, shouldn't this all be a massive problem for React Query?

Any time you call `useQuery`, you get back a brand new object (reference value). Unless React Query memoizes that value and you wrap your components in `React.memo`, basically your entire component tree will re-render every time a Query runs – which as we've seen, is a lot.

## React Query internal performance optimizations

Obviously if this were the case, React Query would be close to irrelevant. So how do we solve this? Two ways: `Structural Sharing` and `Observers`.

NOTE: you can pass `structuralSharing`: `false` as an option to your query, in which case React Query won’t do the comparison. You can also pass a function to do your own comparison.

Whenever a query runs and the `queryFn` is invoked, you're almost always going to give React Query back a _new object_ (usually in the form of `res.json()`).

However, instead of putting that object in the query cache immediately and then returning it as data, React Query will first check to see if any of the properties and values on the object have **actually changed**.

If they have, then React Query will create a new data object and give you that. But if they haven't, instead of creating a new object or reusing the one you gave it, React Query will just **reuse the same object as before** – keeping the reference **the same**.

This optimization allows you to use the data object with `React.memo` or include it in the dependency array for `useEffect` or `useMemo` without worrying about unnecessary effects or calculations.

> However, this is only half of the equation. As we saw earlier, even with structural sharing, you'd still need to wrap your components in React.memo to prevent them from re-rendering every time a Query ran.

This is where `Observers` come in.

`Observers` are the glue between the Query Cache and any React component, and they live outside the React component tree.

What this means is that when a `queryFn` re-runs and the Query cache is updated, at that moment, the Observer can decide whether or not to inform the React component about that change.

We can see this in action with a simple example.

```jsx
const { data, refetch } = useQuery({
  queryKey: ["user"],
  queryFn: () => {
    console.log("queryFn runs");
    return Promise.resolve({
      name: "Dominik", // this might change
    });
  },
});

// Use: return <button onClick={() => refetch()}>
```

Notice that even though our `queryFn` runs every time we manually invoke the `queryFn` with `refetch`, because the data hasn't changed, the Observer is smart enough to know that the component doesn't need to re-render.

Now here's a question I want you to think through. What do you think will happen if we add a new property to the object that the `queryFn` returns, but this property 1. changes every time `queryFn` is invoked but 2. isn't used by the component?

In a sense, I'm asking you how smart do you think the Observer actually is.

```jsx
queryFn: () => {
  console.log("queryFn runs");
  return Promise.resolve({
    name: "Dominik",
    updatedAt: Date.now(), // additional property, each time different, but unused
  });
};
```

Is it smart enough to know that the component doesn't need to re-render since it doesn't use the `updatedAt` property?

Try it out.

Though the Observer is smart enough to know that it doesn't need to re-render the component when its data doesn't change, it's _not_ smart enough to know about what data the component actually uses.

Thankfully, with a little help from us, we can make the Observer a little smarter.

If your `queryFn` returns extra `data` that isn't needed in the component, you can use the `select` option to filter out the data that the component doesn't need – and therefore, **subscribe to a subset** of the `data` and only re-render the component when necessary.

It works by accepting the data returned from the `queryFn`, and the value it returns will be passed along to the component.

```jsx
const { data, refetch } = useQuery({
  queryKey: ["user"],
  queryFn: () => {
    console.log("queryFn runs");
    return Promise.resolve({
      name: "Dominik",
      updatedAt: Date.now(),
    });
  },
  select: (data) => ({ name: data.name }), // this will fix the issue
});
```

Now if we throw this into our app, notice how it behaves.

Even though the `updatedAt` property changes every time the `queryFn` runs, the component no longer re-renders since we've filtered that value out using `select`.

Again, this all works because the Observer is decoupled from the component and therefore, can make high level rendering decisions.

And you also may have noticed that _referential equality_ is _irrelevant_ to `select`. Again, as far as React Query is concerned, the content of the data is what matters, not the reference.

### For TypeScript Users

The type of `data` is derived from what `select` returns. In our above example, what the `queryFn` returns is going to be an Object with:

```ts
type Data = { name: string; updatedAt: number };
```

After the transformation with `select`, if we destruct it from `useQuery`, it will be of type `{ name: string }` only.

And if your `select` transformation happened to be prohibitively expensive, you could always memoize it with `useCallback` so that it only runs when necessary.

```js
select: React.useCallback(expensiveTransformation, []);
```

## Tracked Properties

So at this point it's clear that, when it comes to data, React Query tries to be as performant as it can by both keeping its reference stable when possible, and only re-rendering components when necessary via the Observer.

However, when you invoke `useQuery`, you're not just getting back data, but an entire object that represents everything about the query itself – including the `status`, `fetchStatus`, `error`, etc.

Despite the performance benefits of how React Query handles data, it would be all for nothing if a component still had to re-render whenever any of the properties on the Query object changed.

And to make it worse, as you've seen, properties like `fetchStatus` are changing often as React Query is always making background refetches to ensure the data is fresh.

So how do we solve this one? With a really interesting feature we call **Tracked Properties**.

When React Query creates the result object returned from `useQuery`, it does so with custom _getters_.

Why is this important? Because it allows the Observer to understand and keep track of which fields have been accessed in the render function and in doing so, only re-render the component when those fields actually change.

For example, if a component doesn't use `fetchStatus`, it doesn't make sense for that component to re-render just because the `fetchStatus` changes from `idle` to `fetching` and back again. It's Tracked Properties that make this possible and ensure that components are always up-to-date, while keeping their render count to the necessary minimum.

### 👁️ Just be sure that...

When you invoke `useQuery`, you'll want to do so _without_ using the `rest` operator.

So for example, this is fine:

```js
const { data, error } = useQuery({ queryKey, queryFn });
```

and this is fine:

```js
const result = useQuery({ queryKey, queryFn });

result.data;
result["error"];
```

But this, is a bad idea:

```js
const { data, ...rest } = useQuery({ queryKey, queryFn });
```

The reason for that is if you use the ...rest operator, React Query will have to invoke all the custom getters, negating any of the performance benefits you'd get by not re-rendering when you don't need to.

Just to be sure, the Query eslint-plugin also has a [rule](https://tanstack.com/query/v5/docs/react/eslint/no-rest-destructuring) to check for these scenarios.

So at this point we've covered different render optimizations that React Query makes under the hood, and some that you can do yourself (like `select`). However, it's not just rendering that can be optimized, but fetches as well.

## Optimizing fetches

In an ideal world, every user would have fast, unlimited internet. As you know, we live in a dark, cruel, unforgiving world and that's not always the case.

Thankfully, as you've seen, React Query does a pretty decent job out of the box accommodating for all types of connections.

One way is instead of constantly fetching and then refetching, React Query will only refetch stale data based on _signals_ from the user. Of course, you can adjust this by configuring `staleTime`, but that isn't always enough.

For example, say you had an app with a non-debounced search input field that fetched some data. Each keystroke would create a new query, firing off multiple requests in short succession. There's nothing you can do to `staleTime` to fix that.

And it may be surprising to learn that by default, React Query will _let_ all of those queries _resolve_, even though you're likely only interested in the _latest_ response.

The advantage of this approach is that it'll fill up the cache for data you may potentially need later. The downside, of course, is **wasted resources** – both on the client and the server.

It's up to you to decide if you like that behavior, but if you don't, React Query gives you the option to opt out of it with help from the **Abort Controller API**.

Here's how it works.

When React Query invokes a `queryFn`, it will pass to it a `signal` as part of the `QueryFunctionContext`. This signal originates from an `AbortController` (that React Query will create) and if you pass it to your fetch request, React Query can then _cancel_ the request if the Query becomes unused.

```jsx
function useIssues(search) {
  return useQuery({
    queryKey: ['issues', search],
    queryFn: ({ signal }) => {
      const searchParams = new URLSearchParams()
      searchParams.append('q', `${search} is:issue repo:TanStack/query`)
        const url = `https://api.github.com/search/issues?${searchParams}`

        // pass the signal here
        const response = await fetch(url, { signal })

        if (!response.ok) {
          throw new Error('fetch failed')
        }

        return response.json()
      }
  })
}
```

And if we throw this into an app, you can see that all the query entries are created, all the requests fire immediately, but _only the last one will be put in the cache_, with the others all being _canceled_. Warning: they do however still hit the server, and consume its resources.

Regardless of which optimization technique you use, it's important to understand that you do have options when you need them.
