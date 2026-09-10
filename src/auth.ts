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
      isEmailVerified?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "renter" | "owner" | "admin";
    phone?: string;
    verified?: boolean;
    isEmailVerified?: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone Number or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error("Phone number (or email) and password are required");
        }

        const identifier = (credentials.phone as string).trim();
        const password = credentials.password as string;

        await dbConnect();

        // Support login by phone number OR by email address
        const cleanPhone = identifier.replace(/\D/g, "");
        const isEmail = identifier.includes("@");

        let user = null;
        if (isEmail) {
          user = await User.findOne({ email: identifier.toLowerCase() });
        } else if (cleanPhone.length >= 10) {
          user = await User.findOne({ phone: cleanPhone });
        } else {
          user = await User.findOne({
            $or: [{ phone: identifier }, { email: identifier.toLowerCase() }],
          });
        }

        if (!user) {
          throw new Error("Invalid credentials. Please check your details.");
        }

        // Verify password
        if (!user.password) {
          throw new Error("Account has no password set. Please reset your password.");
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
          throw new Error("Invalid credentials. Please check your details.");
        }

        // Check email verification
        if (user.email && user.emailVerified === false) {
          throw new Error(`UNVERIFIED_EMAIL:${user.email}`);
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          verified: user.verified,
          isEmailVerified: user.emailVerified,
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
        token.email = user.email;
        token.verified = user.verified;
        token.isEmailVerified = user.isEmailVerified;
      }

      // Support manual session updates (like updating verification state)
      if (trigger === "update" && session?.user) {
        token.verified = session.user.verified;
        token.isEmailVerified = session.user.isEmailVerified;
        token.role = session.user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "renter" | "owner" | "admin";
        session.user.phone = token.phone as string;
        session.user.email = token.email as string;
        session.user.verified = token.verified as boolean;
        session.user.isEmailVerified = token.isEmailVerified as boolean;
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
  debug: process.env.NODE_ENV === "development",
});
