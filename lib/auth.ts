import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import sql from "@/lib/db"
import { checkVerificationCode } from "@/lib/twilio"

import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
    debug: process.env.NODE_ENV === 'development',
    trustHost: true, // Required for Netlify/Vercel deployments
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt" },
    providers: [
        Credentials({
            id: "credentials",
            name: "Password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const email = credentials.email as string
                const password = credentials.password as string

                try {
                    // console.log(`[Auth] Authorizing ${email}`)
                    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`
                    console.log(`[Auth] User found: ${!!user}`)

                    if (!user || !user.password) {
                        console.log('[Auth] User not found or no password')
                        return null
                    }

                    const isValid = await bcrypt.compare(password, user.password)
                    if (!isValid) return null

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        role: user.role
                    }
                } catch (error) {
                    return null
                }
            }
        }),
        Credentials({
            id: "otp",
            name: "OTP",
            credentials: {
                phone: { label: "Phone", type: "text" },
                code: { label: "Code", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.phone || !credentials?.code) return null

                const identifier = (credentials.phone as string).trim() // We overload 'phone' field to carry identifier
                const code = (credentials.code as string).trim()

                try {
                    // console.log(`[Auth] Verifying OTP for ${identifier}`)

                    // 1. Verify OTP
                    // If Dev Mode & Mock Code (123456), bypass check
                    if (process.env.NODE_ENV === 'development' && code === '123456') {
                        console.log('[Auth] Dev Mock OTP Bypass')
                    } else {
                        // Official Check via Twilio
                        const result = await checkVerificationCode(identifier, code)
                        if (!result.success) {
                            console.error('[Auth] Verify Failed:', result.error)
                            throw new Error("Invalid code")
                        }
                    }

                    // 2. No need to delete token manually (Twilio handles usage)

                    // 3. Find or Create User
                    // Check if identifier looks like email or phone
                    let user;
                    const isEmail = identifier.includes('@');

                    if (isEmail) {
                        [user] = await sql`SELECT * FROM users WHERE email = ${identifier}`
                    } else {
                        [user] = await sql`SELECT * FROM users WHERE phone = ${identifier}`
                    }

                    if (!user) {
                        // New User Registration (via OTP)
                        if (isEmail) {
                            [user] = await sql`
                                INSERT INTO users (email, role)
                                VALUES (${identifier}, 'user')
                                RETURNING *
                            `
                        } else {
                            [user] = await sql`
                                INSERT INTO users (phone, role)
                                VALUES (${identifier}, 'user')
                                RETURNING *
                            `
                        }
                    }

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        role: user.role
                    }

                } catch (error) {
                    console.error("Auth Error:", error)
                    return null
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            console.log('[Auth] JWT Callback', { hasUser: !!user })
            if (user) {
                token.id = user.id
                // token.role = user.role // Add custom types later
            }
            return token
        },
        async session({ session, token }) {
            console.log('[Auth] Session Callback')
            if (session.user) {
                session.user.id = token.id as string
                // session.user.role = token.role 
            }
            return session
        },
    },
})
