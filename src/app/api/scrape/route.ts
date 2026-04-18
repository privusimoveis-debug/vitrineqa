import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate if it's a QuintoAndar Vitrine link
    if (!url.includes('vitrine.quintoandar.com.br')) {
      return NextResponse.json({ error: 'Invalid QuintoAndar Vitrine URL' }, { status: 400 });
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const html = response.data;
    
    // Extract __NEXT_DATA__ JSON
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    
    if (!nextDataMatch) {
      return NextResponse.json({ error: 'Could not extract property data' }, { status: 500 });
    }

    const nextData = JSON.parse(nextDataMatch[1]);
    const propertyData = nextData.props?.pageProps?.dehydratedState?.queries?.[0]?.state?.data;

    if (!propertyData) {
      return NextResponse.json({ error: 'Property data not found in page' }, { status: 404 });
    }

    // Process and clean the data
    const cleanedData = {
      id: propertyData.id,
      title: propertyData.type || 'Imóvel',
      address: `${propertyData.address}, ${propertyData.neighborhood}`,
      city: propertyData.city,
      area: propertyData.totalArea,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      parking: propertyData.parkingSlots,
      description: propertyData.description,
      images: propertyData.images?.map((img: any) => ({
        url: img.url.startsWith('//') ? `https:${img.url}` : img.url,
        subtitle: img.subtitle
      })) || [],
      prices: {
        rent: propertyData.rent,
        iptu: propertyData.iptu,
        condo: propertyData.condo,
        total: propertyData.total
      },
      amenities: propertyData.amenities || []
    };

    return NextResponse.json(cleanedData);
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: 'Failed to scrape the property' }, { status: 500 });
  }
}
