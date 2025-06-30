import { timeAgo } from './utils'

const messageMap = {
  review: 'left a review for',
  return: 'returned',
  checkout: 'checked out',
  'new-user': 'just joined Query Library',
}

function getBookDetails(activity) {
  if (activity.activityType === 'review') {
    return activity.activityDetails.bookDetails
  }
  return activity.activityDetails
}

export default function ActivityList({ data }) {
  const hasResults = data?.activities?.length > 0
  if (!hasResults) {
    return (
      <ol>
        <li className='no-activity'>No new activity</li>
      </ol>
    )
  }
  return (
    <ol>
      {data.activities.map((activity, i) => {
        let { title, thumbnail } = getBookDetails(activity)
        return (
          <li key={i}>
            <span className='book-cover'>
              {activity.activityType === 'new-user' ? (
                <span>🎉</span>
              ) : (
                <img src={thumbnail} alt={title} />
              )}
            </span>
            <div>
              <p>
                <strong>Someone</strong> {messageMap[activity.activityType]}{' '}
                <em>{title}</em>.
              </p>
              <small className='activity-time'>
                {timeAgo(activity.activityDate)}
              </small>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
