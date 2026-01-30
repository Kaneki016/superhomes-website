
import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { sendWhatsAppOtp } from '@/lib/twilio'
import crypto from 'crypto'

export async function POST(req: Request) {
    try {
        const { phone } = await req.json()

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
        }

        // 1. Generate 6-digit code
        const code = crypto.randomInt(100000, 999999).toString()
        const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

        // 2. Store in DB
        // Save token. Upsert if exists for this identifier.
        await sql`
      INSERT INTO verification_tokens (identifier, token, expires)
      VALUES (${phone}, ${code}, ${expires})
      ON CONFLICT (identifier, token) 
      DO UPDATE SET expires = ${expires}
    `
        // Actually, handling conflicts on (identifier, token) might be weird if we gen a new token.
        // Better strategy for OTP: Delete old tokens for this phone, insert new one.
        // But table constraint is unique(identifier, token). 
        // Let's just Insert. If collision (extremely rare), we retry or just let it fail (user retries).
        // Better: Clean up old tokens first.

        await sql`DELETE FROM verification_tokens WHERE identifier = ${phone}`

        await sql`
      INSERT INTO verification_tokens (identifier, token, expires)
      VALUES (${phone}, ${code}, ${expires})
    `

        // 3. Send via Twilio (or Mock in Dev)
        if (process.env.NODE_ENV === 'development') {
            console.log('\n==================================================')
            console.log(`🔐 MOCK OTP for ${phone}: ${code}`)
            console.log('==================================================\n')
            return NextResponse.json({ success: true })
        }

        const result = await sendWhatsAppOtp(phone, code)

        if (!result.success) {
            const errorMessage = (result.error as any)?.message || 'Failed to send WhatsApp message'
            const errorCode = (result.error as any)?.code
            return NextResponse.json({ error: errorCode ? `${errorMessage} (Code: ${errorCode})` : errorMessage }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('OTP Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
