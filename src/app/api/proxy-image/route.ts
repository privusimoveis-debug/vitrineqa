import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Basic security: Check if it's a QuintoAndar domain or starts with https (simplified for this use case)
  if (!url.includes('quintoandar.com.br')) {
    return NextResponse.json({ error: 'Invalid domain' }, { status: 403 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Source image not found');

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Access-Control-Allow-Origin': '*', // Allow our client to read it
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
  }
}
