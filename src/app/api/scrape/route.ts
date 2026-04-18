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

    // Helper function to find groups by title
    const findGroup = (title: string) => propertyData.descriptions?.find((g: any) => g.title?.toLowerCase() === title.toLowerCase());

    const descriptionGroup = findGroup('Descrição');
    const unitGroup = findGroup('Imóvel');
    const buildingGroup = findGroup('Condominio') || findGroup('Condomínio');

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
      description: typeof descriptionGroup?.item === 'string' ? descriptionGroup.item : (propertyData.description || ''),
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
      // Segmented amenities
      unitAmenities: unitGroup?.item?.filter((i: any) => i.value === 'SIM').map((i: any) => i.text) || [],
      buildingAmenities: buildingGroup?.item?.filter((i: any) => i.value === 'SIM').map((i: any) => i.text) || []
    };

    return NextResponse.json(cleanedData);
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: 'Failed to scrape the property' }, { status: 500 });
  }
}
