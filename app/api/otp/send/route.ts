import { NextResponse } from 'next/server'
// import sql from '@/lib/db' // DB no longer needed for OTP storage
import { sendVerificationCode } from '@/lib/twilio'
// import crypto from 'crypto' // Crypto no longer needed

export async function POST(req: Request) {
    try {
        // Accept generic identifier (email or phone)
        const { identifier, phone } = await req.json()
        const target = identifier || phone

        if (!target) {
            return NextResponse.json({ error: 'Email or Phone is required' }, { status: 400 })
        }

        // 3. Send via Twilio (or Mock in Dev)
        if (process.env.NODE_ENV === 'development') {
            const mockCode = '123456' // Static code for simple dev
            console.log('\n==================================================')
            console.log(`🔐 MOCK OTP for ${target}: ${mockCode}`)
            console.log('==================================================\n')
            // Note: In dev mode with mock, we don't actually call Twilio Verify.
            // But we can't 'verify' it on the check side if we didn't start it?
            // Actually, if we use Mock, we need a way to bypass Verify Check too.
            // For now, let's assume if dev mode, we handle it in auth.ts specially.
            return NextResponse.json({ success: true })
        }

        // Email OTP check (if target is email)
        if (target.includes('@')) {
            // TODO: Implement Email Sending (NodeMailer / Resend)
            console.log(`[Email] Would send code to ${target}`)
            return NextResponse.json({ success: true })
        }

        // Use Twilio Verify API (WhatsApp by default, or SMS)
        // Check if phone number is valid E.164
        const result = await sendVerificationCode(target, 'whatsapp')

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
