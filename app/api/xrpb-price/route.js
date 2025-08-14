import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const response = await axios.get('https://s1.xrplmeta.org/token/XRPB:rsEaYfqdZKNbD3SK55xzcjPm3nDrMj4aUT', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.status === 200 && response.data) {
      const data = response.data;
      
      if (data.meta && data.meta.token && data.metrics) {
        const token = data.metrics;
        
        if (token.price && typeof token.price === 'string') {
          const priceNumber = parseFloat(token.price);
          
          return NextResponse.json({
            success: true,
            price: priceNumber,
            currency: 'USD',
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid response structure' },
      { status: 500 }
    );
    
  } catch (error) {
    console.error('Error fetching XRPB price:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch XRPB price' },
      { status: 500 }
    );
  }
}