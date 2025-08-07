import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'

// GET - Fetch specific listing details for marketplace
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const walletAddress = url.searchParams.get('wallet')

    // Get listing details with seller information and enhanced fields
    const [listings] = await db.query(
      `SELECT 
        l.id,
        l.title,
        l.description,
        l.price,
        l.category,
        l.subcategory,
        l.brand,
        l.model,
        l.condition_type,
        l.chain,
        l.status,
        l.stock_quantity,
        l.original_stock,
        l.low_stock_threshold,
        l.is_physical,
        l.is_auction,
        l.starting_bid,
        l.current_bid,
        l.bid_increment,
        l.buy_now_price,
        l.auction_end_date,
        l.weight,
        l.length,
        l.width,
        l.height,
        l.color,
        l.size,
        l.material,
        l.sku,
        l.isbn,
        l.upc_ean,
        l.country,
        l.state_province,
        l.city,
        l.original_price,
        l.discount_percentage,
        l.bulk_pricing,
        l.key_features,
        l.technical_specs,
        l.compatibility,
        l.warranty_period,
        l.warranty_type,
        l.return_policy,
        l.return_period_days,
        l.shipping_weight,
        l.shipping_dimensions,
        l.shipping_cost,
        l.free_shipping,
        l.shipping_methods,
        l.processing_time_days,
        l.quantity_available,
        l.min_order_quantity,
        l.max_order_quantity,
        l.age_restriction,
        l.requires_assembly,
        l.energy_rating,
        l.certifications,
        l.included_accessories,
        l.care_instructions,
        l.storage_requirements,
        l.images,
        l.tags,
        l.views,
        l.created_at,
        l.updated_at,
        u.username as seller_username,
        u.id as seller_id
       FROM listings l
       JOIN users u ON l.user_id = u.id
       WHERE l.id = ? AND l.status = 'approved'`,
      [params.id]
    );

    if (listings.length === 0) {
      return NextResponse.json(
        { error: 'Listing not found or not available' },
        { status: 404 }
      )
    }

    const listing = listings[0]

    // Get seller's wallet addresses
    const [sellerWallets] = await db.query(
      `SELECT chain, address, is_primary
       FROM wallet_addresses
       WHERE user_id = ?
       ORDER BY is_primary DESC, chain ASC`,
      [listing.seller_id]
    )

    // Get payment information based on connected wallet
    let paymentInfo = null
    if (walletAddress) {
      // Find matching chain for the connected wallet
      const [connectedWalletInfo] = await db.query(
        `SELECT chain FROM wallet_addresses WHERE address = ?`,
        [walletAddress]
      )

      if (connectedWalletInfo.length > 0) {
        const connectedChain = connectedWalletInfo[0].chain
        
        // Find seller's wallet for the same chain
        const matchingSellerWallet = sellerWallets.find(w => w.chain === connectedChain)
        
        if (matchingSellerWallet) {
          paymentInfo = {
            buyerWallet: walletAddress,
            sellerWallet: matchingSellerWallet.address,
            chain: connectedChain,
            price: listing.price,
            currency: getChainCurrency(connectedChain)
          }
        }
      }
    }

    // Get recent orders/bids for this listing (for bid history)
    const [recentOrders] = await db.query(
      `SELECT 
        o.amount,
        o.created_at,
        u.username as bidder_username
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       WHERE o.listing_id = ? AND o.status != 'cancelled'
       ORDER BY o.created_at DESC
       LIMIT 10`,
      [id]
    )

    // Increment view count
    await db.query(
      'UPDATE listings SET views = views + 1 WHERE id = ?',
      [id]
    )

    // Format the response with enhanced fields
    const formattedListing = {
      ...listing,
      images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images,
      tags: typeof listing.tags === 'string' ? JSON.parse(listing.tags) : listing.tags,
      dimensions: typeof listing.dimensions === 'string' ? JSON.parse(listing.dimensions) : listing.dimensions,
      features: typeof listing.features === 'string' ? JSON.parse(listing.features) : listing.features,
      specifications: typeof listing.specifications === 'string' ? JSON.parse(listing.specifications) : listing.specifications,
      shipping_info: typeof listing.shipping_info === 'string' ? JSON.parse(listing.shipping_info) : listing.shipping_info,
      seller: {
        id: listing.seller_id,
        username: listing.seller_username,
        wallets: sellerWallets
      },
      paymentInfo,
      bidHistory: recentOrders.map(order => ({
        amount: order.amount,
        bidder: order.bidder_username,
        time: order.created_at
      }))
    }

    return NextResponse.json({ listing: formattedListing })
  } catch (error) {
    console.error('Error fetching listing details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get currency symbol for chain - Updated for XRPB
function getChainCurrency(chain) {
  // All chains now use XRPB token
  return 'XRPB'
}