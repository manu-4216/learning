In this challenge, we have included the `react-error-boundary` library. This library allows us to wrap our components in an `ErrorBoundary` component that will catch any errors that occur in the component tree below it. As your app scales, moving to a declarative error handling approach like this will make it easier to manage errors in your app.

To simulate a situation where you might encounter an error, we have included a "Missing Book" option that will return a 400 error. Your job is to use an `ErrorBoundary` to catch this error and display a message to the user that gives them the option to reset the app.

## Tasks

- Ensure that React Query passes errors to the `ErrorBoundary` component
- Catch the error and display an `Error` component
- Reset the app to the initial state when the button in the `Error` component is clicked
- Limit the retries to 1 for the Book query
