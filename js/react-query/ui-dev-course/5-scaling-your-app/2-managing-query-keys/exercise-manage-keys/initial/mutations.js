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
      return queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useCheckoutBook(book) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => checkoutBook(book.id),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["books"],
      });

      const snapshot = {
        myBooks: queryClient.getQueryData(["books", "my-books"]),
        bookDetail: queryClient.getQueryData(["books", book.id]),
      };

      queryClient.setQueryData(["books", "my-books"], (previousBooks) =>
        previousBooks ? [...previousBooks, book] : undefined
      );

      queryClient.setQueryData(["books", book.id], (previousBook) =>
        previousBook
          ? {
              ...previousBook,
              isCheckedOutByUser: true,
              availableCopies: previousBook.availableCopies - 1,
            }
          : undefined
      );

      return () => {
        queryClient.setQueryData(["books", "my-books"], snapshot.myBooks);
        queryClient.setQueryData(["books", book.id], snapshot.bookDetail);
      };
    },
    onError: (err, _variables, rollback) => {
      console.log(err);
      rollback?.();
    },
    onSettled: () => {
      return queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export function useReturnBook(book) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => returnBook(book.id),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["books"],
      });

      const snapshot = {
        myBooks: queryClient.getQueryData(["books", "my-books"]),
        bookDetail: queryClient.getQueryData(["books", book.id]),
      };

      queryClient.setQueryData(["books", "my-books"], (previousBooks) =>
        previousBooks
          ? previousBooks.filter((b) => b.id !== book.id)
          : undefined
      );

      queryClient.setQueryData(["books", book.id], (previousBook) =>
        previousBook
          ? {
              ...previousBook,
              isCheckedOutByUser: false,
              availableCopies: previousBook.availableCopies + 1,
            }
          : undefined
      );

      return () => {
        queryClient.setQueryData(["books", "my-books"], snapshot.myBooks);
        queryClient.setQueryData(
          ["books", "detail", book.id],
          snapshot.bookDetail
        );
      };
    },
    onError: (err, _variables, rollback) => {
      console.log(err);
      rollback?.();
    },
    onSettled: () => {
      return queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export function useEditReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, text, rating, reviewId }) =>
      updateReview({ reviewId, title, text, rating }),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}
