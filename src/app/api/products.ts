import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Simulate product data (for prototyping)
  const sampleProducts = [
    {
      id: 1,
      item_code: 'A001',
      name: 'Minimal T-shirt',
      price: '20',
      sizes: ['S', 'M', 'L'],
      image_url: null
    },
    {
      id: 2,
      item_code: 'A002',
      name: 'Minimal Shoes',
      price: '40',
      sizes: ['8', '9', '10'],
      image_url: null
    }
  ];

  return NextResponse.json(sampleProducts);
}