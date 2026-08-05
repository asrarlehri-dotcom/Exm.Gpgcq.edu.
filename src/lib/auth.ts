import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

// Valid roles in the system
export const VALID_ROLES = [
  "SUPER_ADMIN",
  "BS_CONTROLLER",
  "BS_FACULTY",
  "INTER_FACULTY",
  "PRINCIPAL",
  "STUDENT",
] as const;

export type UserRole = typeof VALID_ROLES[number];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email",    placeholder: "admin@college.edu" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { student: true, faculty: true }
        });

        if (!user) return null;

        if (user.student && user.student.isActive === false)
          throw new Error("Your student account has been deactivated.");

        if (user.faculty && user.faculty.isActive === false)
          throw new Error("Your faculty account has been deactivated.");

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isValidPassword) return null;

        return {
          id:    user.id,
          email: user.email,
          name:  user.name,
          role:  user.role,
        };
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id   = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id   = token.id;
      }
      return session;
    }
  },
  pages: { signIn: "/login" }
};
