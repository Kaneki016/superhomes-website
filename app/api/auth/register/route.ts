
import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password, name, phone, userType, agency, renNumber } = body

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Check if user exists
        const [existing] = await sql`SELECT id FROM users WHERE email = ${email}`
        if (existing) {
            // If user exists, update password? Or fail?
            // Assuming registration = new user
            return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10)

        // 3. Create User
        let userId

        // Check if user was created via OTP (phone match)
        if (phone) {
            const [phoneUser] = await sql`SELECT id FROM users WHERE phone = ${phone}`
            if (phoneUser) {
                // Update existing OTP user with email/password
                await sql`
                UPDATE users 
                SET email = ${email}, password = ${hashedPassword}, name = ${name}, updated_at = NOW()
                WHERE id = ${phoneUser.id}
            `
                userId = phoneUser.id
            }
        }

        if (!userId) {
            const [newUser] = await sql`
            INSERT INTO users (email, password, name, phone, role)
            VALUES (${email}, ${hashedPassword}, ${name}, ${phone}, ${userType || 'user'})
            RETURNING id
        `
            userId = newUser.id
        }

        // 4. Create Profile (Buyer or Agent)
        if (userType === 'buyer') {
            await sql`
            INSERT INTO buyers (auth_id, email, name, phone)
            VALUES (${userId}, ${email}, ${name}, ${phone})
         `
        } else if (userType === 'agent') {
            // Agent Claiming Logic
            // Check if agent exists in contacts
            let existingAgent = null
            if (phone) {
                [existingAgent] = await sql`SELECT * FROM contacts WHERE phone = ${phone} AND contact_type = 'agent' LIMIT 1`
            }
            if (!existingAgent) {
                [existingAgent] = await sql`SELECT * FROM contacts WHERE email = ${email} AND contact_type = 'agent' LIMIT 1`
            }

            if (existingAgent) {
                // Claim Logic
                await sql`
                UPDATE contacts SET 
                    auth_id = ${userId},
                    email = ${email},
                    is_claimed = true,
                    updated_at = NOW()
                WHERE id = ${existingAgent.id}
             `
            } else {
                // New Agent
                await sql`
                INSERT INTO contacts (auth_id, contact_type, email, name, phone, company_name, ren_number, is_claimed)
                VALUES (${userId}, 'agent', ${email}, ${name}, ${phone}, ${agency}, ${renNumber}, true)
            `
            }
        }

        return NextResponse.json({ success: true, userId })

    } catch (error) {
        console.error('Registration Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
