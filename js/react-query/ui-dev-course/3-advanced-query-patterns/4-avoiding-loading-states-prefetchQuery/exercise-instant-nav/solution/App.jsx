import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import BookDetails from './BookDetails'
import { getBooksByAuthor, getBook, createStarString } from './utils'
import { BookDetailLoading } from './MessageComponents'
import Loader from './Loader'

// To simplify the exercise, asume that the authors already exist
const authors = [
  'J.K. Rowling',
  'C.S. Lewis',
  'J.R.R Tolkien',
  'George R.R. Martin',
]

// function to dynamically get the query options of the books for a given author
function booksByAuthorQuery(author) {
  return {
    queryKey: ['books', { author }],
    queryFn: () => getBooksByAuthor(author),
    staleTime: Infinity,
  }
}

// first query: get all the books for the selected author
function useBooksByAuthor(author) {
  return useQuery(booksByAuthorQuery(author))
}

// 2nd query: when a book is clicked, get the book details
function useBook(bookId, author) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['books', { bookId }],
    queryFn: () => getBook(bookId),
    staleTime: Infinity,
    // use the query data of the first query (books of an author)
    initialData: () => {
      return queryClient
        .getQueryData(booksByAuthorQuery(author).queryKey)
        ?.find((book) => book.id === bookId)
    },
  })
}

// ...

export default function App() {
  const [bookId, setBookId] = React.useState(null)
  const [selectedAuthor, setSelectedAuthor] = React.useState(authors[0])

  const navigateHome = (e) => {
    e.preventDefault()
    setBookId(null)
  }

  return (
    <React.Fragment>
      <header className='app-header'>
        <h1>
          {bookId ? (
            <button className='link back' onClick={navigateHome}>
              ← Back
            </button>
          ) : (
            <span>Query Library</span>
          )}
        </h1>
      </header>
      {bookId ? (
        <BookDetailView bookId={bookId} selectedAuthor={selectedAuthor} />
      ) : (
        <BookListView
          setBookId={setBookId}
          selectedAuthor={selectedAuthor}
          setSelectedAuthor={setSelectedAuthor}
        />
      )}
    </React.Fragment>
  )
}

function BookDetailView({ bookId, selectedAuthor }) {
  const { data } = useBook(bookId, selectedAuthor)
  // ...
}

function BookListView({ setBookId, selectedAuthor, setSelectedAuthor }) {
  const { data, isLoading } = useBooksByAuthor(selectedAuthor)
  // ...
}

function AuthorTab({ isActive, author, setSelectedAuthor }) {
  const queryClient = useQueryClient()

  return (
    <button
      className={`category ${isActive ? 'active' : ''}`}
      onClick={() => setSelectedAuthor(author)}
      onMouseOver={() => {
        queryClient.prefetchQuery(booksByAuthorQuery(author))
      }}
    >
      {author}
    </button>
  )
}
