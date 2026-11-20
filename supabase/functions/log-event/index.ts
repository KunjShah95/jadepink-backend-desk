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
    const { lotId, action, entity, entityId, before, after, text, by } = await req.json();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await withTimeout(
      supabase
        .from('events')
        .insert({
          lot_id: lotId,
          action,
          entity,
          entity_id: entityId,
          before: before || {},
          after: after || {},
          text,
          by,
        }),
      TIMEOUT_MS
    );

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});