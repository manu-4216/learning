import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { createStarString, getData } from './utils'
import { ErrorMessage, Loading } from './MessageComponents'
import Pagination from './Pagination'

const searchTerm = 'The Lord of the Rings' // hardcoded for simplicty
function useSearch(page = 1) {
  return useQuery({
    queryKey: ['search', { searchTerm, page }],
    queryFn: () => getData(searchTerm, page),
    placeholderData: (prevData) => prevData,
  })
}

function BookList({ books, isPlaceholderData }) {
  return (
    <ul style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>
      {books.map((book) => {
        return (
          <li key={book.id}>
            <span className='book-cover'>
              <img src={book.thumbnail} alt={book.title} />
            </span>
            <h3 className='book-title'>{book.title}</h3>
            <small className='book-author'>{book.authors.join(', ')}</small>
            <span className='book-rating'>
              {createStarString(book.averageRating)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function PaginatedBookList() {
  const [page, setPage] = React.useState(1)
  const { data, status, isPlaceholderData } = useSearch(page)

  if (status === 'pending') {
    return <Loading />
  }

  if (status === 'error') {
    return <ErrorMessage />
  }

  return (
    <section className='search-results book-grid'>
      <div>
        <header>
          <h2>
            Search results for <strong>{searchTerm}</strong>
          </h2>
          <Pagination
            totalPages={data.totalPages}
            activePage={page}
            setActivePage={setPage}
          />
        </header>
        <BookList books={data.books} isPlaceholderData={isPlaceholderData} />
      </div>
    </section>
  )
}

export default function App() {
  return (
    <div>
      <header className='app-header'>
        <h1>
          <span>Query Library</span>
        </h1>
      </header>
      <main>
        <PaginatedBookList />
      </main>
    </div>
  )
}
