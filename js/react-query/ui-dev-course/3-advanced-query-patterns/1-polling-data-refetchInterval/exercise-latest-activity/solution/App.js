import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getActivity, formatDate } from './utils'
import ActivityList from './ActivityList'
import Loader from './Loader'

function useActivities() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: getActivity,
    refetchInterval: 5000,
  })
}

function ActivityFeed() {
  // note the use of `dataUpdatedAt`
  const { data, dataUpdatedAt, status } = useActivities()

  if (status === 'pending') {
    return <Loader />
  }

  return (
    <section className='latest-activity'>
      <h2>Latest activity as of {formatDate(dataUpdatedAt)}</h2>
      <ActivityList data={data} />
    </section>
  )
}

export default function App() {
  return (
    <>
      <header className='app-header'>
        <h1>
          <span>Query Library</span>
        </h1>
      </header>
      <main className='dashboard'>
        <ActivityFeed />
      </main>
    </>
  )
}
