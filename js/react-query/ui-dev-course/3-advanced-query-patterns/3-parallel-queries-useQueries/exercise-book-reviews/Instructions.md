# Instructions

In this challenge, we're adding reviews to the Book Details view. As this feature was being designed, the team decided that the reviews should be cached separately from the book details (to make it easier to add, edit and delete the dynamic review data). This means that the reviews will be fetched in parallel with the book details.

Your job is to write a custom hook that fetches the book details and reviews in parallel and returns them as a single object, which the UI can use to render the book details and reviews. The API for your custom hook should look like this:

```js
const { isPending, isError, reviews, book } = useBookDetails(bookId)
```

The book query should be cached with a key ["book", { bookId }], and the reviews query should be cached with a key ["reviews", { bookId }].

## Tasks

- If any query is "pending", the isPending flag should be true
- If any query has an error, the isError flag should be true
- If all queries are successful, the reviews and book should be returned
- Each query should have its own cache entry
