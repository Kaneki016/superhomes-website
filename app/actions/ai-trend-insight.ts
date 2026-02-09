'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

export async function generateTrendInsight(dataSummary: string) {
    // 1. Check API Key
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return {
            success: false,
            message: "API Key not configured. Please check .env.local"
        }
    }

    try {
        // 2. Initialize Client
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)

        // 3. Select Model - Using 'gemini-2.5-flash' which is the latest stable version
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const prompt = `
        You are a real estate market analyst. Analyze the following yearly transaction data for a specific neighborhood:
        
        ${dataSummary}

        Provide 3 short, punchy, high-impact bullet points summarizing the key trends.
        Focus on:
        1. Price movements (Up/Down/Stable)
        2. Volume changes (Demand sentiment)
        3. Notable shifts in property type preferences (if visible)

        Keep it under 60 words total. Use professional but accessible tone.
        Do not use markdown formatting like **bold** or *italics*, just plain text with bullet points (•).
        `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        return { success: true, data: text }
    } catch (error: any) {
        console.error('Gemini API Error:', error)

        // Nicer error message if model is not found
        if (error.message?.includes('404') || error.message?.includes('not found')) {
            return {
                success: false,
                message: "Selected AI model is not available. Please check API settings."
            }
        }

        return {
            success: false,
            message: "Failed to generate insights. Please try again later."
        }
    }
}
