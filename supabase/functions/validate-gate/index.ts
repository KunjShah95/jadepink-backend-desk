import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Gate dependency rules: a stage requires previous gates to be passed
const GATE_DEPS: Record<string, string[]> = {
  's2': ['s1'],       // Stage 2 needs Stage 1 passed
  's3': ['s2'],       // Stage 3 needs Stage 2 passed
  's4': ['s2', 's3'], // Stage 4 needs Stage 2 and Stage 3 (ironing) passed
  's5': ['s4'],       // Stage 5 needs Stage 4 passed
  's6': ['s5'],       // Stage 6 needs Stage 5 passed
  's7': ['s6'],       // Stage 7 needs Stage 6 passed
  's8': ['s7'],       // Stage 8 needs Stage 7 passed
};

// Simple timeout wrapper
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
    const { lotId, stage } = await req.json();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check required dependencies
    const deps = GATE_DEPS[stage] || [];
    for (const dep of deps) {
      const { data: gate } = await withTimeout(
        supabase.from('lot_gates').select('*').eq('lot_id', lotId).eq('stage', dep).maybeSingle(),
        TIMEOUT_MS * 0.8
      );

      if (!gate) {
        return new Response(JSON.stringify({
          valid: false,
          reason: `Gate ${dep.toUpperCase()} must be passed before ${stage.toUpperCase()}`,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Special rule: Stage 4 cannot pass until ironing (Stage 3) is done
    if (stage === 's4') {
      const { data: lot } = await withTimeout(
        supabase.from('lots').select('iron_count').eq('id', lotId).maybeSingle(),
        TIMEOUT_MS * 0.8
      );

      if (!lot || lot.iron_count == null || lot.iron_count < 1) {
        return new Response(JSON.stringify({
          valid: false,
          reason: 'Stage 4 requires ironing count (Stage 3) to be completed first',
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ valid: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});