import logging
import os
from typing import Dict, List, Tuple  # <<< TILFØJET Tuple

from flask import current_app
from whoosh.fields import DATETIME, ID, KEYWORD, TEXT, Schema
from whoosh.index import Index, create_in, exists_in, open_dir  # <<< Import Index
from whoosh.qparser import MultifieldParser, QueryParser
from whoosh.writing import AsyncWriter

# Import your ForumPost model
from .models import ForumPost, db

log = logging.getLogger(__name__)

# Define the schema for the ForumPost index
# Stored=True means the value is stored in the index and can be retrieved directly
# TEXT fields are analyzed (tokenized, stemmed, etc.)
# ID fields are indexed as a single unit
# KEYWORD fields can be used for faceting/sorting if needed
post_schema = Schema(
    id=ID(stored=True, unique=True),  # ForumPost.id (integer, but stored as ID)
    thread_id=ID(stored=True),  # ForumThread.id
    author_username=ID(stored=True),  # User who wrote the post
    body=TEXT(
        stored=False, analyzer=None
    ),  # The main content to search (don't store full body)
    created_at=DATETIME(
        stored=True, sortable=True
    ),  # Store creation time, allow sorting
)


def get_index_dir() -> str:
    """Gets the Whoosh index directory path from config."""
    index_dir = current_app.config.get("WHOOSH_BASE")
    if not index_dir:
        raise ValueError("WHOOSH_BASE not set in Flask config")
    return index_dir


def get_or_create_index() -> Index:  # <<< Use imported Index
    """Opens an existing Whoosh index or creates a new one."""
    index_dir = get_index_dir()
    if exists_in(index_dir):
        log.debug(f"Opening existing Whoosh index at: {index_dir}")
        return open_dir(index_dir, schema=post_schema)
    else:
        log.info(f"Creating new Whoosh index at: {index_dir}")
        os.makedirs(index_dir, exist_ok=True)
        return create_in(index_dir, post_schema)


def add_post_to_index(post: ForumPost):
    """Adds or updates a single ForumPost in the Whoosh index."""
    try:
        ix = get_or_create_index()
        writer = AsyncWriter(ix)  # Use AsyncWriter for potentially better performance
        log.debug(f"Indexing post ID: {post.id}")
        writer.update_document(
            id=str(post.id),  # Whoosh IDs are typically strings
            thread_id=str(post.thread_id),
            author_username=post.author_username,
            body=post.body,  # Index the raw body text
            created_at=post.created_at,
        )
        writer.commit()  # Commit changes asynchronously
        log.debug(f"Successfully submitted post ID {post.id} for indexing.")
    except Exception as e:
        log.exception(f"Error adding/updating post ID {post.id} to Whoosh index: {e}")
        # Consider rolling back the writer commit if possible/needed, though AsyncWriter might handle this.


def remove_post_from_index(post_id: int):
    """Removes a single ForumPost from the Whoosh index by its ID."""
    try:
        ix = get_or_create_index()
        writer = AsyncWriter(ix)
        log.debug(f"Deleting post ID: {post_id} from index.")
        writer.delete_by_term("id", str(post_id))
        writer.commit()
        log.debug(f"Successfully submitted post ID {post_id} for deletion from index.")
    except Exception as e:
        log.exception(f"Error removing post ID {post_id} from Whoosh index: {e}")


def search_posts(
    query_string: str, page: int = 1, per_page: int = 10
) -> Tuple[List[Dict], int]:
    """Performs a search query on the ForumPost index."""
    results = []
    total_hits = 0
    try:
        ix = get_or_create_index()
        # Search in 'body' and potentially 'author_username'
        # Pass the globally defined post_schema directly
        parser = MultifieldParser(["body", "author_username"], schema=post_schema)  # type: ignore[arg-type]
        query = parser.parse(query_string)

        with ix.searcher() as searcher:
            # Use limit=None first to get total count, then paginate
            # Note: This can be inefficient for very large result sets.
            # A better approach for large indexes might involve estimating counts
            # or using Whoosh's pagination features more directly if needed later.
            all_results = searcher.search(
                query, limit=None, sortedby="created_at", reverse=True
            )
            total_hits = len(all_results)

            # Apply pagination manually
            start = (page - 1) * per_page
            # end = start + per_page
            paginated_results = searcher.search_page(
                query, page, pagelen=per_page, sortedby="created_at", reverse=True
            )

            results = [hit.fields() for hit in paginated_results]  # Get stored fields
            log.info(
                f"Whoosh search for '{query_string}' found {total_hits} total hits. Returning page {page} ({len(results)} results)."
            )

    except Exception as e:
        log.exception(f"Error searching Whoosh index for query '{query_string}': {e}")

    return results, total_hits


def rebuild_index():
    """Clears and rebuilds the entire Whoosh index from ForumPost data."""
    try:
        index_dir = get_index_dir()
        log.info(f"Rebuilding Whoosh index at: {index_dir}")
        # Create schema and clear directory (create_in handles clearing)
        ix = create_in(index_dir, post_schema)
        writer = AsyncWriter(ix)
        indexed_count = 0

        # Iterate through all posts in batches to avoid loading all into memory
        batch_size = 100
        offset = 0
        while True:
            posts_batch = db.session.scalars(
                db.select(ForumPost)
                .order_by(ForumPost.id)
                .limit(batch_size)
                .offset(offset)
            ).all()

            if not posts_batch:
                break  # No more posts

            for post in posts_batch:
                writer.update_document(
                    id=str(post.id),
                    thread_id=str(post.thread_id),
                    author_username=post.author_username,
                    body=post.body,
                    created_at=post.created_at,
                )
                indexed_count += 1
                if indexed_count % 100 == 0:
                    log.debug(f"Indexed {indexed_count} posts...")

            offset += batch_size

        writer.commit()  # Commit all changes
        log.info(f"Finished rebuilding index. Total posts indexed: {indexed_count}")
        return indexed_count
    except Exception as e:
        log.exception(f"Error rebuilding Whoosh index: {e}")
        return 0  # Indicate failure or partial success
