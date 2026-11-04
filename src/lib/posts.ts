import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

const WORDS_PER_MINUTE = 220;

/** Posts to show, newest first. Drafts appear only in `astro dev`. */
export async function getVisiblePosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
}

/** Formats a post date the same way everywhere, e.g. "4 Nov 2026". */
export function formatPostDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Minutes to read the post's Markdown body, at least 1. */
export function readMinutes(post: Post): number {
  const wordCount = (post.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
