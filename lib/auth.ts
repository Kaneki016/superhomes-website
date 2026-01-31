import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import sql from "@/lib/db"

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

                const phone = credentials.phone as string
                const code = credentials.code as string

                try {
                    const cleanPhone = (credentials.phone as string).trim()
                    const cleanCode = (credentials.code as string).trim()

                    // console.log(`[Auth] Verifying OTP`)

                    // 1. Verify OTP
                    const [token] = await sql`
                        SELECT * FROM verification_tokens
                        WHERE identifier = ${cleanPhone} AND token = ${cleanCode}
                    `

                    if (!token) {
                        console.error('[Auth] Token not found or mismatch')
                        // Optional: Check if phone exists at all to debug
                        const [checkPhone] = await sql`SELECT * FROM verification_tokens WHERE identifier = ${cleanPhone}`
                        if (checkPhone) console.error(`[Auth] Token mismatch. Expected: ${checkPhone.token}, Got: ${cleanCode}`)
                        else console.error(`[Auth] No token found for identifier ${cleanPhone}`)

                        throw new Error("Invalid code")
                    }

                    // Check if token exists and is not expired
                    if (!token) throw new Error("Invalid code")
                    if (new Date() > new Date(token.expires)) throw new Error("Code expired")

                    // 2. Delete used token
                    await sql`DELETE FROM verification_tokens WHERE identifier = ${phone}`

                    // 3. Find or Create User
                    let [user] = await sql`SELECT * FROM users WHERE phone = ${phone}`

                    if (!user) {
                        // New User Registration (via OTP)
                        // See if we have an existing Agent (Contact) or Buyer to link?
                        // For now, create a basic user.
                        // The ClaimAgent logic will specificially update 'contacts' table to link to this new UUID.
                        [user] = await sql`
              INSERT INTO users (phone, role)
              VALUES (${phone}, 'user')
              RETURNING *
            `
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
