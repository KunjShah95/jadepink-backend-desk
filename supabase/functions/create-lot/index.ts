import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Simple timeout wrapper: 8 seconds
const TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Function execution timed out'));
    }, timeout);
    promise.then((value) => {
      clearTimeout(timer);
      resolve(value);
    }).catch((err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

serve(async (req) => {
  try {
    const body = await req.json();

    const {
      designer, courier, tracking, boxes, stockType, condition: condition_,
      expected: expected_, poRef, upcomingId, blindCount, challanQty, poQty,
      diffNote, tagsMatch, by
    } = body;

    // Validate required fields
    if (!by) {
      return new Response(JSON.stringify({ error: 'User ID (by) is required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    if (!designer || !boxes || !stockType || !condition_ || !expected_) {
      return new Response(JSON.stringify({ error: 'Required fields missing: designer, boxes, stockType, condition, expected' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate lot number
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    let rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    let lotNo = `IN-${yy}${mm}${dd}-${rand}`;

    // Ensure uniqueness
    let existing = null;
    while (existing) {
      rand = Math.random().toString(36).substring(2, 5).toUpperCase();
      lotNo = `IN-${yy}${mm}${dd}-${rand}`;
      const { data } = await withTimeout(
        supabase.from('lots').select('lot_no').eq('lot_no', lotNo).maybeSingle(),
        TIMEOUT_MS * 0.8
      );
      existing = data;
    }

    // Create lot
    const { data: lot, error: lotError } = await withTimeout(
      supabase
        .from('lots')
        .insert({
          lot_no: lotNo,
          created_by: by,
          designer, courier, tracking, boxes, stock_type: stockType,
          condition_: condition_, expected_: expected_, po_ref: poRef,
          upcoming_id: upcomingId,
          blind_count: blindCount || 0,
          challan_qty: challanQty || 0,
          po_qty: poQty || 0,
          diff_note: diffNote,
          tags_match: tagsMatch || 'All tags match the agreed price',
        })
        .select()
        .single(),
      TIMEOUT_MS
    );

    if (lotError) throw lotError;

    // Link upcoming parcel if provided
    if (upcomingId) {
      await withTimeout(
        supabase
          .from('upcoming')
          .update({ status: 'received', lot_id: lot.id, received_at: new Date().toISOString() })
          .eq('id', upcomingId),
        TIMEOUT_MS * 0.5
      );
    }

    // Log event
    await withTimeout(
      supabase
        .from('events')
        .insert({
          lot_id: lot.id,
          action: 'created',
          entity: 'lot',
          entity_id: lotNo,
          before: null,
          after: { lotNo, designer },
          text: 'Parcel received',
          by,
        }),
      TIMEOUT_MS * 0.5
    );

    return new Response(JSON.stringify({ id: lot.id, lotNo }), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});