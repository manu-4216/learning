import { useQueryClient, useQuery, QueryClient } from "@tanstack/react-query";

import {
  getMyBooks,
  getBook,
  getReviewsForBook,
  getFeaturedBooks,
  getLatestReview,
  getBookSearchResult,
} from "./utils";

export const client = new QueryClient();

export const bookQueries = {};
export const reviewQueries = {};

export function useBookReviews(bookId) {
  return useQuery({
    queryKey: ["reviews", bookId],
    queryFn: () => getReviewsForBook(bookId),
  });
}

export function useBookQuery(bookId) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["books", bookId],
    queryFn: () => getBook(bookId),
    staleTime: Infinity,
    initialData: () => {
      return queryClient
        .getQueryData(["books", "featured"])
        ?.find((book) => book.id === bookId);
    },
  });
}

export function usePrefetchBookById(bookId) {
  const queryClient = useQueryClient();
  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: ["books", bookId],
      queryFn: () => getBook(bookId),
      staleTime: Infinity,
    });
  };

  return { prefetch };
}

export function useFeaturedBooks() {
  return useQuery({
    queryKey: ["books", "featured"],
    queryFn: getFeaturedBooks,
    staleTime: Infinity,
  });
}

export function useLatestReview() {
  return useQuery({
    queryKey: ["reviews", "latest"],
    queryFn: getLatestReview,
  });
}

export function useMyBooks() {
  return useQuery({
    queryKey: ["books", "my-books"],
    queryFn: getMyBooks,
  });
}

export function useSearchQuery(query, page) {
  return useQuery({
    queryKey: ["books", "search", query, page],
    queryFn: () => getBookSearchResult(query, page),
    enabled: Boolean(query),
    placeholderData: (previousData) => previousData,
  });
}
