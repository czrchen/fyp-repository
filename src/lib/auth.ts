import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { toast } from "sonner";

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Login
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account"
        }
      }
    }),

    // Email + Password Login
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log(" Missing email or password");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.log("Invalid password or Email not found");
          return null;
        }

        // Prevent password login for Google accounts
        if (user.isGoogleSignIn) {
          console.log("This account uses Google Sign-In only");
          throw new Error("This account uses Google Sign-In");
        }

        if (!user.password) {
          console.log("No password set");
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          console.log("Invalid password or Email not found");
          return null;
        }

        return {
          id: user.id,
          name: user.full_name,
          email: user.email,
        };
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: "jwt" },

  pages: {
    signIn: "/auth",
  },

  callbacks: {
    // Handle Google Sign-In user creation or login
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          //  Existing Google user, just allow login
          if (!existingUser.isGoogleSignIn) {
            console.log("Email exists but not for Google sign-in");
            return "/auth/signin?error=GoogleSignInNotAllowed";
          }
          return true;
        }

        // Create new Google user in your schema
        await prisma.user.create({
          data: {
            full_name: user.name ?? "Unnamed User",
            email: user.email,
            isGoogleSignIn: true,
            password: null, //  no password for Google users
          },
        });

        return true;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },
};
