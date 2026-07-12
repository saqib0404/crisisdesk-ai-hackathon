export type AdminRoleValue =
    | "admin"
    | "super_admin";

export interface AuthenticatedAdmin {
    id: string;
    name: string;
    email: string;
    role: AdminRoleValue;
}

export interface VerifiedAccessToken {
    adminId: string;
    email: string;
    role: AdminRoleValue;
}