'use client'

interface DescriptionProps {
    text: string
}

export default function PropertyDescription({ text }: DescriptionProps) {
    if (!text) return null

    // Split text into paragraphs
    const paragraphs = text.split(/\n\n+/)

    // Function to format a single paragraph/section
    const formatParagraph = (paragraph: string, index: number) => {
        const lines = paragraph.split('\n')

        // Check if this is a list section (contains bullet points)
        const isBulletList = lines.some(line =>
            line.trim().startsWith('*') ||
            line.trim().startsWith('•') ||
            line.trim().startsWith('-') ||
            line.trim().startsWith('✅') ||
            line.trim().startsWith('↪') ||
            line.trim().startsWith('🔴') ||
            line.trim().startsWith('🟣')
        )

        // Check if this is a header/separator line
        const isSeparator = paragraph.trim().match(/^[=\-_]{3,}$/)
        if (isSeparator) {
            return <hr key={index} className="my-4 border-gray-200" />
        }

        // Check if this looks like a price section
        const isPriceSection = paragraph.toLowerCase().includes('price') ||
            paragraph.toLowerCase().includes('harga') ||
            paragraph.includes('RM ')

        if (isBulletList) {
            return (
                <ul key={index} className="space-y-2 my-4">
                    {lines.map((line, lineIndex) => {
                        const trimmedLine = line.trim()
                        if (!trimmedLine) return null

                        // Remove bullet characters and format
                        const cleanLine = trimmedLine
                            .replace(/^[\*\•\-]\s*/, '')
                            .replace(/^↪\s*/, '')

                        // Keep emoji bullets as-is
                        if (trimmedLine.match(/^[✅🔴🟣🔵⚠️]/)) {
                            return (
                                <li key={lineIndex} className="flex items-start">
                                    <span className="mr-2">{trimmedLine.charAt(0)}</span>
                                    <span>{trimmedLine.slice(1).trim()}</span>
                                </li>
                            )
                        }

                        // Regular bullet points
                        if (trimmedLine.startsWith('*') || trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('↪')) {
                            return (
                                <li key={lineIndex} className="flex items-start">
                                    <span className="text-primary-500 mr-2">•</span>
                                    <span>{cleanLine}</span>
                                </li>
                            )
                        }

                        return <li key={lineIndex}>{trimmedLine}</li>
                    })}
                </ul>
            )
        }

        if (isPriceSection) {
            return (
                <div key={index} className="my-4 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg border-l-4 border-primary-500">
                    {lines.map((line, lineIndex) => {
                        const trimmedLine = line.trim()
                        if (!trimmedLine) return null

                        // Highlight price
                        if (trimmedLine.includes('RM ') || trimmedLine.match(/RM\s?\d/)) {
                            return (
                                <p key={lineIndex} className="font-bold text-lg text-primary-600">
                                    {trimmedLine}
                                </p>
                            )
                        }
                        return <p key={lineIndex}>{trimmedLine}</p>
                    })}
                </div>
            )
        }

        // Regular paragraph
        return (
            <div key={index} className="my-3">
                {lines.map((line, lineIndex) => {
                    const trimmedLine = line.trim()
                    if (!trimmedLine) return <br key={lineIndex} />

                    // Check for separator lines within paragraphs
                    if (trimmedLine.match(/^[=\-_]{3,}$/)) {
                        return <hr key={lineIndex} className="my-3 border-gray-200" />
                    }

                    // Check if line looks like a heading (all caps or short emphatic text)
                    const isHeading = trimmedLine.length < 60 && (
                        trimmedLine === trimmedLine.toUpperCase() ||
                        trimmedLine.endsWith(':')
                    )

                    if (isHeading) {
                        return (
                            <p key={lineIndex} className="font-semibold text-gray-900 mt-4 mb-2">
                                {trimmedLine}
                            </p>
                        )
                    }

                    return <p key={lineIndex} className="text-gray-700">{trimmedLine}</p>
                })}
            </div>
        )
    }

    return (
        <div className="property-description leading-relaxed">
            {paragraphs.map((paragraph, index) => formatParagraph(paragraph, index))}
        </div>
    )
}
