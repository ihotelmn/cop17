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
    const pathname = usePathname();
    const supabase = createClient();

    const checkUser = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            // console.log("[AuthProvider] checkUser session:", session?.user?.id);
            if (session?.user) {
                await fetchProfile(session.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Error checking auth:", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Check user on mount and pathname change
    useEffect(() => {
        checkUser();
    }, [pathname]);

    // Subscribe to auth changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            // console.log("[AuthProvider] onAuthStateChange:", event, session?.user?.id);
            if (session?.user) {
                await fetchProfile(session.user);
            } else {
                setUser(null);
                setIsLoading(false);
            }

            if (event === 'SIGNED_OUT') {
                router.push("/");
                router.refresh();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, supabase]);

    const fetchProfile = async (authUser: SupabaseUser) => {
        try {
            const { data: profile, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", authUser.id)
                .single();

            if (profile) {
                setUser({
                    id: authUser.id,
                    email: authUser.email!,
                    full_name: profile.full_name,
                    role: profile.role as any,
                });
            } else {
                setUser({
                    id: authUser.id,
                    email: authUser.email!,
                    role: "guest",
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            setUser({
                id: authUser.id,
                email: authUser.email!,
                role: "guest",
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
