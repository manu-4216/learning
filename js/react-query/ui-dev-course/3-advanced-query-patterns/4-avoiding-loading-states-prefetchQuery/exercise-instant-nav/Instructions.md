In this challenge, our goal is to instantly display the "next" view to the user when they switch between different popular authors. We'll do this by prefetching the data for the next view when the user hovers over an AuthorTab. In addition, users can click onto a Book to go into the BookDetailView.

Then, we want to prefill the BookDetail cache entry by pulling data from the BookList cache. Luckily, the structure that the BookListQuery returns is the same one that we need for the BookDetailQuery. For this view, we have relatively "static" data, so once the data has been fetched, we don't need to refetch it.

# Tasks

- Prefetch the data for the BookList when the user hovers over an AuthorTab
- Prefill the data for the BookDetails view by pulling it from the BookList cache entry
- If the data is already fetched, don't fetch it again
