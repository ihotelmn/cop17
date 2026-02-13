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
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
    children,
    initialUser
}: {
    children: React.ReactNode;
    initialUser: SupabaseUser | null;
}) {
    // Hydrate state from server-provided user
    const [user, setUser] = useState<User | null>(() => {
        if (!initialUser) return null;
        return {
            id: initialUser.id,
            email: initialUser.email!,
            full_name: initialUser.user_metadata?.full_name,
            role: (initialUser.user_metadata?.role as any) || "guest",
        };
    });

    // Server-side hydration means we know the state immediately
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    // Use useMemo to ensure single instance of supabase client per session
    const supabase = React.useMemo(() => createClient(), []);

    // Listen for changes (Login, Logout, Refresh)
    // Sync state if server passes a new user (e.g. after login redirect)
    useEffect(() => {
        if (initialUser) {
            console.log("Hydrating user from server prop update:", initialUser.email);
            const role = (initialUser.user_metadata?.role as any) || "guest";
            setUser({
                id: initialUser.id,
                email: initialUser.email!,
                full_name: initialUser.user_metadata?.full_name,
                role: role,
            });
            setIsLoading(false);
        }
    }, [initialUser]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth State Change:", event, session?.user?.email);

            if (session?.user) {
                // Refresh profile data if needed, or just trust session
                // Ideally we fetch profile to ensure we have strict DB role if metadata is stale
                // but for now, let's trust metadata for speed and stability
                // We can silently update profile in background
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    fetchProfile(session.user);
                }
            } else {
                // Explicit logout event
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    router.push("/login");
                    router.refresh();
                } else if (!user) {
                    // If we thought we were logged in but session is gone?
                    // Verify if initialUser was set but now session is null (shouldn't happen with server hydration)
                    // allow silent null
                    setUser(null);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    // Removed old checkUser() logic entirely as it's redundant with server hydration

    // ... fetchProfile and logout remain ...



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

    const refreshSession = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            if (session?.user) {
                await fetchProfile(session.user);
            }
        } catch (error) {
            console.error("Error refreshing session:", error);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        // Clear local state immediately
        setUser(null);

        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setIsLoading(false);
            router.push("/login");
            router.refresh();
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, logout, refreshSession }}>
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
