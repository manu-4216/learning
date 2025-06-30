In this challenge, we have an activity feed that shows when new users join the library, when books are checked out or returned, and when someone leaves a review. Since we want to show the latest activity, we need to poll the server for new data every 5 seconds. We also want to show the timestamp of the last data fetch, which can be accessed via the dataUpdatedAt property of the query result. We've included a utility to format the timestamp for you called formatDate.

## Tasks

1. Create a query that polls the server for new activity every 5 seconds
2. Render the activity feed with the latest data
3. Display a "Latest activity as of" with the formatted timestamp of the last data fetch

## The Result

The final version of your app should look and behave like this:
