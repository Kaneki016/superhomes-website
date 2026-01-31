
import 'server-only'
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioNumber = process.env.TWILIO_PHONE_NUMBER

const client = twilio(accountSid, authToken)

export async function sendWhatsAppOtp(phone: string, code: string) {
    if (!accountSid || !authToken || !twilioNumber) {
        console.error('Missing Twilio Credentials')
        throw new Error('Server configuration error')
    }

    // Ensure phone is in E.164 format and has whatsapp prefix if not present
    // Twilio requires 'whatsapp:+1234567890'
    let to = phone
    if (!to.startsWith('whatsapp:')) {
        to = `whatsapp:${to}`
    }

    try {
        const message = await client.messages.create({
            body: `Your Superhomes verification code is: ${code}`,
            from: twilioNumber.startsWith('whatsapp:') ? twilioNumber : `whatsapp:${twilioNumber}`,
            to: to
        })
        console.log('OTP Sent:', message.sid)
        return { success: true, sid: message.sid }
    } catch (error) {
        console.error('Twilio Error:', error)
        return { success: false, error }
    }
}
