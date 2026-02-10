import RentPageClient from './RentPageClient'
export const dynamic = 'force-dynamic'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Rent Properties in Malaysia | SuperHomes',
    description: 'Find your perfect rental home. Browse condos, apartments, and landed properties for rent across Malaysia.',
}

export default function RentPage() {
    return <RentPageClient />
}
