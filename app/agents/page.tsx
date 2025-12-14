import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { mockAgents } from '@/lib/mockData'

export default function AgentsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="container-custom py-8">
                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="font-heading font-bold text-4xl md:text-5xl text-gray-900 mb-4">
                        Our Property Agents
                    </h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Connect with experienced real estate professionals who can help you find your dream property
                    </p>
                </div>

                {/* Agents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {mockAgents.map((agent) => (
                        <div key={agent.id} className="glass p-6 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                            {/* Agent Photo */}
                            <div className="flex justify-center mb-6">
                                {agent.photo_url ? (
                                    <img
                                        src={agent.photo_url}
                                        alt={agent.name}
                                        className="w-24 h-24 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-3xl">
                                        {agent.name.charAt(0)}
                                    </div>
                                )}
                            </div>

                            {/* Agent Info */}
                            <div className="text-center mb-6">
                                <h3 className="font-heading font-bold text-xl text-gray-900 mb-1">{agent.name}</h3>
                                {agent.agency && (
                                    <p className="text-primary-600 text-sm font-medium">{agent.agency}</p>
                                )}
                                <p className="text-gray-600 text-sm">Property Agent</p>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-center text-gray-600">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span className="text-sm">{agent.phone || 'Not available'}</span>
                                </div>
                            </div>

                            {/* Contact Buttons */}
                            <div className="space-y-3">
                                {agent.whatsapp_link && (
                                    <a
                                        href={agent.whatsapp_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary w-full flex items-center justify-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        WhatsApp
                                    </a>
                                )}
                                {agent.phone && (
                                    <a
                                        href={`tel:${agent.phone}`}
                                        className="btn-secondary w-full flex items-center justify-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        Call Agent
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA Section */}
                <div className="mt-16 text-center">
                    <div className="glass p-10 rounded-2xl max-w-3xl mx-auto">
                        <h2 className="font-heading font-bold text-3xl text-gray-900 mb-4">
                            Are You a Property Agent?
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Join SuperHomes and reach thousands of potential buyers. List your properties with us today.
                        </p>
                        <a href="/register" className="btn-primary">
                            Register as Agent
                        </a>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}
