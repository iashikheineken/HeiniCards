import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// Buy a card from the market
export async function POST(request: NextRequest) {
  try {
    const { buyerId, listingId } = await request.json();

    if (!buyerId || !listingId) {
      return Response.json({ error: 'buyerId and listingId are required' }, { status: 400 });
    }

    // Get listing
    const { data: listing, error: listError } = await supabase
      .from('market_listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (listError || !listing) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Can't buy own card
    if (listing.seller_id === buyerId) {
      return Response.json({ error: 'Cannot buy your own card' }, { status: 400 });
    }

    // Check buyer balance
    const { data: buyer, error: buyerError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', buyerId)
      .single();

    if (buyerError || !buyer) {
      return Response.json({ error: 'Buyer not found' }, { status: 404 });
    }

    if (buyer.balance < listing.price) {
      return Response.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Get seller balance
    const { data: seller } = await supabase
      .from('users')
      .select('balance')
      .eq('id', listing.seller_id)
      .single();

    if (!seller) {
      return Response.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Transfer: deduct from buyer
    await supabase
      .from('users')
      .update({ balance: buyer.balance - listing.price })
      .eq('id', buyerId);

    // Transfer: add to seller
    await supabase
      .from('users')
      .update({ balance: seller.balance + listing.price })
      .eq('id', listing.seller_id);

    // Transfer card ownership
    await supabase
      .from('user_cards')
      .update({ user_id: buyerId, is_on_market: false })
      .eq('id', listing.user_card_id);

    // Remove listing
    await supabase
      .from('market_listings')
      .delete()
      .eq('id', listingId);

    return Response.json({ success: true, price: listing.price });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
