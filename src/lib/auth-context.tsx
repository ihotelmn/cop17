"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser, AuthChangeEvent, Session } from "@supabase/supabase-js";

interface User {
    id: string;
    email: string;
    full_name?: string;
    role: "super_admin" | "admin" | "vip" | "guest";
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    // Use useMemo to ensure single instance of supabase client per session
    const supabase = React.useMemo(() => createClient(), []);

    const checkUser = async () => {
        try {
            // Get session first
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Session check error:", error);
                setUser(null);
                setIsLoading(false);
                return;
            }

            if (session?.user) {
                // If we have a session, fetch profile
                await fetchProfile(session.user);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Error checking auth:", error);
            setUser(null);
            setIsLoading(false);
        }
    };

    // Initial check
    useEffect(() => {
        checkUser();
    }, []);

    // Listen for changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth State Change:", event, session?.user?.email);

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user) {
                    await fetchProfile(session.user);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsLoading(false);
                // Removing aggressive redirect to prevent "flashing" logout behavior
                // router.push("/"); 
                // router.refresh();
            } else if (event === 'INITIAL_SESSION') {
                // Handle initial session if needed, but checkUser covers it usually.
                if (session?.user) {
                    await fetchProfile(session.user);
                } else {
                    setIsLoading(false);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    const fetchProfile = async (authUser: SupabaseUser) => {
        try {
            console.log("Fetching profile for:", authUser.email);

            // Try to get profile
            const { data: profile, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", authUser.id)
                .single();

            if (error) {
                console.error("Error fetching profile from DB:", error);
            }

            // Construct user object
            // If profile is missing (e.g. new user not yet created in DB), fall back to metadata or defaults
            const role = profile?.role || (authUser.user_metadata?.role as any) || "guest";

            setUser({
                id: authUser.id,
                email: authUser.email!,
                full_name: profile?.full_name || authUser.user_metadata?.full_name,
                role: role,
            });
            console.log("User set with role:", role);

        } catch (error) {
            console.error("Error in fetchProfile:", error);
            // Fallback to basic user info from Auth
            setUser({
                id: authUser.id,
                email: authUser.email!,
                role: (authUser.user_metadata?.role as any) || "guest",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        setUser(null);
        setIsLoading(false);
        router.push("/login");
        router.refresh();
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
