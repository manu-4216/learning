import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryErrorResetBoundary, useQuery } from "@tanstack/react-query";
import { getBook } from "./utils";
import BookDetails from "./BookDetails";

function useBook(bookId) {
  return useQuery({
    queryKey: ["books", { bookId }],
    queryFn: () => getBook(bookId),
    throwOnError: true, // this option is required to handle the errors with ErrorBoundary
    retry: 1,
  });
}

function Book({ bookId }) {
  const { data } = useBook(bookId);

  if (data) {
    return (
      <main className="book-detail">
        <div>
          <span className="book-cover">
            <img src={data.thumbnail} alt={data.title} />
          </span>
        </div>
        <div>
          <BookDetails {...data} />
        </div>
      </main>
    );
  }

  return <Loading />;
}

function Loading() {
  return <main>Loading...</main>;
}

/// Error boundary fallback component has the prop `resetErrorBoundary` to be used for reset within in
function Error({ error, resetErrorBoundary }) {
  return (
    <main>
      <div>{error.message}</div>
      <div>
        <button className="link" onClick={resetErrorBoundary}>
          Retry
        </button>
      </div>
    </main>
  );
}

export default function App() {
  const [selectedBookId, setSelectedBookId] = React.useState("pD6arNyKyi8C");

  return (
    <div>
      <header className="app-header">
        <h1>
          <span>Query Library</span>
        </h1>
        <div className="select">
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
          >
            <option value="pD6arNyKyi8C">The Return Of The King</option>
            <option value="aWZzLPhY4o0C">The Fellowship Of The Ring</option>
            <option value="12e8PJ2T7sQC">The Two Towers</option>
            <option value="WZ0f_yUgc0UC">The Return Of The King</option>
            <option value="MISSING">Book Missing</option>
          </select>
        </div>
      </header>

      {/* this has to wrap around the Error boundary, to give access to reset */}
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            resetKeys={[selectedBookId]}
            FallbackComponent={Error}
            // calling React Query reset, to trigger a refetch
            onReset={reset}
          >
            <Book bookId={selectedBookId} />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </div>
  );
}
