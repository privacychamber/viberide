import NextAuth, { DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "renter" | "owner" | "admin";
      phone: string;
      verified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "renter" | "owner" | "admin";
    phone: string;
    verified: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone Number", type: "text", placeholder: "e.g., 9876543210" },
        name: { label: "Full Name", type: "text", placeholder: "New users only" },
        otp: { label: "OTP", type: "text", placeholder: "e.g., 123456" },
      },
      async authorize(credentials) {
        if (!credentials?.phone) {
          throw new Error("Phone number is required");
        }

        const phone = credentials.phone as string;
        const name = (credentials.name as string) || "Viberider";
        const otp = credentials.otp as string;

        // Simple mock OTP validation (accepts any 6-digit number or 123456)
        if (otp && otp.length !== 6) {
          throw new Error("Invalid OTP format. Must be 6 digits.");
        }

        await dbConnect();

        // Find or create user
        let user = await User.findOne({ phone });

        if (!user) {
          user = await User.create({
            name,
            phone,
            role: "renter",
            verified: false,
            license: { status: "none" },
          });
        }

        return {
          id: user._id.toString(),
          name: user.name,
          phone: user.phone,
          role: user.role,
          verified: user.verified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.verified = user.verified;
      }
      
      // Support manual session updates (like updating verification state)
      if (trigger === "update" && session?.user) {
        token.verified = session.user.verified;
        token.role = session.user.role;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "renter" | "owner" | "admin";
        session.user.phone = token.phone as string;
        session.user.verified = token.verified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
});
