import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white mt-20">
            <div className="container-custom py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="col-span-1">
                        <div className="flex items-center space-x-2 mb-4">
                            <Image
                                src="/logo-icon.svg"
                                alt="SuperHomes Logo"
                                width={40}
                                height={40}
                                className="w-10 h-10"
                            />
                            <span className="font-heading font-bold text-2xl">SuperHomes</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Your premium property marketplace. Find your dream home with ease.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-heading font-semibold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/properties" className="text-gray-400 hover:text-white transition-colors">
                                    Browse Properties
                                </Link>
                            </li>
                            <li>
                                <Link href="/agents" className="text-gray-400 hover:text-white transition-colors">
                                    Find Agents
                                </Link>
                            </li>
                            {/* Hidden for now
                            <li>
                                <Link href="/sell" className="text-gray-400 hover:text-white transition-colors">
                                    Sell Property
                                </Link>
                            </li>
                            */}
                            <li>
                                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                                    About Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Property Types */}
                    <div>
                        <h3 className="font-heading font-semibold text-lg mb-4">Property Types</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/properties?propertyType=Condo" className="text-gray-400 hover:text-white transition-colors">
                                    Condominiums
                                </Link>
                            </li>
                            <li>
                                <Link href="/properties?propertyType=Landed" className="text-gray-400 hover:text-white transition-colors">
                                    Landed Properties
                                </Link>
                            </li>
                            <li>
                                <Link href="/properties?propertyType=Apartment" className="text-gray-400 hover:text-white transition-colors">
                                    Apartments
                                </Link>
                            </li>
                            <li>
                                <Link href="/properties?propertyType=Commercial" className="text-gray-400 hover:text-white transition-colors">
                                    Commercial
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-heading font-semibold text-lg mb-4">Contact Us</h3>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                +60 12-679 1203
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Kuala Lumpur, Malaysia
                            </li>
                        </ul>
                        <a
                            href="https://wa.me/60126791203"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            WhatsApp Us
                        </a>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
                    <p>&copy; 2026 SuperHomes. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
