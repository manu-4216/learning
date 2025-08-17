# Validating Query Data

When writing software, it's healthy to follow the old Russian proverb – "Trust, but verify".

Trust that the code you write is correct, but verify that assumption across several layers of your code.

For example, let's say we defined an array of objects.

```js
const data = [
  {
    id: 1,
    name: 'Dominik',
  },
  {
    id: 2,
    name: 'Tyler',
  },
]
```

Now, let's write a function that takes this data and returns a greeting for each person:

```js
function getGreetings(input) {
  return input.map(({ name }) => `Hello, ${name.toUpperCase()}`)
}
```

The first layer of verification may be to write a test for the function like this:

```
describe('getGreetings', () => {
  it('should return greetings', () => {
    const input = [
      {
        id: 1,
        name: 'Dominik',
      },
      {
        id: 2,
        name: 'Tyler',
      },
    ]
    expect(getGreetings(input))
      .toEqual(['Hello, DOMINIK', 'Hello, TYLER'])
  })
})
```

And if we were using TypeScript, the second layer of verification would be to add type definitions to the function itself, like this:

```ts
function getGreetings(input: ReadonlyArray<{ name: string }>) {
  return input.map(({ name }) => `Hello, ${name.toUpperCase()}`)
}
```

Regardless, because we were the ones who created the `data` object, we know exactly what the shape of the object is and we can build our layers of verification around that.

Sadly, this isn't the case when we're dealing with data from third-party APIs. Yes, we can make a one off request and inspect the shape of the response, but there's no guarantee that the shape will be the same for all responses in the future.

In fact, you could argue that the most common cause of bugs in web apps is due to the misalignment in the shape of the data that a developer expects, and the actual shape of the data that they receive.

To make it worse, these types of bugs are inherently difficult to track down as they usually lead to an error message that could originate from a variety of places.

```diff
-Uncaught TypeError: Cannot read properties of undefined (reading 'name')
```

Luckily, there's a proven way to regain the confidence in async data, even from APIs that may be unpredictable – __validation__.

When you see the word validation, as a web developer, the first thing that probably comes to mind is input validation. Any input we get from a user, we need to validate it – whether for UX reasons on the frontend or security reasons on the backend.

And if you think about it, there's not a huge difference between input we get from a user and data we get from a _third-party API_. Both are _untrusted_ sources of data that we need to handle with care.

A library that works very well for this, particularly with React Query, is __zod__.

zod is a schema validation library that lets you define the expected shape of a response and then validates the actual response against that schema.

In a way, it acts as a gate where data that doesn't match the schema cannot make its way through. This makes it a perfect solution to integrate with React Query and specifically, any `queryFn`.

To demonstrate this, let's throw it back to the very first lesson in the course with our Pokémon example.

As a reminder, here's what we had:

```js
async function fetchPokemon(id) {
  const url = `https://pokeapi.co/api/v2/pokemon/${id}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('fetch failed')
  }

  return response.json()
}

// ... 
```

Now by looking at the JSX, you'll notice that our UI is reliant upon 3 values, `id`, `name`, and `sprites.front_default`.

So with zod, we can create a schema that represents that shape that we expect.

```js
const pokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  sprites: z.object({
    front_default: z.string().url(),
  }).optional(),
});
```

And then once we get a response back from the API, we can validate it against our schema with zod's `parse` method:

```js
async function fetchPokemon(id) {
  const url = `https://pokeapi.co/api/v2/pokemon/${id}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('fetch failed')
  }

  const data = await response.json()
  return pokemonSchema.parse(data) // here
}
```

There are two interesting things happening here that you may have missed.

First, if you open up the Data Explorer in the React Query Devtools, you'll notice that the data in the cache at `pokemon/1` is just those three values in our schema – `id`, `name`, and `sprites.front_default`.

The reason for this is because _zod strips out any additional fields_ that are on the response object, but not in our schema. This ensures that we're not storing unnecessary values in the cache, which can reduce the amount of memory needed – especially when dealing with large responses like the Pokémon API gives.

!!Second, the reason why zod integrates so well with React Query is because by default, it will _throw an error_ when the response doesn't match the provided schema. In doing so, zod treats invalid responses the same as if the request failed. And conveniently, any error is all React Query needs to go into an `error` state.

## For TypeScript Users
zod is a TypeScript-first schema validation library with static type inference, which mean when we create a zod schema, we don't have to manually define our types anymore. The result from calling the parse method will be correctly typed according to the schema, and it's also ensured that the response adheres to the schema at `runtime`.

This is great because it means we no longer have to rely upon manually defined types. For access to the type itself, zod provides a helper method `z.infer`:

```js
const pokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  sprites: z.object({
    front_default: z.string().url(),
  }).optional(),
});

type Pokemon = z.infer<typeof pokemonSchema>
```

The more we can trust the data that enters our application from external sources, the more we can trust our code and application as a whole.

However, performing runtime validation is not free, and it incurs overhead. Network responses must be inspected, analyzed, and their types verified at runtime. This can be __expensive__ if the responses are large and we have to frequently parse them.

As always, this is a tradeoff that we must consider. If you have control over the API that you are querying, it might be sufficient to trust that it returns what it claims. Otherwise, you may want to consider validating the data.