In this challenge, our goal is to implement an infinite scroll feature for our app. To accomplish this, we are going to need a few different things. First, we've prepared a `useInView` hook. This hook allows us to detect when an element is visible in a scroll container and gives us an `onChange` callback that we can use to trigger a data fetch.

```js
const rootRef = React.useRef(null)

const { ref } = useInView({
  threshold: 0,
  root: rootRef.current,
  rootMargin: '40px',
  onChange: (inView) => {
    // you can handle data fetching here
  },
})

// attach the ref to the element we want to observe
;<ol ref={rootRef}>
  <li ref={ref} />
</ol>
```

Our API endpoint returns an object that looks like this:

```json
{
  activities: Array(10),
  currentPage: 1,
  totalPages: 12,
  totalItems: 116,
}
```

We created a getActivity function that takes in a page argument and returns the data from the API.

## Tasks

1. Fetch the first page of data when the component mounts
2. Render the activities in the activity feed
3. Attach an element at the end of the list with the `ref` returned from `useInView` if we have more pages
4. If that element becomes visible, fetch the next page of data
5. Display the `NoMoreActivities` component if there are no more pages

## The Result

The final version of your app should look and behave like this:

```HTML render
Latest activity

Someone just joined Query Library .
6 minutes ago

Someone just joined Query Library .
33 minutes ago

Someone left a review for The Hobbit.
4 hours ago

No more activities - back to top
```
