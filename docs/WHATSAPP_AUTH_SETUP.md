# WhatsApp OTP Setup Guide (Supabase + Twilio)

To send Login OTPs via WhatsApp instead of (or alongside) SMS, you need to configure Supabase with a WhatsApp provider (Twilio).

## 1. Prerequisites
- **Twilio Account**: Sign up at [twilio.com](https://www.twilio.com/).
- **WhatsApp Sender**:
    - For **Development**: Use the [Twilio WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox).
    - For **Production**: You must request a [WhatsApp Business Number](https://www.twilio.com/docs/whatsapp/tutorial/connect-number-business-profile) approval.

## 2. Configure Twilio
1.  Go to your **Twilio Console**.
2.  Get your **Account SID** and **Auth Token**.
    - Found on the main [Twilio Console Dashboard](https://console.twilio.com/).
    - Look for the "Account Info" section.
    - The Auth Token is usually hidden; click "Show" to copy it.
3.  Get your **WhatsApp Sender Number** (e.g., `+14155238886`).
4.  Create a **Messaging Service** (Optional but recommended for bundling):
    - Messaging > Services > Create New Service.
    - Add your WhatsApp sender to this service.

## 3. Configure Supabase
1.  Go to your **Supabase Dashboard**.
2.  Navigate to **Authentication** > **Providers** > **Phone**.
3.  **Enable Phone Provider**.
4.  Scroll down to **SMS Provider Settings**.
5.  Select **Twilio** from the dropdown.
6.  Enter your Twilio credentials:
    - **Account SID**
    - **Auth Token**
    - **Message Service SID** (Use your Messaging Service ID, or leave blank if using a single number).
    - **Sender Number**: Enter your WhatsApp sender number (e.g., `+14155238886` or specific sender ID).
    - *Crucial*: For WhatsApp, Supabase typically uses the same "Twilio" provider hook. However, the *application code* must specify `channel: 'whatsapp'`.

## 4. Code Changes Required
In your application code (`ClaimAgentModal.tsx`), we need to specify the channel.

```typescript
// Current (SMS)
const { error } = await supabase.auth.signInWithOtp({
    phone: agent.phone
})

// New (WhatsApp)
const { error } = await supabase.auth.signInWithOtp({
    phone: agent.phone,
    options: {
        channel: 'whatsapp'
    }
})
```

## 5. Testing (Sandbox Mode)
If using Twilio Sandbox:
1.  The user (you) must first join the sandbox by sending a specific code (e.g., `join something-random`) to the Twilio Sandbox Number on WhatsApp.
2.  Once joined, you can receive OTPs.
3.  In Production setup, this step is not required; any number can receive messages (subject to WhatsApp pricing/conversation rules).
