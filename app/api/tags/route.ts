import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const kv = Redis.fromEnv();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  const cacheKey = `tags:${query}`;
  const cached = await kv.get(cacheKey);

  if (cached) {
    return NextResponse.json(cached);
  }

  // Gelbooru's tag API
  const url = new URL('https://gelbooru.com/index.php');
  url.searchParams.set('page', 'dapi');
  url.searchParams.set('s', 'tag');
  url.searchParams.set('q', 'index');
  url.searchParams.set('name', query);
  url.searchParams.set('order', 'count');
  url.searchParams.set('limit', '20');

  try {
    const response = await fetch(url.toString());
    const xml = await response.text();

    const tags: { name: string; count: number }[] = [];
    const tagRegex = /<tag\s+([^>]+)\/>/g;
    let match;

    while ((match = tagRegex.exec(xml)) !== null) {
      const attrs = match[1];
      const nameMatch = attrs.match(/name="([^"]*)"/);
      const countMatch = attrs.match(/count="([^"]*)"/);
      if (nameMatch && countMatch) {
        tags.push({
          name: nameMatch[1],
          count: parseInt(countMatch[1]),
        });
      }
    }

    await kv.set(cacheKey, tags, { ex: 3600 });

    return NextResponse.json(tags);
  } catch (error) {
    return NextResponse.json([]);
  }
}
