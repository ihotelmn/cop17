"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
    id: string;
    email: string;
    full_name?: string;
    role: "super_admin" | "admin" | "liaison" | "vip" | "guest";
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    logout: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildClientUser(authUser: SupabaseUser, roleOverride?: User["role"] | null, fullNameOverride?: string | null): User {
    return {
        id: authUser.id,
        email: authUser.email!,
        full_name: fullNameOverride || authUser.user_metadata?.full_name,
        role: roleOverride || (authUser.user_metadata?.role as User["role"]) || "guest",
    };
}

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
        return buildClientUser(initialUser);
    });

    // Server-side hydration means we know the state immediately
    const [isLoading, setIsLoading] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    const fetchProfile = useCallback(async (authUser: SupabaseUser) => {
        try {
            const { data: profile, error } = await supabase
                .from("profiles")
                .select("full_name, role")
                .eq("id", authUser.id)
                .single();

            if (error && typeof error === "object") {
                const code = "code" in error ? error.code : null;
                if (code && code !== "PGRST116") {
                    console.error("Error fetching profile from DB:", error);
                }
            }

            setUser(buildClientUser(authUser, profile?.role || null, profile?.full_name || null));
        } catch (error) {
            console.error("Error in fetchProfile:", error);
            setUser(buildClientUser(authUser));
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        if (initialUser && !isLoggingOut) {
            setUser(buildClientUser(initialUser));
            setIsLoading(true);
            void fetchProfile(initialUser);
            return;
        }

        if (!initialUser && !isLoggingOut) {
            setUser(null);
            setIsLoading(false);
        }
    }, [initialUser, isLoggingOut, fetchProfile]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_OUT") {
                setUser(null);
                router.push("/login");
                router.refresh();
                return;
            }

            if (!session?.user || isLoggingOut) {
                return;
            }

            setUser(buildClientUser(session.user));
            setIsLoading(true);
            await fetchProfile(session.user);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router, isLoggingOut, fetchProfile]);

    const refreshSession = async () => {
        try {
            setIsLoading(true);
            const { data: { user: authUser }, error } = await supabase.auth.getUser();
            if (error) throw error;
            if (authUser) {
                await fetchProfile(authUser);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Error refreshing session:", error);
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setIsLoggingOut(true);
        // Clear local state immediately
        setUser(null);

        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            router.refresh();
            router.push("/login");
            // We verify logout by checking if user is truly null after a delay/refresh
            // But fundamentally, setting user null + refreshing router should work.
            setIsLoading(false);
            // We keep isLoggingOut true for a bit to prevent race conditions with hydration
            setTimeout(() => setIsLoggingOut(false), 2000);
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
