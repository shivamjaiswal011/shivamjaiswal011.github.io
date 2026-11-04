import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getVisiblePosts } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = await getVisiblePosts();
  return rss({
    title: 'Shivam Jaiswal · writing',
    description: 'Design write-ups on failure modes, security, performance and UX.',
    site: context.site ?? 'https://shivamjaiswal011.github.io',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.published,
      link: `/posts/${post.id}/`,
    })),
  });
}
