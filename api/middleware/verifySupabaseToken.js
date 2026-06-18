// SUPABASE AUTH MIDDLEWARE
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase admin client (server-side only)
// Uses the SERVICE_ROLE key so we can verify any user's JWT.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


const verifySupabaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or malformed Authorization header. Expected: Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.warn('[AUTH] Token verification failed:', error?.message || 'No user returned');
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token.',
      });
    }

    req.user = {
      id: data.user.id,        
      email: data.user.email,
      phone: data.user.phone,
    };
    next();
  } catch (err) {
    console.error('[AUTH] Unexpected error during token verification:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.',
    });
  }
};

export default verifySupabaseToken;
