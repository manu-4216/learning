import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import Loader from './Loader'
import BookDetails from './BookDetails'
import { getBooksByAuthor, getBook } from './utils'
import AuthorTabs, { authors } from './AuthorTabs'
import ResultList from './ResultList'
import { LoadingBookDetails } from './MessageComponents'

function useBooksByAuthor(author) {
  return useQuery({
    queryKey: ['books', { author }],
    queryFn: () => getBooksByAuthor(author),
    gcTime: 5000,
  })
}

function useBookDetails(bookId) {
  return useQuery({
    queryKey: ['bookDetails', { bookId }],
    queryFn: () => getBook(bookId),
    gcTime: 5000,
  })
}

function BookList({ setBookId }) {
  // use the first author as default for selection
  const [author, setAuthor] = React.useState(authors[0])
  const { data, isPending } = useBooksByAuthor(author)

  // pretend there is no error

  return (
    <main>
      <section className='book-grid'>
        <header className='section-header'>
          <h2>Popular Authors</h2>
          {isPending && <Loader />}
        </header>
        <AuthorTabs selectedAuthor={author} setSelectedAuthor={setAuthor} />
      </section>
      <ResultList author={author} data={data} setBookId={setBookId} />
    </main>
  )
}

function BookDetail({ bookId }) {
  const { data, isPending } = useBookDetails(bookId)

  if (isPending) {
    return <LoadingBookDetails />
  }

  return (
    <BookDetails
      thumbnail={data.thumbnail}
      title={data.title}
      averageRating={data.averageRating}
      description={data.description}
      authors={data.authors}
    />
  )
}

export default function App() {
  const [bookId, setBookId] = React.useState(null)

  const navigateHome = (e) => {
    e.preventDefault()
    setBookId(null)
  }

  // use simple "routing" in memory based on `bookId` (selected book). If not selected,
  // then show the list of all books. If selected book, then show its details.
  return (
    <>
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
        <BookDetail bookId={bookId} />
      ) : (
        <BookList setBookId={setBookId} />
      )}
    </>
  )
}
