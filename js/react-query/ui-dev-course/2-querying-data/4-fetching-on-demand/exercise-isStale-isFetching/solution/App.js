import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import Loader from './Loader'
import {
  UpToDate,
  BackgroundUpdateInProgress,
  StaleMessage,
  ErrorMessage,
} from './MessageComponents'
import { getData, createStarString, getRatingString } from './utils'

// All these messages are returned when the state = success (therefore date is defined)
function CheckoutMessage({ refetch, isStale, isFetching }) {
  // this condition should be checked first, not isStale.
  // If isStale is checked first, then isFetching condition would not return anymore,
  // and when refetching we would still display stale message.
  if (isFetching) {
    return <BackgroundUpdateInProgress />
  }

  // basically this condition is: isStale and !isFetching
  if (isStale) {
    return <StaleMessage refetch={refetch} />
  }

  // basically this returns when !isFetcing and !isStale
  return <UpToDate />
}

// custom hook to abstract away the book getting operation (in this case using react query)
function useBook(bookId) {
  return useQuery({
    // bookId is used in the queryKey. If the id changes, a new cache entry will be created,
    // initially in pending state, thus without data in the cache.
    queryKey: ['book', bookId],
    queryFn: () => getData(bookId),
    // after this time, isStale becomes true. The queryFn will NOT be executed on its own.
    // Only after a trigger (window refetch, remounting, or manual refetch) we will invoke the queryFn again.
    staleTime: 5000,
  })
}

function Book({ bookId }) {
  // note the use of: isFetching, isStale, refetch
  const { data, status, isFetching, refetch, isStale } = useBook(bookId)
  // PS: Here we could have also used `isRefetching` (isFetching && !isPending)

  if (status === 'error') {
    return <ErrorMessage />
  }

  if (status === 'pending') {
    return (
      <main>
        <Loader />
      </main>
    )
  }

  // here below, the status is success, and data cached for that bookId
  return (
    <main className='book-detail'>
      <div>
        <span className='book-cover'>
          <img src={data.thumbnail} alt={data.title} />
        </span>
      </div>
      <div>
        <h2 className='book-title'>{data.title}</h2>
        <small className='book-author'>{data.authors.join(', ')}</small>
        <span className='book-rating'>
          {createStarString(data.averageRating)}{' '}
          {getRatingString(data.averageRating)}
        </span>
        <div className='checkout-wrapper'>
          <button className='primary'>Check Out</button>
          {/* Just pass down the props needed for this component */}
          <CheckoutMessage
            isFetching={isFetching}
            refetch={refetch}
            isStale={isStale}
          />
        </div>

        <div
          className={`book-synopsis`}
          dangerouslySetInnerHTML={{ __html: data.description }}
        />
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
