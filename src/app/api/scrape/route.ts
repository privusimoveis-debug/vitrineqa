import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!url.includes('vitrine.quintoandar.com.br')) {
      return NextResponse.json({ error: 'Invalid QuintoAndar Vitrine URL' }, { status: 400 });
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const html = response.data;
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
    const isForSale = !!propertyData.salePrice && propertyData.salePrice > 0;
    const type = propertyData.type || 'Imóvel';
    
    // Construct descriptive title in PT-BR
    const dynamicTitle = `${type} à ${isForSale ? 'venda' : 'aluguel'} com ${propertyData.totalArea}m², ${propertyData.bedrooms} quartos e ${propertyData.parkingSlots} vagas`;

    const cleanedData = {
      id: propertyData.id,
      title: dynamicTitle,
      type: type,
      address: typeof propertyData.address === 'object' 
        ? `${propertyData.address.address}, ${propertyData.address.neighborhood}`
        : propertyData.address,
      city: typeof propertyData.address === 'object' ? propertyData.address.city : propertyData.city,
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
        salePrice: propertyData.salePrice || 0,
        rent: propertyData.rentValue || propertyData.rent || 0,
        iptu: propertyData.iptu?.amount || propertyData.iptu || 0,
        condo: propertyData.condominium || propertyData.condo || 0,
        total: propertyData.totalCost || propertyData.total || 0,
        isForSale: isForSale
      },
      amenities: propertyData.amenities || []
    };

    return NextResponse.json(cleanedData);
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: 'Failed to scrape the property' }, { status: 500 });
  }
}
