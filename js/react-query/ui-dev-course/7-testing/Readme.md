# Testing Queries and Mutations

This lesson isn't intended to teach you everything about testing, but to provide a few tips for configuring React Query in your testing environment. These principles work for any automated testing framework, like `Cypress`, `Playwright` or `React Testing Library`.

During this lesson, we'll assume you have a testing framework set up, like `Jest`, `Vitest` or `Cypress`. Since we're rendering React components, it needs to be able to render them to a DOM-like abstraction, like `JSDOM`. Tools like `Cypress` offer their own way to test components.

We'll use `React Testing Library` executed with `Jest`.

Very few developers I know enjoy writing automated tests, but like I tell my 6-year-old on a daily basis, sometimes you have to do things you don't want to do.

Automated tests can come in various shapes and sizes, but they all serve the same purpose – to maximize the odds of your app working as expected, and the more your tests behave like your actual users, the more confidence they can give you.

That's why it's important to test the _right_ things.

When it comes to React Query, it might be tempting to test the custom hooks we write in isolation – think `usePosts` or `useRepos`. However, these hooks are too far removed from how our users actually interact with our app.

Instead, I've found it helpful to test the components that use these hooks. This way, we're testing the actual behavior of our app, not just the implementation details.

The component we'll be testing is the `Blog` component that we've seen a few times throughout the course. The implementation doesn't matter here, but as a reminder, here's how it works.

```text
list of posts. They are clickable. CLicking on one takes you to the post details page
```

Your first intuition might be to do something like this, where you just test that `Blog` renders without crashing using `@testing-library`'s `render` function.

```js
import { render } from "@testing-library/react";
import { Blog } from "./Blog"

describe("Blog", () => {
  test("successful Query", async () => {
    const rendered = render(<Blog />);
  })
})
```

And if you did this, you'd run directly into this very common error:

```diff
-No QueryClient set, use QueryClientProvider to set one
```

The reason for this is because `Blog` uses `useQuery`, which requires that there's a `QueryClientProvider` somewhere above it in the component tree.

We're obviously doing that in our production code, but we're not currently doing it in the test. To fix this, we can do what we usually do – wrap `Blog` inside of a `QueryClientProvider`.

```js
const queryClient = new QueryClient()

const rendered = render(
  <QueryClientProvider client={queryClient}>
    <Blog />
  </QueryClientProvider>
);
```

Much better, now the error should be gone, but we can make it even better.

Rendering with a client is something we'll need quite often, so this is a good opportunity to create a simple abstraction. While we're at it, another thing that we'll want to make sure of is that each test and each `render` call will get their own instance of `QueryClient`.

If we just create a `QueryClient` once, it will be re-used during tests which may lead to inconsistent test results.

```js
function renderWithClient(ui) {
  const testQueryClient = new QueryClient();

  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
}
```

Now we can then use this function instead of calling render directly in our test:

```js
describe("Blog", () => {
  test("successful Query", async () => {
    const rendered = renderWithClient(<Blog />);
  })
})
```

This also shows why it's important to call `useQueryClient()` in your application code instead of just importing the production `QueryClient` directly.

`useQueryClient()` will read from the _nearest_ React Context Provider, and it doesn't care if that contains the production or the test client. If we read from the `QueryClient` directly inside of `Blog`, we wouldn't be able to provide our own client inside our test.

Next, we should take care of customizing the default options of our QueryClient since the React Query defaults are designed to be most helpful for actual users as they are browsing your App, not in a testing environment.

The first option you'll want to adjust is `retry`. By default, React Query will retry a failed query three times. This is great for users, but again, not so great for tests.

If a query fails once in a test, it's likely to fail again, so there's no reason to keep waiting around as React Query retries the request.

```js
function renderWithClient(ui) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false // no need to retry in tests
      }
    }
  });

  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
}
```

Remember, `defaultOptions` only apply if you haven't overwritten them anywhere else (like directly when invoking `useQuery`). That's why it's usually a good idea to override any default options on the `QueryClient` so you have more control when testing.

With that, if we ran our test as is, it would work, but the request would be made to the production API – this is less than ideal for a few reasons, mainly that we have no control.

For example, what would you do if you needed to test a scenario where the API returned a `500` status code? Or what if the API is unavailable when the test runs? Or what if the API is just slow or uses a bunch of resources?

To solve these and other similar problems, developers usually resort to "end-to-end" testing, where you have a dedicated database that resets each time after a test runs. This works, but it's costly and becomes increasingly more difficult to manage as your app grows.

Instead, what if we just _mocked_ any API request in our tests? In this scenario, we'd have full control over how the "API" responds and in turn, how our app behaved in each scenario.

The tool we can recommend for this job is __Mock Service Worker__, which uses a Service Worker to intercept API requests and returns a mocked response. It works in both the browser and Node.js, which means we can use a standard test runner like Jest or Vitest and still have our API mocked.

The idea is pretty simple – whenever a request is made to `/api/articles`, we want to return a static JSON response.

To get there, we need to set up a request _interception_ layer in NodeJS. MSW allows us to do that with the `setupServer` function where we can add Request Handlers. Those handlers will then intercept requests if they match the provided url, and will respond with whatever we decide. Here's what our simple "server" looks like.

```js
const server = setupServer(
  rest.get("*/api/articles", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          title: "1st Post",
          description: "This is the first post",
          path: "/first/post",
        },
        {
          id: 2,
          title: "2nd Post",
          description: "This is the second post",
          path: "/second/post",
        },
      ])
    );
  })
);
```

We can then tell our test framework to start up the server before we start the tests, to reset the handlers in between tests and to clean up after all tests have finished with this code.

```js
// Establish API mocking before all tests.
beforeAll(() => server.listen());
// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());
// Clean up after the tests are finished.
afterAll(() => server.close());
```

Now, when we render our `<Blog />` component, the requests it makes will be intercepted by MSW and the static JSON response will be returned.

From here, we can write some assertions to confirm this behavior, like first waiting for the loading state to appear, followed by an assertion that we can see our post title as a link.

```js
describe("Blog", () => {
  test("successful Query", async () => {
    const rendered = renderWithClient(<Blog />);

    expect(await rendered.findByText("...")).toBeInTheDocument();
    expect(
      await rendered.findByRole("link", { name: "1st Post" })
    ).toBeInTheDocument();
  });
});
```

We can then extend our test to actually click that link and check if we render our detail page correctly as well.

```diff
test("successful query PostList", async () => {
  const rendered = renderWithClient(<Blog />);

  expect(await rendered.findByText("...")).toBeInTheDocument();
  fireEvent.click(
    await rendered.findByRole("link", { name: "1st Post" })
  );

+  expect(await rendered.findByText("...")).toBeInTheDocument();
+  expect(await rendered.findByRole("heading", { name: "1st Post" })).toBeInTheDocument();
+  expect(await rendered.findByText("First post body")).toBeInTheDocument();
});
```

And to make this work, we also need to mock the `post` detail route – `/first/post`:

```js
const server = setupServer(
    rest.get("*/api/articles", (req, res, ctx) => {
    //...
    },
    // add this:
    rest.get("*/api/articles/first/post", (req, res, ctx) => {
        return res(
        ctx.status(200),
        ctx.json({
            id: 1,
            title: "1st Post",
            body_markdown: "First post body",
            path: "/first/post",
        })
    );
  })
);
```

Now that we've tested the happy path, let's see what it looks like to test when things go wrong.

As of right now, we've set up our mock server to return a 200 status code with two articles, but we can override that with what are called runtime request handlers for any given test with `server.use`.

Here's what it looks like.

```diff
test("error on PostList", async () => {
+  server.use(
+    rest.get("*/api/articles", (req, res, ctx) => {
+      return res(ctx.status(500));
+    })
+  );

  const rendered = renderWithClient(<Blog />);

  expect(await rendered.findByText("...")).toBeInTheDocument();
  expect(await rendered.findByText(/Error fetching data/)).toBeInTheDocument();
});
```

Now, for this test only, our request to the `articles` endpoint will return with a `500` status code and since we've turned off retries, we should be able to see the error text immediately after the loading state.

Now MSW is a fantastic tool for mocking API behavior, but sometimes, there's no network API to mock.

For example, what if we had an app that used the `navigator.mediaDevices.enumerateDevices` API to list how many media devices you had on your machine?

```js
const { data, status } = useQuery({
    queryKey: ['mediaDevices'],
    queryFn: async () => {
      return navigator.mediaDevices.enumerateDevices()
    }
  })
```

Since this API doesn't fetch data over the network, we can't use MSW to mock it out – but since the `mediaDevices` API is async, it still makes sense to use it with React Query.

There are three different approaches you can take to solve this.

1. Mock the QueryFunction

As a first attempt, you could mock what the `queryFn` is doing.

For enumerating media devices, you can simply overwrite what `enumerateDevices` returns (and don't forget to re-set the mock between tests):

```js
const original = global.navigator.mediaDevices?.enumerateDevices;

describe("MediaDevices", () => {
  afterEach(() => {
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        enumerateDevices: original,
      },
    });
  });
  test("successful query", async () => {
    // mock
    Object.defineProperty(global.navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: () =>
          Promise.resolve([
            { deviceId: "id1", label: "label1" },
            { deviceId: "id2", label: "label1" },
          ]),
      },
    });
  });
});
```

From there, you can simply render the component and assert that there are two devices.

```js
    const rendered = renderWithClient(<MediaDevices />);

    expect(await rendered.findByText("...")).toBeInTheDocument();
    expect(await rendered.findByText("You have 2 media devices")).toBeInTheDocument();
```

2. Seed the QueryCache

The second approach is to fill the `QueryCache` with data upfront for our specific test, and set a high `staleTime` so that refetches don't occur.

In this approach, since there's data in the cache, the `queryFn` will never be executed. That can be a good thing (if it's difficult to mock), but it also means if something is wrong in the `queryFn` implementation, your test won't catch it.

As you know, to manually get data into the cache you can call `queryClient.setQueryData` – but be sure to call it before rendering the component.

This is a good opportunity to update our `renderWithClient` abstraction.

```diff
-function renderWithClient(ui) {
+function renderWithClient(ui, data = []) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
+        staleTime: Infinity,
      }
    }
  });

+data.forEach(([queryKey, data]) => {
+    testQueryClient.setQueryData(queryKey, data)
+  })
```

You can then pass your initial data to `renderWithClient` to get it into the `QueryCache` upfront.

```js
const rendered = renderWithClient(<MediaDevices />, [
  [
    ["mediaDevices"],
    [
      { deviceId: "id1", label: "label1" },
      { deviceId: "id2", label: "label2" },
    ],
  ],
]);
```

It's also important to know that in this case, our Query will never be in a `pending` state, so you won't be able to assert that the loading state is shown.

```js
test("query with data seeded", async () => {
  const rendered = renderWithClient(<MediaDevices />, [
    [
      ["mediaDevices"],
      [
        { deviceId: "id1", label: "label1" },
        { deviceId: "id2", label: "label2" },
      ],
    ],
  ]);

  expect(await rendered.findByText("You have 2 media devices")).toBeInTheDocument();
});
```

3. Mock useQuery

We don't recommend this, but we wanted to include it as a "last resort" sort of option and the actual solution depends on your testing framework.

Here's a working example of how to get it done in jest:

```js
jest.mock("@tanstack/react-query", () => {
  return {
    ...jest.requireActual("@tanstack/react-query"),
    useQuery: () => {
      return {
        status: "success",
        data: [
          { deviceId: "id1", label: "label1" },
          { deviceId: "id2", label: "label2" },
        ],
      };
    },
  };
});
```

The key part is that you have to require the actual module when mocking the complete `@tanstack/react-query` module since there are other things apart from `useQuery` inside it, like the QueryClient itself.

If we didn't do that, we'd wind up with an error:

```diff
-TypeError: _reactQuery.QueryClient is not a constructor
```

It's also quite tedious to return a complete QueryResult.

In the example above, we've only included the fields that we're currently using (`status` and `data`). This means our test is brittle and can break if we choose to use an additional field provided by `useQuery`, like `isFetching`.

So the recommendation is to favor using one of the other options.


## Testing mutations

Now that we've covered Queries and how to test them, it's time to take a look at their counterpart - `Mutations`.

For this, let's use our Todo list app we worked on in the mutations lesson. As a reminder, here's where we left off – where whenever we add a new todo, we invalidate the `todos/list` query.

```js
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

function useTodos(sort) {
  //...
}

export default function TodoList() {
  const { status, data, isPlaceholderData } = useTodos(sort)
  const addTodo = useAddTodo()

  const handleAddTodo = (event) => {
    event.preventDefault()
    const title = new FormData(event.currentTarget).get('add')
    addTodo.mutate(title, {
      onSuccess: () => event.target.reset()
    })
  })
```

Generally speaking, testing Mutations follows the same principles as testing Queries – you mock the API request and assert that the component behaves as expected. So a natural place to start is to mock our endpoints.

First, similar to what we saw in the previous example, let's create one for our GET request to `/todos/list`.

Now whenever we run our tests and our app makes a request to the `/todos/list` endpoint, it'll get back the list of todos we've defined in our handler.

Now we want to mock the mutation that happens when a POST request is made to `/todos/add`.

```js
const handlers = [
  rest.get("/todos/list", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: "1", title: "Learn JavaScript", done: true },
        { id: "2", title: "Go shopping", done: false },
      ])
    );
  }),
  rest.post("/todos/add", (req, res, ctx) => {
    const { name } = req.body
    return res(
      ctx.status(200),
      ctx.json({ id: "3", title: name, done: false })
    );
  }),
];
```

You'll notice the API is very similar to our GET handler, but now we're using `rest.post` and returning the res invocation.

_NOTE: We don't technically need to send back a new TODO item in the response since we're just invalidating the query anyway, but it's good to know that's an option if you have an API that returns the new item and need to mimic that behavior._

Next is to actually write our test.

Your first intuition may be to do something like this, where you test that any input entered into the input field will be added to the list of todos.

```js
const server = setupServer(...handlers);

// Establish API mocking before all tests.
beforeAll(() => server.listen());
// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());
// Clean up after the tests are finished.
afterAll(() => server.close());

describe("TodoList", () => {
  test("successful mutation", async () => {
    const rendered = renderWithClient(<TodoList />);

    expect(await rendered.findByText("...")).toBeInTheDocument();
    expect(await rendered.findByText(/learn javascript/i)).toBeInTheDocument();
    expect(await rendered.findByText(/go shopping/i)).toBeInTheDocument();

    const input = rendered.getByRole("textbox", { name: /add:/i });

    fireEvent.change(input, {
      target: { value: "Learn TypeScript" },
    });

    fireEvent.submit(input);

    expect(await rendered.findByText(/Learn TypeScript/i)).toBeInTheDocument();
  });
});
```

This is the right idea, but there's one big problem. If you ran this test as is, you'd get this error.

```diff
-Unable to find an element with the text: /learn typescript/i.
```

If you look back at the mock handlers we created, you'll notice that they are _static_.

As is, every request to /todos/list will always return the same two entries ("Learn JavaScript" and "Go Shopping"). That means even if we perform an "update", we'll still just get back those same two entries.

However, because we're invalidating the query onSuccess, we're relying on the fact that making a new request to the server will yield the latest, most accurate data. Clearly that's not happening here.

One solution to this problem would be to set up a mock database and perform real updates against it, but obviously that's a lot of work and new complexity to manage.

Instead, MSW provides a one-time override option that you can set to more accurately represent a "mutation" in your app.

```js
  fireEvent.change(input, {
      target: { value: "Learn TypeScript" },
    });

  // use res.once to override once
  server.use(
    rest.get("/todos/list", (req, res, ctx) => {
      return res.once(
        ctx.status(200),
        ctx.json([
          { id: "1", title: "Learn JavaScript", done: true },
          { id: "2", title: "Go shopping", done: false },
          { id: "3", title: "Learn TypeScript", done: false },
        ])
      );
    })
  );

  fireEvent.submit(input);

  expect(await rendered.findByText(/Learn TypeScript/i)).toBeInTheDocument();
});
```

Now, before we submit our form, we instruct MSW to return a list that will contain our newly added item, making sure our original assertion will pass and the query invalidation will work as expected.