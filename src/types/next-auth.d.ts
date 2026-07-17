import type { UserRole } from "../auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      error?: string;
    };
  }

  interface User {
    role: UserRole;
    accessToken: string;
    idToken: string;
    refreshToken: string;
    accessTokenExpiry: number;
    error?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: UserRole;
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    accessTokenExpiry?: number;
    error?: string;
  }
}
