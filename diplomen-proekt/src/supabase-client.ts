import { createClient } from "@supabase/supabase-js";

const supabaseURL = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseURL, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'supabase-auth-token'
    }
});

// get a valid, unexpired access token
export const getAccessToken = async (): Promise<string | null> => {
    // force getting a fresh session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
        console.error('No session found:', error);
        return null;
    }
    
    // check if token is expired or will soon expire
    const expiresAt = session.expires_at;
    if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = expiresAt - now;
        
        console.log(`Token expires in ${expiresIn}s`);
        
        if (expiresIn <= 300) {
            console.log('Refreshing token...');
            
            // clear the old session 
            await supabase.auth.stopAutoRefresh();
            
            const { data, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError || !data.session) {
                console.error('Error refreshing session:', refreshError);
                await supabase.auth.signOut();
                return null;
            }
            
            console.log('Token refreshed successfully, new expiry:', data.session.expires_at);
            
            // restart auto-refresh
            supabase.auth.startAutoRefresh();
            
            return data.session.access_token;
        }
    }
    
    return session.access_token;
};

// helper function to ensure valid session before requests
export const ensureValidSession = async () => {
    const token = await getAccessToken();
    if (!token) {
        throw new Error('Failed to get valid access token');
    }
    return token;
};