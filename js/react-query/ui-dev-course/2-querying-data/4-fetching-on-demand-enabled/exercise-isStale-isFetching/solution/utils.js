const BASE_URL = 'https://library-api.uidotdev.workers.dev'

export async function getData(bookId) {
  const url = `${BASE_URL}/books/${bookId}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Unable fetch data')
  }

  const data = await response.json()
  return data
}

export function createStarString(number) {
  if (typeof number !== 'number') {
    return 'No reviews'
  }

  const filledStars = Array.from({ length: Math.floor(number) }).map(() => '★')
  const emptyStars = Array.from({ length: 5 - filledStars.length }).map(
    () => '☆'
  )

  return filledStars.concat(emptyStars).join('')
}

export function getRatingString(number) {
  if (typeof number !== 'number') {
    return ''
  }

  return `(${number} / 5)`
}
