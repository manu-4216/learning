const BASE_URL = 'https://library-api.uidotdev.workers.dev'

export async function getBook(bookId) {
  const url = `${BASE_URL}/books/${bookId}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Unable fetch book details')
  }

  const data = await response.json()
  return data
}

export async function getMyBooks() {
  const url = `${BASE_URL}/books/my-books`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Unable fetch your checked out books')
  }

  const data = await response.json()
  return data
}

export async function checkoutBook(bookId) {
  const url = `${BASE_URL}/checkout/${bookId}`
  const response = await fetch(url, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Unable checkout book')
  }

  const data = await response.json()
  return data
}

export async function returnBook(bookId) {
  const url = `${BASE_URL}/return/${bookId}`
  const response = await fetch(url, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Unable return book')
  }

  const data = await response.json()
  return data
}
