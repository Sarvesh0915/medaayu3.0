import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// If you want the counter to look further along than actual signups
// (common for early pre-launch pages), raise this. Set to 0 for the real number.
const BASE_OFFSET = 0;

export default async function handler(req, res) {
  try {
    const { count, error } = await supabase
      .from('waitlist_signups')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return res.status(200).json({ ok: true, count: (count || 0) + BASE_OFFSET });
  } catch (err) {
    console.error('waitlist-count failed:', err);
    // Fail soft — frontend falls back to a static number if this errors.
    return res.status(200).json({ ok: false, count: null });
  }
}
