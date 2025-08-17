import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getBook } from "./utils";
import BookDetails from "./BookDetails";
import { z } from "zod";

const bookSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string(),
  authors: z.array(z.string()).optional(),
  averageRating: z.number().optional(),
  description: z.string()
});

function useBook(bookId) {
  return useQuery({
    queryKey: ["books", { bookId }],
    queryFn: async () => {
      const data = await getBook(bookId)
      return bookSchema.parse(data) // this will throw if invalid schema
    },
    retry: (failureCount, error) => {
      // don't retry validation errors
      if (error instanceof z.ZodError) {
        return false;
      }

      return failureCount < 3;
    }
  });
}

function Book({ bookId }) {
  const { data, status } = useBook(bookId);

  if (status === "pending") {
    return <Loading />;
  }

  if (status === "error") {
    return <Error />;
  }

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

function Loading() {
  return <main>Loading...</main>;
}

function Error() {
  return <main>Woops there was an error...</main>;
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
            <option value="pD6arNyKyi8C">The Hobbit</option>
            <option value="aWZzLPhY4o0C">The Fellowship Of The Ring</option>
            <option value="12e8PJ2T7sQC">The Two Towers</option>
            <option value="WZ0f_yUgc0UC">The Return Of The King</option>
          </select>
        </div>
      </header>
      <Book bookId={selectedBookId} />
    </div>
  );
}
