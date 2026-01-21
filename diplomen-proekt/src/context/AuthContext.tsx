import { createContext, useContext, useEffect } from "react"
import type { User } from "@supabase/supabase-js";
import { useState } from "react"
import { supabase } from "../supabase-client"

export type UserRole = 'student' | 'teacher';

interface AuthContextType {
   user: User | null;
   role: UserRole | null;
   loading: boolean;
   signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// helper function to extract role from user metadata
const getUserRole = (user: User | null): UserRole | null => {
   if (!user || !user.user_metadata) return null;
   const role = user.user_metadata.role;
   if (role === 'student' || role === 'teacher') {
      return role;
   }
   return null;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
   
   const [user, setUser] = useState<User | null>(null)
   const [role, setRole] = useState<UserRole | null>(null)
   const [loading, setLoading] = useState(true)

   useEffect(() => {
     // get initial session
     supabase.auth.getSession().then(({ data: { session } }) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setRole(getUserRole(currentUser));
        setLoading(false);
     })

     // listen for auth state changes
     const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // Handle token expired event
        if (event === 'TOKEN_REFRESHED') {
           console.log('Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
           console.log('User signed out');
        }
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setRole(getUserRole(currentUser));
        setLoading(false);
     })
     
     return () => {
        subscription.unsubscribe()
     }
   }, [])

   const signOut = async () => {
     const { error } = await supabase.auth.signOut()
     if (error) {
        console.error('Error signing out:', error)
     } else {
        setUser(null)
        setRole(null)
        window.location.href = '/'
     }
   }
   
   return (
      <AuthContext.Provider value={{ user, role, loading, signOut }}>
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