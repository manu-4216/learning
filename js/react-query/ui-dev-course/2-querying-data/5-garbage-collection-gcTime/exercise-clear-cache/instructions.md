In this challenge, let's assume you've gotten a support ticket detailing an issue where the memory consumption of your app is too high. You've done some profiling and found that the cache is not being cleared properly.

After discussing it with some colleagues, you've decided that items can live in the cache for 5 seconds before being cleared. Your goal is to implement a UI that displays a <Loader /> when the data is pending, then displays the data when it's ready. The data should be cleared from the cache after 5 seconds (meaning that subsequent requests should display the <Loader /> again).

Note: We didn't want to add dependencies to this challenge, so we are simulating the routing experience in a simplistic way. We don't expect you to implement this in a real app.

## Tasks

1. Create a query that fetches a book by a given author
2. Create a query that fetches a book by a given id
3. Render a <Loader /> in the <header> if the author data is pending
4. Render a <ResultList /> with the books data if that query is successful
5. If a user clicks on one of the results, render the <BookDetail /> view
6. Display a <LoadingBookDetails /> component while the book data is fetching
7. Clear the cache entries after 5 seconds for both books and authors

## The Result

The final version of your app should look and behave like this:
