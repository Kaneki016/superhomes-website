
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const resourcesDirectory = path.join(process.cwd(), 'content/resources')

export interface ResourcePost {
    slug: string
    title: string
    description: string
    date: string
    category: string
    image: string
    content: string
    neighborhoods?: string[]
}

export function getAllResources(): ResourcePost[] {
    // Check if directory exists
    if (!fs.existsSync(resourcesDirectory)) {
        return []
    }

    const fileNames = fs.readdirSync(resourcesDirectory)
    const allResourcesData = fileNames
        .filter((fileName) => fileName.endsWith('.md'))
        .map((fileName) => {
            const slug = fileName.replace(/\.md$/, '')
            const fullPath = path.join(resourcesDirectory, fileName)
            const fileContents = fs.readFileSync(fullPath, 'utf8')
            const { data, content } = matter(fileContents)

            return {
                slug,
                content,
                ...(data as {
                    title: string
                    description: string
                    date: string
                    category: string
                    image: string
                    neighborhoods?: string[]
                }),
            }
        })

    // Sort resources by date
    return allResourcesData.sort((a, b) => {
        if (a.date < b.date) {
            return 1
        } else {
            return -1
        }
    })
}

export function getResourceBySlug(slug: string): ResourcePost | null {
    try {
        const fullPath = path.join(resourcesDirectory, `${slug}.md`)

        if (!fs.existsSync(fullPath)) {
            return null
        }

        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { data, content } = matter(fileContents)

        return {
            slug,
            content,
            ...(data as {
                title: string
                description: string
                date: string
                category: string
                image: string
                neighborhoods?: string[]
            }),
        }
    } catch (error) {
        return null
    }
}

export function getRelatedResources(currentSlug: string, category: string, limit: number = 3): ResourcePost[] {
    const allResources = getAllResources()

    // 1. Filter by category, exclude current
    let related = allResources.filter(post => post.category === category && post.slug !== currentSlug)

    // 2. If not enough, fill with other recent posts
    if (related.length < limit) {
        const others = allResources.filter(post => post.category !== category && post.slug !== currentSlug)
        // Sort others by date (already sorted by getAllResources)
        related = [...related, ...others.slice(0, limit - related.length)]
    }

    return related.slice(0, limit)
}

export function getAllCategories(): string[] {
    const resources = getAllResources()
    const categories = new Set(resources.map(post => post.category))
    return Array.from(categories).sort()
}
