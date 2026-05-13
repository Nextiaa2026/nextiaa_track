import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "staff" | "customer";
      credits: number;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "admin" | "staff" | "customer";
    credits?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "staff" | "customer";
    credits: number;
  }
}
