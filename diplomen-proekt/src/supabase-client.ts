import { createClient } from "@supabase/supabase-js";

const supabaseURL = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseURL, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// helper fun to refresh session 
export const refreshSessionIfNeeded = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
        return null;
    }
    
    // check if session is expired or will soon do
    const expiresAt = session.expires_at;
    if (expiresAt) {
        const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
        if (expiresIn <= 60) {
            const { data, error: refreshError } = await supabase.auth.refreshSession(session);
            if (refreshError) {
                console.error('Error refreshing session:', refreshError);
                return null;
            }
            return data.session;
        }
    }
    
    return session;
};