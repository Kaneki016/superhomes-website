import NewProjectsClient from './NewProjectsClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'New Property Projects in Malaysia | SuperHomes',
    description: 'Explore the latest property launches and new developments in Malaysia. Early bird discounts and exclusive offers available.',
}

export default function NewProjectsPage() {
    return <NewProjectsClient />
}
