import * as React from 'react'
import Loader from './Loader'
import { useCheckoutBook, useReturnBook } from './queries'

export function CheckoutButton({ book }) {
  const { mutate, isPending } = useCheckoutBook(book)

  return (
    <button
      disabled={book.availableCopies === 0 || isPending}
      className='primary button'
      // note that we don't need to pass the book id here.
      // It is being accesed from its parent closure useCheckoutBook
      onClick={() => mutate()}
    >
      {isPending ? <Loader /> : 'Checkout'}
    </button>
  )
}

export function ReturnButton({ book }) {
  const { mutate, isPending } = useReturnBook(book)

  return (
    <button
      disabled={isPending}
      className='secondary button'
      // note that we don't need to pass the book id here.
      // It is being accesed from its parent closure useCheckoutBook
      onClick={() => mutate()}
    >
      {isPending ? <Loader /> : 'Return Book'}
    </button>
  )
}
