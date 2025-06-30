const BASE_URL = 'https://library-api.uidotdev.workers.dev'

export async function getActivity(page) {
  const url = `${BASE_URL}/activity?pageSize=10&page=${page}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Unable fetch data')
  }

  const data = await response.json()
  return data
}

export function flattenActivities(pages) {
  return pages.flatMap((page) => page.activities)
}
