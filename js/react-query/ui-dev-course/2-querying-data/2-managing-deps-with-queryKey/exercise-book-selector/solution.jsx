import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { createStarString, getRatingString } from './utils'
const BASE_URL = 'https://library-api.uidotdev.workers.dev'

// In order to make our query dynamic, we need to pass the
// bookId to the query key as well as the query function.
// Doing this in a custom hook will make it easier to reuse.
async function getData(bookId) {
  const url = `${BASE_URL}/books/${bookId}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Unable fetch data')
  }

  const data = await response.json()
  return data
}

function useBook(bookId) {
  return useQuery({
    // use the bookId in the queryKey
    queryKey: ['book', bookId],
    queryFn: () => getData(bookId), // pass the bookId to the function
    // Wrong: queryFn is not something you invoke - it's called by useQuery internally, with pre-defined parameters.
    // queryFn: bookId => getData(bookId)
  })
}

function Book({ bookId }) {
  const { data, status } = useBook(bookId)

  if (status === 'error') {
    return <Error />
  }

  if (status === 'pending') {
    return <Loading />
  }

  return (
    <main className='book-detail'>
      <div>
        <span className='book-cover'>
          <img src={data.thumbnail} alt={data.title} />
        </span>
      </div>
      <div>
        <h2 className='book-title'>{data.title}</h2>
        <small className='book-author'>{data.authors?.join(', ')}</small>
        <span className='book-rating'>
          {createStarString(data.averageRating)}{' '}
          {getRatingString(data.averageRating)}
        </span>
      </div>
    </main>
  )
}

function Loading() {
  return <main>Loading...</main>
}

function Error() {
  return <main>Woops there was an error...</main>
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
