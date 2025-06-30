For this challenge, you'll be building a "review details" view that displays a single review. Imagine the url for this page is something like /review/2 where 2 is the id of the review to display (you don't need to worry about routing for this challenge). If we fetch the review with an id of 2, we will get back a response that looks like this:

```json
{
  "reviewId": 2,
  "userId": "46555c8fcafe4047b04f541ccd2fd8562f15fd3ce7173c2c654419e53c175df6",
  "bookId": "pD6arNyKyi8C",
  "rating": 5,
  "title": "Enchanting",
  "text": "The Hobbit captivates with its enchanting world and lovable characters, ...",
  "reviewDate": "2023-12-11T19:57:36.529Z"
}
```

As you can see, there is a `bookId` in the response – and because the design for this view includes the thumbnail of the book, we also need to fetch the book details using the `getBook` function. Your challenge is to implement the `useReview` and `useBookDetails` queries so that they return the data needed to render the view. Make sure to render the review as soon as it's available. The thumbnail can be rendered as soon as the book details query is finished.

## Tasks

Create a query that fetches the review details for a given review id
Create a query that fetches the book details for a given book id
Render the <ReviewDetail /> with the data from the review query as soon as it's available
Render the thumbnail of the book once the book query is finished
If there is an error with either query, render an error message
