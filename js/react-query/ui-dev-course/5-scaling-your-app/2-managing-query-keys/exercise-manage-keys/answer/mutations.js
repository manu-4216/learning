import { useQueryClient, useMutation } from "@tanstack/react-query";

import {
  checkoutBook,
  returnBook,
  postReviewData,
  updateReview,
} from "./utils";
import { reviewQueries, bookQueries } from "./queries";

export function usePostReview(bookId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, rating, text }) =>
      postReviewData({ bookId, title, rating, text }),
    onSuccess: () => {
      return queryClient.invalidateQueries(reviewQueries.all());
    },
  });
}

export function useCheckoutBook(book) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => checkoutBook(book.id),
    onMutate: async () => {
      await queryClient.cancelQueries(bookQueries.all());

      const snapshot = {
        myBooks: queryClient.getQueryData(bookQueries.myBooks().queryKey),
        bookDetail: queryClient.getQueryData(
          bookQueries.detail(book.id).queryKey
        ),
      };

      queryClient.setQueryData(
        bookQueries.myBooks().queryKey,
        (previousBooks) =>
          previousBooks ? [...previousBooks, book] : undefined
      );

      queryClient.setQueryData(
        bookQueries.detail(book.id).queryKey,
        (previousBook) =>
          previousBook
            ? {
                ...previousBook,
                isCheckedOutByUser: true,
                availableCopies: previousBook.availableCopies - 1,
              }
            : undefined
      );

      return () => {
        queryClient.setQueryData(
          bookQueries.myBooks().queryKey,
          snapshot.myBooks
        );
        queryClient.setQueryData(
          bookQueries.detail(book.id).queryKey,
          snapshot.bookDetail
        );
      };
    },
    onError: (err, _variables, rollback) => {
      console.log(err);
      rollback?.();
    },
    onSettled: () => {
      return queryClient.invalidateQueries(bookQueries.all());
    },
  });
}

export function useReturnBook(book) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => returnBook(book.id),
    onMutate: async () => {
      await queryClient.cancelQueries(bookQueries.all());

      const snapshot = {
        myBooks: queryClient.getQueryData(bookQueries.myBooks().queryKey),
        bookDetail: queryClient.getQueryData(
          bookQueries.detail(book.id).queryKey
        ),
      };

      queryClient.setQueryData(
        bookQueries.myBooks().queryKey,
        (previousBooks) =>
          previousBooks
            ? previousBooks.filter((b) => b.id !== book.id)
            : undefined
      );

      queryClient.setQueryData(
        bookQueries.detail(book.id).queryKey,
        (previousBook) =>
          previousBook
            ? {
                ...previousBook,
                isCheckedOutByUser: false,
                availableCopies: previousBook.availableCopies + 1,
              }
            : undefined
      );

      return () => {
        queryClient.setQueryData(
          bookQueries.myBooks().queryKey,
          snapshot.myBooks
        );
        queryClient.setQueryData(
          bookQueries.detail(book.id).queryKey,
          snapshot.bookDetail
        );
      };
    },
    onError: (err, _variables, rollback) => {
      console.log(err);
      rollback?.();
    },
    onSettled: () => {
      return queryClient.invalidateQueries(bookQueries.all());
    },
  });
}

export function useEditReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, text, rating, reviewId }) =>
      updateReview({ reviewId, title, text, rating }),
    onSuccess: () => {
      return queryClient.invalidateQueries(reviewQueries.all());
    },
  });
}
