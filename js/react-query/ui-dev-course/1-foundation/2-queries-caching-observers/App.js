import * as React from 'react'
import { sleepToShowLoadingStates } from './src/utils'
import { QueryClient, QueryClientProvider, useQuery } from './src'

function useMediaDevices() {
  return useQuery({
    queryKey: ['mediaDevices'],
    queryFn: async () => {
      console.log('running query...')
      await sleepToShowLoadingStates(500)
      return navigator.mediaDevices.enumerateDevices()
    },
  })
}

function MediaDevices() {
  const { data, status } = useMediaDevices()

  if (status === 'pending') {
    return <div>loading...</div>
  }

  if (status === 'error') {
    return <div>We were unable to access your media devices</div>
  }

  return <div>You have {data.length} media devices</div>
}

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MediaDevices />
      <MediaDevices />
    </QueryClientProvider>
  )
}
