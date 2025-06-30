export const sleepToShowLoadingStates = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

// To support keys as arrays, we need to create a hash of the queryKey
export function hashKey(queryKey: string[]) {
  return JSON.stringify(queryKey)
}
