In this challenge, we'll continue to implement a library book checkout. Each book has a checkedOut field that is true if the book is currently checked out. We want to leverage staleTime to display a visual indicator of whether the checkedOut status is up to date.

For this application, we can consider a query to be "stale" after 5 seconds. When the data is stale, we want to display a message under the checkout button that says, "This data is stale. Click here to refresh." (We've created this as a component for you to render.) When the user clicks the refresh link, we want to manually refetch the data. We also want to display a message under the checkout button when a background update is in progress.

## Tasks

1. Create a query that marks the data stale after 5 seconds
2. When the data is stale, display the <StaleMessage /> component under the checkout button
3. Allow the user to manually refresh the stale data using the refetch function returned from useQuery
4. When a background update is in progress, display the <BackgroundUpdateInProgress /> component under the checkout button
5. If the data is up to date and no background update is in progress, display the <UpToDate /> component under the checkout button

### Text to display depending on the state, for a successfuly cached data

First, there should be only the "loading" text being displayed.

Then after the data has been fetched, we will display one of these following texts, in order:

1. When query status success, and not yet stale:

> Everything up to date - go ahead and checkout that book!

2. When query data stale, and not fetching (by default it will not refetch on its own):

> The checkout status may have changed ... <button>Get the latest data</button>

HINT: Use `isStale` returned from `useQuery`.

3. When query data is refeching in the background (this refetch is triggered by hand with `refetch` or other triggers, such as window focus. NOTE: queryKey change to a non-cached book id will show the Loading due to the pending state, and not this message. However, queryKey change to a book which has already been cached WILL trigger the `queryFn` to be invoked, if that cache data is stale based on its last saved date):

> Getting the data...
