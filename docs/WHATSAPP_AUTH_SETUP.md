# Twilio WhatsApp OTP Setup Guide

This guide explains how to configure Twilio to send WhatsApp OTPs for SuperHomes.

## Phase 1: Immediate Testing (Sandbox)
You can test WhatsApp sending **immediately** without waiting for business verification using the Twilio Sandbox.

1.  **Go to Twilio Console**: [Twilio Sandbox for WhatsApp](https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox)
2.  **Activate Sandbox**: follow the instructions to active your sandbox.
3.  **Get Sandbox Number**: You will see a valid WhatsApp number (e.g., `+1 415 523 8886`).
4.  **Join the Sandbox**:
    *   Send the code shown (e.g., `join something-random`) from **your personal WhatsApp** to that sandbox number.
    *   **CRITICAL**: You can ONLY send messages to numbers that have explicitly "joined" the sandbox.
5.  **Update Environment Variables**:
    *   Open `.env.local`.
    *   Update `TWILIO_PHONE_NUMBER` to the **Sandbox Number** (e.g., `+14155238886`).

## Phase 2: Production Setup (Business Verification)
To send messages to **any** user (who hasn't joined your sandbox), you must get a verified Business Profile. This is a Meta (Facebook) requirement, not just Twilio.

1.  **Submit Business Profile**:
    *   Go to [Twilio > Messaging > Senders > WhatsApp Senders](https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders).
    *   Click "New WhatsApp Sender".
    *   Connect your **Facebook Business Manager** account.
2.  **Verify Business**:
    *   Upload business documents (SSM/Registration) to Facebook.
    *   Verify your business phone number (can be a landline or mobile, but must receive a verification call/text).
3.  **Wait for Approval**:
    *   Meta will review your display name and business details.
    *   This usually takes 24-48 hours.
4.  **Update Environment**:
    *   Once approved, update `TWILIO_PHONE_NUMBER` in `.env.local` to your **Approved Business Number**.

## Troubleshooting
*   **Error 63007 / 21608**: "Channel not found" or "Unverified number".
    *   *Cause*: You are sending from a number that is NOT a WhatsApp Sender.
    *   *Fix*: Use the Sandbox number (Step 1) OR get verified (Step 2).
*   **Message not delivered (Sandbox)**:
    *   *Cause*: The recipient phone number hasn't sent the `join code` message to the Sandbox number yet.
    *   *Fix*: Send `join <keyword>` from the recipient phone to the Sandbox number.
