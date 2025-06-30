import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { getMyBooks, getBook, checkoutBook, returnBook } from './utils'

// we need to invalidate both my-books, and the book details
// (which contain the info about how many book copies are available)
function invalidateAllBooks(queryClient) {
  return queryClient.invalidateQueries({ queryKey: ['books'] })
}

export function useCheckoutBook(book) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => checkoutBook(book.id),
    onSuccess: () => {
      return invalidateAllBooks(queryClient)
    },
  })
}

export function useReturnBook(book) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => returnBook(book.id),
    onSuccess: () => {
      return invalidateAllBooks(queryClient)
    },
  })
}

export function useBookQuery(bookId) {
  return useQuery({
    queryKey: ['books', 'detail', bookId],
    queryFn: () => getBook(bookId),
  })
}

export function useMyBooks() {
  return useQuery({
    queryKey: ['books', 'my-books'],
    queryFn: getMyBooks,
  })
}
