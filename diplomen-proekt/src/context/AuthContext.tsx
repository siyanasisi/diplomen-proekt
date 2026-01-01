 import { createContext } from "react"
 import { User } from "@supabase/supabase-js"
 import { useState } from "react"
 import { supabase } from "../supabase-client"

 interface AuthContextType {
    user: User | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
 }

 const AuthContext = createContext<AuthContextType | undefined>(undefined)

 export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    
    const [user, setUser] = useState<User | null>(null)

    const signInWithGoogle = async () => {
        supabase.auth.signInWithOAuth({provider: "google"})
    }

    const signOut = async () => {}
    return <AuthContext.Provider value={{ user, signInWithGoogle, signOut }}> {children}</AuthContext.Provider>
 }

 export const useAuth = (): AuthContextType=> {

   const context = useContext(AuthContext)
   if( context === undefined) {
      throw new Error("useAuth must be used within an AuthProvider")
   }
   return context 
 }