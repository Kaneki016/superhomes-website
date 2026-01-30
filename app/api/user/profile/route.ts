
import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        // 1. Check if Agent
        const [agent] = await sql`
      SELECT * FROM contacts 
      WHERE auth_id = ${userId} AND contact_type = 'agent'
      LIMIT 1
    `
        if (agent) {
            return NextResponse.json({
                id: agent.id,
                auth_id: userId,
                email: agent.email,
                name: agent.name,
                phone: agent.phone,
                user_type: 'agent',
                photo_url: agent.photo_url,
                agency: agent.company_name,
                ren_number: agent.ren_number
            })
        }

        // 2. Check if Buyer
        const [buyer] = await sql`
      SELECT * FROM buyers 
      WHERE auth_id = ${userId} 
      LIMIT 1
    `

        if (buyer) {
            return NextResponse.json({
                id: buyer.id,
                auth_id: userId,
                email: buyer.email,
                name: buyer.name,
                phone: buyer.phone,
                user_type: 'buyer'
            })
        }

        // No profile found
        return NextResponse.json(null)

    } catch (error) {
        console.error('Profile Fetch Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
