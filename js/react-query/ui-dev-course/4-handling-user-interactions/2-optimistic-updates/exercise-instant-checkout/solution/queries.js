import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getMyBooks, getBook, checkoutBook, returnBook } from "./utils";

export function useCheckoutBook(book) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => checkoutBook(book.id),
    onMutate: async () => {
      // Cancel any outgoing queries
      await queryClient.cancelQueries({
        queryKey: ["books"],
      });

      // Snapshot the previous state
      const snapshot = {
        myBooks: queryClient.getQueryData(["books", "my-books"]),
        bookDetail: queryClient.getQueryData(["books", "detail", book.id]),
      };

      // Optimistically update the cache
      queryClient.setQueryData(["books", "my-books"], (previousBooks) =>
        previousBooks ? [...previousBooks, book] : undefined
      );

      queryClient.setQueryData(["books", "detail", book.id], (previousBook) =>
        previousBook
          ? {
              ...previousBook,
              isCheckedOutByUser: true,
              availableCopies: previousBook.availableCopies - 1,
            }
          : undefined
      );

      // Return a rollback function
      return () => {
        queryClient.setQueryData(["books", "my-books"], snapshot.myBooks);
        queryClient.setQueryData(
          ["books", "detail", book.id],
          snapshot.bookDetail
        );
      };
    },
    onError: (_err, _variables, rollback) => {
      rollback?.();
    },
    onSettled: () => {
      // Always refetch after error or success
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
        bookDetail: queryClient.getQueryData(["books", "detail", book.id]),
      };

      queryClient.setQueryData(["books", "my-books"], (previousBooks) =>
        previousBooks
          ? previousBooks.filter((b) => b.id !== book.id)
          : undefined
      );

      queryClient.setQueryData(["books", "detail", book.id], (previousBook) =>
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
    onError: (_err, _variables, rollback) => {
      rollback?.();
    },
    onSettled: () => {
      return queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export function useBookQuery(bookId) {
  return useQuery({
    queryKey: ["books", "detail", bookId],
    queryFn: () => getBook(bookId),
    enabled: Boolean(bookId),
  });
}

export function useMyBooks() {
  return useQuery({
    queryKey: ["books", "my-books"],
    queryFn: getMyBooks,
  });
}
