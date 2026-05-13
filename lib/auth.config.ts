import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: "admin" | "staff" | "customer" }).role || "customer";
        token.credits = (user as { credits?: number }).credits || 0;
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "staff" | "customer";
        session.user.credits = token.credits as number;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
