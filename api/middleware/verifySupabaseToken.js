// =============================================================================
// SUPABASE AUTH MIDDLEWARE
// Extracts and verifies the JWT from the Authorization header.
// On success, attaches the authenticated user's Supabase UID to req.user.
// =============================================================================
const { createClient } = require('@supabase/supabase-js');

// Initialize the Supabase admin client (server-side only)
// Uses the SERVICE_ROLE key so we can verify any user's JWT.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Express middleware: verifySupabaseToken
 *
 * Usage:
 *   router.get('/protected', verifySupabaseToken, (req, res) => { ... });
 *
 * Flow:
 *   1. Extract "Bearer <token>" from the Authorization header.
 *   2. Call Supabase's getUser() to verify the token server-side.
 *   3. Attach the authenticated user object to req.user.
 *   4. Call next() to proceed, or return 401/403 on failure.
 */
const verifySupabaseToken = async (req, res, next) => {
  try {
    // --- Step 1: Extract the Bearer token ---
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or malformed Authorization header. Expected: Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];

    // --- Step 2: Verify the JWT with Supabase ---
    // getUser() validates the token server-side (not just decoding it)
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.warn('[AUTH] Token verification failed:', error?.message || 'No user returned');
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token.',
      });
    }

    // --- Step 3: Attach user info to the request ---
    req.user = {
      id: data.user.id,         // Supabase UUID — matches our User model PK
      email: data.user.email,
      phone: data.user.phone,
    };

    // --- Step 4: Proceed to the next middleware/route handler ---
    next();
  } catch (err) {
    console.error('[AUTH] Unexpected error during token verification:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.',
    });
  }
};

module.exports = verifySupabaseToken;
