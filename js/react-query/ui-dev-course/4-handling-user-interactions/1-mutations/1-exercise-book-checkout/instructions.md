One of the core features of our library app is the ability to check out a book. When a user checks out a book, it will be displayed in the "My Books" panel (and removed when the book is returned). Your job is to implement the ability for a user to check out a book and then display those books in the "My Books" panel. To help you with this challenge we've created a `queries` file that contains all of the queries used to fetch data. This pattern is useful for being able to see the structure of all of the query keys. We also created `checkoutBook` and `returnBook` utilities that perform `POST` requests to the backend. Note that those `POST` requests don't return new data, so we cannot write to the cache directly.

## Tasks

1. Clicking the 'Check Out' button should make a POST request to the backend to check out the book.
2. The 'Check Out' button should display a <Loader /> component while the request is in flight.
3. Display the checked out book in the 'My Books' panel.
4. Clicking the 'Return' button should make a POST request to the backend to return the book.
5. The 'Return' button should display a <Loader /> component while the request is in flight.
6. Remove the returned book from the "My Books" panel.
