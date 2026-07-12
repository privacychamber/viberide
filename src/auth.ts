import NextAuth, { DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
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
      name: "Phone and Password",
      credentials: {
        phone: { label: "Phone Number", type: "text", placeholder: "e.g., 9876543210" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error("Phone number and password are required");
        }

        const phone = credentials.phone as string;
        const password = credentials.password as string;

        await dbConnect();

        // Find user by phone
        const user = await User.findOne({ phone });

        if (!user) {
          throw new Error("Invalid phone number or password");
        }
        
        // Verify password
        if (!user.password) {
          throw new Error("Account was created via OTP. Please contact support.");
        }
        
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
          throw new Error("Invalid phone number or password");
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
  debug: true,
});
