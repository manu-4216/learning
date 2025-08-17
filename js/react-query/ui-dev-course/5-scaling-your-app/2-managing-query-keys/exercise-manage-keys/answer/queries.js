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

export const bookQueries = {
  // this query below doesn't have queryFn because it's only used by a mutation
  all: () => ({
    queryKey: ["books"],
  }),
  detail: (bookId) => ({
    queryKey: ["books", bookId],
    queryFn: () => getBook(bookId),
    staleTime: Infinity,
  }),
  featured: () => ({
    queryKey: ["books", "featured"],
    queryFn: getFeaturedBooks,
    staleTime: Infinity,
  }),
  myBooks: () => ({
    queryKey: ["books", "my-books"],
    queryFn: getMyBooks,
  }),
  search: (query, page) => ({
    queryKey: ["books", "search", query, page],
    queryFn: () => getBookSearchResult(query, page),
    enabled: Boolean(query),
    placeholderData: (previousData) => previousData,
  }),
};

export const reviewQueries = {
  all: () => ({
    queryKey: ["reviews"],
  }),
  detail: (bookId) => ({
    queryKey: ["reviews", bookId],
    queryFn: () => getReviewsForBook(bookId),
  }),
  latest: () => ({
    queryKey: ["reviews", "latest"],
    queryFn: getLatestReview,
  }),
};

export function useBookReviews(bookId) {
  return useQuery(reviewQueries.detail(bookId));
}

export function useBookQuery(bookId) {
  const queryClient = useQueryClient();
  return useQuery({
    ...bookQueries.detail(bookId),
    initialData: () => {
      return queryClient
        .getQueryData(bookQueries.featured().queryKey)
        ?.find((book) => book.id === bookId);
    },
  });
}

export function usePrefetchBookById(bookId) {
  const queryClient = useQueryClient();
  const prefetch = () => {
    queryClient.prefetchQuery(bookQueries.detail(bookId));
  };

  return { prefetch };
}

export function useFeaturedBooks() {
  return useQuery(bookQueries.featured());
}

export function useLatestReview() {
  return useQuery(reviewQueries.latest());
}

export function useMyBooks() {
  return useQuery(bookQueries.myBooks());
}

export function useSearchQuery(query, page) {
  return useQuery(bookQueries.search(query, page));
}
