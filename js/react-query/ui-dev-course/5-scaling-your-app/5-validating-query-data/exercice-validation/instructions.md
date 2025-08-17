# Instructions

In this challenge, you'll be validating data inside the query function to ensure the returned data is in the expected shape. For this, you'll be using the zod library, which is already installed in the sandbox. Look at the source code to find out which fields from the response are used in the component. Note that authors and averageRating are optional fields.

Tasks
- Create a schema for the data returned by the book query
- Validate the data returned by the query using the schema
- Turn off retries if the error is a validation error