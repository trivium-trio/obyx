import { OpenAPI } from './generated';
import { supabase } from '../supabase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

// Configure the generated OpenAPI client
OpenAPI.BASE = API_BASE;

// Dynamically fetch the token for each request
OpenAPI.TOKEN = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
};

export * from './generated';
