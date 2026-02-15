import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import connectDB from "@/lib/db"
import User from "@/models/User"

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                await connectDB();

                const user = await User.findOne({ email: credentials.email });

                if (!user) {
                    return null
                }

                const isPasswordValid = await compare(credentials.password, user.password!)

                if (!isPasswordValid) {
                    return null
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                }
            }
        })
    ],
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                if (token.sub) {
                    // @ts-ignore
                    session.user.id = token.sub
                }
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        }
    }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

