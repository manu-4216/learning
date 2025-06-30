In this challenge, you'll be adding pagination to the Query Library. To assist you with this, we've created a `Pagination` component that you can use.

```jsx
<Pagination totalPages={100} activePage={1} setActivePage={() => {}} />
```

Your job is to implement a query that can fetch a page of results from the API using a `getData` function. The `getData` function takes two arguments: a search term (which we've hard-coded to "The Lord of the Rings" for this challenge) and a page number. It returns an object with the following properties:

```js
const { books, totalPages, currentPage } = await getData(
  'The Lord of the Rings', // the search term
  1 // page number
)
```

Finally, to make the pagination experience feel faster (and to avoid showing spinners), display the previous page's data while the next page's data is loading.

Note: This API's pagination starts at 1, not 0.

## Tasks

- When a user clicks on the next page button, fetch the next page of results
- When a user clicks on the previous page button, fetch the previous page of results
- When a user clicks on a page number, fetch that page of results
- Display the previous page's data while the next page is loading
- Set the opacity of the of the <BookList /> to .5 when the data is placeholder data
