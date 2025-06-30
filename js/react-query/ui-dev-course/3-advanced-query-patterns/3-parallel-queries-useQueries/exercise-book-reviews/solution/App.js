import * as React from 'react'
import { useQueries } from '@tanstack/react-query'
import { getBook, getReviewsForBook } from './utils'
import ReviewFormSection from './ReviewFormSection'
import ReviewsSection from './ReviewsSection'
import BookDetails from './BookDetails'
import { Error, Loading } from './MessageComponents'

function useBookDetails(bookId) {
  // be default, useQueries returns an array of results
  return useQueries({
    queries: [
      {
        queryKey: ['book', { bookId }],
        queryFn: () => getBook(bookId),
      },
      {
        queryKey: ['reviews', { bookId }],
        queryFn: () => getReviewsForBook(bookId),
      },
    ],
    // If we define a combine, the return of this useQueries hook can be changed
    combine: (queries) => {
      const isPending = queries.some((query) => query.status === 'pending')
      const isError = queries.some((query) => query.status === 'error')
      // the order of the array items is the same as the `queries` parameter above
      const [book, reviews] = queries.map((query) => query.data)

      // return a single combined object of the results of the 2 queries
      return {
        isPending,
        isError,
        book,
        reviews,
      }
    },
  })
}

function Book({ bookId }) {
  const { isPending, isError, reviews, book } = useBookDetails(bookId)

  if (isError) {
    return <Error />
  }

  if (isPending) {
    return <Loading />
  }

  return (
    <main className='book-detail'>
      <div>
        <span className='book-cover'>
          <img src={book.thumbnail} alt={book.title} />
        </span>
      </div>
      <div>
        <BookDetails book={book} />
        <ReviewFormSection />
        <ReviewsSection reviews={reviews} />
      </div>
    </main>
  )
}

export default function App() {
  const [selectedBookId, setSelectedBookId] = React.useState('pD6arNyKyi8C')

  return (
    <div>
      <header className='app-header'>
        <h1>
          <span>Query Library</span>
        </h1>
        <div className='select'>
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
          >
            <option value='pD6arNyKyi8C'>The Hobbit</option>
            <option value='aWZzLPhY4o0C'>The Fellowship Of The Ring</option>
            <option value='12e8PJ2T7sQC'>The Two Towers</option>
            <option value='WZ0f_yUgc0UC'>The Return Of The King</option>
          </select>
        </div>
      </header>

      <Book bookId={selectedBookId} />
    </div>
  )
}
