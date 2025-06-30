import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postReviewData } from './utils'
import Loader from './Loader'

const useSubmitReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postReviewData,
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: ['reviews'],
      })
    },
  })
}

export default function ReviewFormSection({ bookId }) {
  const { mutate, isPending, isError } = useSubmitReview()

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const newReview = {
      bookId,
      rating: formData.get('star-input'),
      title: formData.get('review-title'),
      text: formData.get('review-text'),
    }

    mutate(newReview, {
      onSuccess: () => {
        e.target.reset()
      },
    })
  }

  return (
    <section className='review-form'>
      <h2>Leave a review</h2>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <label htmlFor='review-rating'>Rating:</label>
          <div className='star-rating'>
            <input
              defaultChecked
              className='radio-input'
              type='radio'
              id='star5'
              name='star-input'
              value='5'
            />
            <label className='radio-label' htmlFor='star5' title='5 stars' />
            <input
              className='radio-input'
              type='radio'
              id='star4'
              name='star-input'
              value='4'
            />
            <label className='radio-label' htmlFor='star4' title='4 stars' />
            <input
              className='radio-input'
              type='radio'
              id='star3'
              name='star-input'
              value='3'
            />
            <label className='radio-label' htmlFor='star3' title='3 stars' />
            <input
              className='radio-input'
              type='radio'
              id='star2'
              name='star-input'
              value='2'
            />
            <label className='radio-label' htmlFor='star2' title='2 stars' />
            <input
              className='radio-input'
              type='radio'
              id='star1'
              name='star-input'
              value='1'
            />
            <label className='radio-label' htmlFor='star1' title='1 star' />
          </div>
          <label htmlFor='review-title'>Title:</label>
          <input
            required
            type='text'
            id='review-title'
            name='review-title'
            placeholder='Give your review a title'
          />
          <label htmlFor='review-text'>Review:</label>
          <textarea
            required
            minLength={1}
            maxLength={500}
            id='review-text'
            name='review-text'
            placeholder='What did you think?'
          />
          <button className='button' type='submit' disabled={isPending}>
            {isPending ? <Loader /> : 'Submit'}
          </button>
        </fieldset>
      </form>
      {isError && <div className='error'>Woops there was an error</div>}
    </section>
  )
}
