export type UserRole = "super_admin" | "admin" | "liaison" | "guest";

export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    role: UserRole;
    organization: string | null;
    created_at: string;
}

export interface UserFilters {
    role?: UserRole;
    search?: string;
}
