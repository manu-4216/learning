We've been slowly checking off all of the different scenarios you'd encounter when fetching data in a real-world web application.

We started with fetching data from a static endpoint, then we introduced dynamic parameters, and then we learned how to fetch data on demand.

This is the next step in our data fetching journey, and it's an important one – fetching data that depends on the result of another request.

While it's usually better to run queries in parallel to minimize the time a user has to wait for data to finish loading, sometimes, this just isn't possible.

As an example, let's fetch some information about a movie and its director. Because it fits conveniently with what we're trying to learn, the API doesn't give us everything we'd want to display up front - it just returns the `id` of the director, which we then have to use to fetch the director's information.

Without React Query, here's what getting that data would look like.

```js
async function fetchMovie(title) {
  const response = await fetch(
    `https://ui.dev/api/courses/react-query/movies/${title}`
  )

  if (!response.ok) {
    throw new Error('fetch failed')
  }

  return response.json()
}

async function fetchDirector(id) {
  const response = await fetch(
    `https://ui.dev/api/courses/react-query/director/${id}`
  )

  if (!response.ok) {
    throw new Error('fetch failed')
  }

  return response.json()
}

async function getMovieWithDirectorDetails(title) {
  const movie = await fetchMovie(title)
  const director = await fetchDirector(movie.director)

  return { movie, director }
}
```

So what would this look like if we combined it with our knowledge of React Query?

## Option 1 - treating dependent queries as a single atomic operation

Well, one way to think about dependent queries is to not think about them as different queries at all. It should be clear by now that the queryFn doesn't need to be coupled to a single fetch.

So one idea you may have had is to do something like this.

```js
fimport * as React from "react"
import { useQuery } from '@tanstack/react-query'
import { fetchMovie, fetchDirector } from './api'

function useMovieWithDirectorDetails(title) {
  return useQuery({
    queryKey: ['movie', title],
    queryFn: async () => {
      // fetch both the movie and director information, and save them together in the cache
      const movie = await fetchMovie(title)
      const director = await fetchDirector(movie.director)

      return { movie, director }
    },
  })
}

function Movie({ title }) {
  const { data, status } = useMovieWithDirectorDetails(title)

  if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return <div>There was an error fetching the information for {title}.</div>
  }

  return (
    <p>
      Title: {data.movie.title} ({data.movie.year})
      <br />
      Director: {data.director.name}
    </p>
  )
}

export default function App() {
  return (
    <Movie title="The Godfather" />
  )
}
```

This works, but there is a tradeoff – it tightly couples our two requests together.

This can be a good thing - for example, we don't have to worry about separate `loading` or `error` states since we only have one query. However, it also means that the data is cached together and with that, comes some downsides.

1. **They will always fetch and refetch together**

Because both requests are in the same query, even if we wanted to, we couldn't just refetch a portion of our data. For example, we can't refetch just the movie without also refetching the director.

For the same reason, we also can't set different configurations (like `staleTime` or `refetchInterval`) for each request.

As far as React Query is concerned, there is only one resource. It doesn't matter that it came from two network requests.

2. **They will error together**

Even if just one of the two requests fail, the entire query will be in an error state.

This may be what you want, or you may still want to show some UI (like the movie information) even if the director's details couldn't be fetched.

3. **There's no de-duplication for either request**

This is probably the **biggest drawback**. Because both requests are under the same `queryKey`, you have no way of knowing if certain data has already been fetched and cached elsewhere.

For example, if you have a second movie that was directed by the same person, you can't reuse the original data and there won't be any request de-duplication. Instead, we'd just make the same request again and store it elsewhere in the cache.

You can see this if you open up the devtools and look at the cache entries – both have the same `director` data, and two requests were made to get it.

```js
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMovie, fetchDirector } from './api'

function useMovieWithDirectorDetails(title) {
  return useQuery({
    queryKey: ['movie', title],
    queryFn: async () => {
      const movie = await fetchMovie(title)
      const director = await fetchDirector(movie.director)

      return { movie, director }
    },
  })
}

function Movie({ title }) {
  const { data, status } = useMovieWithDirectorDetails(title)

  if (status === 'pending') {
    return <div>...</div>
  }

  if (status === 'error') {
    return <div>There was an error fetching the information for {title}.</div>
  }

  return (
    <p>
      Title: {data.movie.title} ({data.movie.year})
      <br />
      Director: {data.director.name}
    </p>
  )
}

export default function App() {
  return (
    <>
      <Movie title='The Godfather' />
      <Movie title='The Godfather Part II' />
    </>
  )
}
```

Again this isn't always bad, but you should be conscious of the tradeoffs you're making when you decide to combine queries like this.

# Option 2 - treating dependent queries as separate operations, one for each entity

In this specific use case, it's probably best to take a different approach so you can avoid the tradeoffs listed above. The reason being, `director` is a totally different entity than `movie`. **If we cache them separately, we'll have more flexibility in how we utilize them throughout our application.**

In a way, you can think of dependent queries as a special form of fetching on demand. However, **instead of delaying the query until an event occurs, you're delaying the query until another query has finished fetching**.

**LAZY QUERIES (1 combined query)**

time: waiting for user input -> [user input] -> query runs

**DEPENDENT QUERIES (2 separate queries, one after the other)**

time: query 1 runs -> [query 1 complete] -> query 2 runs

To do this, let's first split up our `useMovieWithDirectorDetails` hook into two separate hooks: one for fetching the `movie` and one for fetching the `director`.

```js
function useMovie(title) {
  return useQuery({
    queryKey: ['movie', title],
    queryFn: async () => fetchMovie(title),
  })
}

function useDirector(id) {
  return useQuery({
    queryKey: ['director', id],
    queryFn: async () => fetchDirector(id),
    enabled: id !== undefined,
  })
}
```

**Notice that the query for `useDirector` is disabled when `id` is undefined. That's the key to making this work. We only want to fetch the director when we have an `id` to fetch it with**.

We can still even have a `useMovieWithDirectorDetails` hook that abstracts away the logic of combining the two queries.

```js
function useMovie(title) {
  return useQuery({
    queryKey: ['movie', title],
    queryFn: async () => fetchMovie(title),
  })
}

function useDirector(id) {
  return useQuery({
    queryKey: ['director', id],
    queryFn: async () => fetchDirector(id),
    enabled: id !== undefined /* this is the important part */,
  })
}

// convenience hook to combine movie and director fetching
function useMovieWithDirectorDetails(title) {
  const movie = useMovie(title)
  const directorId = movie.data?.director /* dependent queries */
  const director = useDirector(directorId)

  return {
    movie, // contains data, error, etc
    director, // contains data, error, etc
  }
}
```

Notice that the `id` that we're passing to `useDirector` comes from the `movie` query, and when that `id` is `undefined` (which will be the case when the `movie` query is still `pending`), the `director` query will be disabled.

Now, unlike before, we'll get separate cache entries for each `movie`, and a single entry for the `director`. This gives us total control over how we define and use each resource.

With these changes, we will have to handle two separate `loading` and `error` states, but again, that's usually a correct tradeoff to make since it's more flexible. Specifically in this example, it allows us to show our loading indicator and `error` message based on _just_ the `movie` query – regardless of what happens with the `director` query.

```js
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMovie, fetchDirector } from './api'

function useMovie(title) {
  return useQuery({
    queryKey: ['movie', title],
    queryFn: async () => fetchMovie(title),
  })
}

function useDirector(id) {
  return useQuery({
    queryKey: ['director', id],
    queryFn: async () => fetchDirector(id),
    enabled: id !== undefined,
  })
}

function useMovieWithDirectorDetails(title) {
  const movie = useMovie(title)
  const directorId = movie.data?.director
  const director = useDirector(directorId)

  return {
    movie,
    director,
  }
}

function Movie({ title }) {
  const { movie, director } = useMovieWithDirectorDetails(title)

  if (movie.status === 'pending') {
    return <div>...</div>
  }

  if (movie.status === 'error') {
    return <div>Error fetching {title}</div>
  }

  return (
    <p>
      Title: {movie.data.title} ({movie.data.year})
      <br />
      // notice we have more control over loading/error indicator
      {director?.data ? <> Director: {director.data.name}</> : null}
    </p>
  )
}

export default function App() {
  return (
    <>
      <Movie title='The Godfather' />
      <Movie title='The Godfather Part II' />
    </>
  )
}
```

Preview:

```bash
Title: The Godfather (1972)
Director: Francis Ford Coppola

Title: The Godfather Part II (1974)
Director: Francis Ford Coppola
```

React query Devtools:

```bash
2 ["director",1]
1 ["movie","The Godfather"]
1 ["movie","The Godfather Part II"]
```

If you open up the devtools, you'll also notice for the first time that we have two Observers for the same query, `["director", 1]`.

This makes sense, it means both movies (we have 2 `Movie` components) are using the same entry in the cache since they're both located under the same `queryKey`, see `useMovie` -> `useQuery`({ queryKey: ["director", id])}).
