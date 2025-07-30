import { NextResponse } from 'next/server'
import crypto from 'crypto'

const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY

export async function POST(request) {
  try {
    if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY) {
      return NextResponse.json(
        { error: 'Cloudinary credentials not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { timestamp, folder, public_id } = body

    // Create the string to sign
    const paramsToSign = {
      timestamp,
      folder,
      public_id
    }

    // Sort parameters alphabetically and create query string
    const sortedParams = Object.keys(paramsToSign)
      .sort()
      .map(key => `${key}=${paramsToSign[key]}`)
      .join('&')

    // Add the API secret to the end
    const stringToSign = `${sortedParams}${CLOUDINARY_API_SECRET}`

    // Generate SHA1 signature
    const signature = crypto
      .createHash('sha1')
      .update(stringToSign)
      .digest('hex')

    return NextResponse.json({
      signature,
      api_key: CLOUDINARY_API_KEY,
      timestamp,
      folder,
      public_id
    })

  } catch (error) {
    console.error('Signature generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    )
  }
}