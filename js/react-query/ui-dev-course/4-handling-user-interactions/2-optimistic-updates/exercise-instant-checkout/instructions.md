In this challenge, we are revisiting the experience for checking out a book. We want to make this process feel instantaneous by updating the UI as soon as the user clicks the "Check Out" button.

Your job is to refactor the code to implement optimistic updates. In order to accomplish this you will need to know about the shape of the data our books UI is expecting.

```ts
interface Book {
  id: string;
  title: string;
  authors: Array<string>;
  publisher: string;
  publishedDate: string;
  description: string;
  thumbnail: string;
  previewLink: string;
  averageRating: number;
  availableCopies: 0 | 1 | 2 | 3 | 4 | 5;
  isCheckedOutByUser: boolean;
}
```

## Tasks

- When a user clicks the Check Out button, the UI should update immediately to reflect the change
- The book should immediately show up in the 'My Books' section of the UI
- If there is an error checking out the book, the UI should revert back to its original state
- In any case, invalidate the queries to get the latest server state after the request
- If a user clicks the Return button, the UI should update immediately to reflect the change
- The book should immediately be removed from the 'My Books' section of the UI
- If there is an error returning the book, the UI should revert back to its original state
- In any case, invalidate the queries to get the latest server state after the request
