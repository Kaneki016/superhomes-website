import { redirect } from 'next/navigation'
import { getPropertyById } from '@/lib/database'
import { generatePropertyUrl } from '@/lib/slugUtils'

interface Props {
    params: Promise<{ id: string }>
}

// 301 Redirect from old UUID-based URLs to new SEO-friendly slug URLs
export default async function PropertyRedirectPage({ params }: Props) {
    const { id } = await params

    // Fetch the property to generate the proper slug URL
    const property = await getPropertyById(id)

    if (!property) {
        // Property not found - let Next.js handle 404
        redirect('/404')
    }

    // Generate the new SEO-friendly URL and redirect
    const newUrl = generatePropertyUrl(property)

    // permanent: true creates a 308 (permanent redirect), similar to 301
    redirect(newUrl)
}
