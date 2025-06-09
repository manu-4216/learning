export function StaleMessage({ refetch }) {
  return (
    <span className='message'>
      The checkout status may have changed ...{' '}
      <button className='link' onClick={refetch}>
        Get the latest data
      </button>
    </span>
  )
}

export function UpToDate() {
  return (
    <span className='message'>
      Everything up to date - go ahead and checkout that book!
    </span>
  )
}

export function BackgroundUpdateInProgress() {
  return <span className='message'>Getting the data ...</span>
}

export function ErrorMessage() {
  return <main>Woops there was an error...</main>
}
