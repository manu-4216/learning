In this challenge, your task is to create a search component that fetches data from an API on demand. Since we don't want to make a request every time the user types a character, we'll need to debounce the query. We included the useDebounce hook from @uidotdev/usehooks. You can read more about it here. We also created a getData utility function to fetch the data based on the search term.

Using a combination of these tools, create a <BookSearch /> that renders a list of books based on the user's search term. If there are no results, display a <NoResults /> component. To complete the experience, if the query is still executing, display a <Loader /> component.

## Tasks

1. Create a query that fetches data based on a search term
2. Debounce the query so it only updates after the user has stopped typing for 300ms
3. Do not execute the query if the search term is empty
4. Display the <HasNotSearched /> component if the user hasn't executed as search
5. Display the <ErrorMessage /> component if there is an error fetching the data
6. Display the <Searching /> component when the query is executing
7. Display the <NoResults /> component if the query is valid but no results are returned
8. Display the <ResultList /> component with the results of the query

## Expected Result

The final version of your app should look and behave like this:

- no search query: Please search for a book
- search query pending: Searching...
- search query success: display the list of book results
- after the search input edit with delay > debounce: trigger a new search query: Searching...
- if typing a query previously executed: display the cached data right away
