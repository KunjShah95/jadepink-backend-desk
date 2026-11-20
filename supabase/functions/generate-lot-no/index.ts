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
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    const lotNo = `IN-${yy}${mm}${dd}-${rand}`;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: existing } = await withTimeout(
      supabase.from('lots').select('lot_no').eq('lot_no', lotNo).maybeSingle(),
      TIMEOUT_MS * 0.8
    );

    if (existing) {
      // Retry with different random suffix
      const rand2 = Math.random().toString(36).substring(2, 5).toUpperCase();
      return new Response(JSON.stringify({ lot_no: `IN-${yy}${mm}${dd}-${rand2}` }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ lot_no: lotNo }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});