import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBook, getReviewById, createStarString } from './utils'
import { Loading, Error } from './MessageComponents'

function useReview(reviewId = 2) {
  return useQuery({
    queryKey: ['reviews', reviewId],
    queryFn: () => getReviewById(reviewId),
  })
}

function useBookDetails(bookId) {
  return useQuery({
    queryKey: ['books', bookId],
    queryFn: () => getBook(bookId),
    // this is the key to making this query dependent on the previus (review) one
    enabled: Boolean(bookId),
  })
}

function ReviewDetail() {
  const reviewQuery = useReview()
  // pass the book id to the dependent query
  const bookQuery = useBookDetails(reviewQuery.data?.bookId)

  // we can hadle either query error at the same time
  if (bookQuery.isError || reviewQuery.isError) {
    return <Error />
  }

  // we render the review as soon as it's loaded. No waiting for the book details
  if (reviewQuery.data) {
    return (
      <main className='book-detail'>
        <div>
          <span className='book-cover'>
            {/* this is rendered conditionally */}
            {bookQuery.data ? (
              <img src={bookQuery.data.thumbnail} alt={bookQuery.data.title} />
            ) : null}
          </span>
        </div>
        <div className='reviews'>
          <h2>Review</h2>
          <ul>
            <li key={reviewQuery.data.reviewId}>
              <h3>{reviewQuery.data.title}</h3>
              <small>by Anonymous</small>
              <span className='book-rating'>
                {createStarString(reviewQuery.data.rating)}
              </span>
              <p>{reviewQuery.data.text}</p>
            </li>
          </ul>
        </div>
      </main>
    )
  }

  return <Loading />
}

export default function App() {
  return (
    <div>
      <header className='app-header'>
        <h1>
          <span>Query Library</span>
        </h1>
      </header>
      <ReviewDetail />
    </div>
  )
}
