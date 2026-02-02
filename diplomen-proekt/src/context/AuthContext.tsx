import { createContext, useContext, useEffect, useCallback } from "react"
import type { User } from "@supabase/supabase-js";
import { useState } from "react"
import { supabase } from "../supabase-client"

export type UserRole = 'student' | 'teacher';

export interface CurrentUserProfile {
   avatar_url: string | null;
   first_name?: string | null;
   last_name?: string | null;
}

interface AuthContextType {
   user: User | null;
   role: UserRole | null;
   loading: boolean;
   signOut: () => Promise<void>;
   currentUserProfile: CurrentUserProfile | null;
   refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const getUserRole = (user: User | null): UserRole | null => {
   if (!user || !user.user_metadata) return null;
   const role = user.user_metadata.role;
   if (role === 'student' || role === 'teacher') return role;
   return null;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
   const [user, setUser] = useState<User | null>(null)
   const [role, setRole] = useState<UserRole | null>(null)
   const [loading, setLoading] = useState(true)
   const [currentUserProfile, setCurrentUserProfile] = useState<CurrentUserProfile | null>(null)

   useEffect(() => {
     supabase.auth.getSession().then(({ data: { session } }) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setRole(getUserRole(currentUser));
        setLoading(false);
     })

     const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'TOKEN_REFRESHED') console.log('Token refreshed successfully');
        else if (event === 'SIGNED_OUT') console.log('User signed out');
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setRole(getUserRole(currentUser));
        setLoading(false);
     })
     return () => subscription.unsubscribe()
   }, [])

   const loadProfile = useCallback(async () => {
     if (!user?.id) {
        setCurrentUserProfile(null);
        return;
     }
     const { data } = await supabase
        .from('profiles')
        .select('avatar_url, first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();
     if (data) {
        setCurrentUserProfile({
           avatar_url: data.avatar_url ?? null,
           first_name: data.first_name ?? null,
           last_name: data.last_name ?? null,
        });
     } else {
        setCurrentUserProfile(null);
     }
   }, [user?.id]);

   useEffect(() => {
     if (!user?.id) {
        setCurrentUserProfile(null);
        return;
     }
     loadProfile();
     (async () => {
        try {
           await supabase.from('profiles').update({
              last_seen_at: new Date().toISOString(),
              is_online: true,
           }).eq('id', user.id);
        } catch (err) {
           console.error("[AuthContext] Failed to update presence on login:", err);
        }
     })();
   }, [user?.id, loadProfile]);

   const refreshProfile = useCallback(() => loadProfile(), [loadProfile]);

   const signOut = async () => {
     if (user?.id) {
        try {
           await supabase.from('profiles').update({ is_online: false }).eq('id', user.id);
        } catch (err) {
           console.error("[AuthContext] Failed to set is_online false on sign out:", err);
        }
     }
     const { error } = await supabase.auth.signOut();
     if (error) console.error("[AuthContext] Error signing out:", error);
     else {
        setUser(null);
        setRole(null);
        setCurrentUserProfile(null);
        window.location.href = '/';
     }
   }

   return (
      <AuthContext.Provider value={{ user, role, loading, signOut, currentUserProfile, refreshProfile }}>
         {children}
      </AuthContext.Provider>
   )
}

 export const useAuth = (): AuthContextType=> {

   const context = useContext(AuthContext)
   if( context === undefined) {
      throw new Error("useAuth must be used within an AuthProvider")
   }
   return context 
 }