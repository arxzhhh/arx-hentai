import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const kv = Redis.fromEnv();

const BOORU_API = 'https://gelbooru.com/index.php';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tags = searchParams.get('tags') || '';
  const page = parseInt(searchParams.get('page') || '0');
  const limit = parseInt(searchParams.get('limit') || '50');
  const rating = searchParams.get('rating') || 'explicit';

  // Build cache key
  const cacheKey = `search:${tags}:${page}:${limit}:${rating}`;

  // Check cache first
  const cached = await kv.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Build the API URL
  const url = new URL(BOORU_API);
  url.searchParams.set('page', 'dapi');
  url.searchParams.set('s', 'post');
  url.searchParams.set('q', 'index');
  url.searchParams.set('tags', `${tags} rating:${rating}`);
  url.searchParams.set('pid', String(page));
  url.searchParams.set('limit', String(limit));

  // Add auth if you have it
  if (process.env.GELBOORU_API_KEY) {
    url.searchParams.set('api_key', process.env.GELBOORU_API_KEY);
    url.searchParams.set('user_id', process.env.GELBOORU_USER_ID || '');
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'HentaiBooruViewer/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Booru API returned ${response.status}`);
    }

    const xml = await response.text();

    // Parse XML (Gelbooru returns XML by default)
    const posts = parseGelbooruXML(xml);

    const result = {
      posts,
      total: posts.length,
      page,
      limit,
      tags: tags.split(' '),
    };

    // Cache for 5 minutes
    await kv.set(cacheKey, result, { ex: 300 });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Booru API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// Simple XML parser for Gelbooru's response
function parseGelbooruXML(xml: string): any[] {
  const posts: any[] = [];
  const postRegex = /<post\s+([^>]+)\/>/g;
  let match;

  while ((match = postRegex.exec(xml)) !== null) {
    const attrs = match[1];
    const post: any = {};

    // Extract attributes
    const attrRegex = /(\w+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      post[attrMatch[1]] = attrMatch[2];
    }

    // Convert numeric fields
    post.id = parseInt(post.id);
    post.width = parseInt(post.width);
    post.height = parseInt(post.height);
    post.score = parseInt(post.score);
    post.favorites = parseInt(post.favorites);

    posts.push(post);
  }

  return posts;
}
