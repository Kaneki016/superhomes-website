
import 'server-only'
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID

export async function sendVerificationCode(to: string, channel: 'sms' | 'whatsapp' = 'whatsapp') {
    if (!accountSid || !authToken || !serviceSid) {
        console.error('Missing Twilio Credentials')
        throw new Error('Server configuration error: Missing Twilio Credentials')
    }

    try {
        const verification = await client.verify.v2.services(serviceSid)
            .verifications
            .create({ to, channel })

        console.log('Verify OTP Sent:', verification.sid)
        return { success: true, sid: verification.sid }
    } catch (error) {
        console.error('Twilio Verify Error:', error)
        return { success: false, error }
    }
}

export async function checkVerificationCode(to: string, code: string) {
    if (!accountSid || !authToken || !serviceSid) {
        console.error('Missing Twilio Credentials')
        throw new Error('Server configuration error')
    }

    try {
        const verificationCheck = await client.verify.v2.services(serviceSid)
            .verificationChecks
            .create({ to, code })

        if (verificationCheck.status === 'approved') {
            return { success: true }
        } else {
            return { success: false, error: 'Invalid code' }
        }
    } catch (error) {
        console.error('Twilio Verify Check Error:', error)
        return { success: false, error }
    }
}
