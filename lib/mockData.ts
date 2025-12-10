import { Property, Agent } from './supabase'

export const mockAgents: Agent[] = [
    {
        id: '1',
        user_id: 'user1',
        name: 'Sarah Chen',
        phone: '+60123456789',
        whatsapp: '+60123456789',
        profile_photo: null,
        credits_balance: 100,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
    },
    {
        id: '2',
        user_id: 'user2',
        name: 'Marcus Tan',
        phone: '+60129876543',
        whatsapp: '+60129876543',
        profile_photo: null,
        credits_balance: 150,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
    },
    {
        id: '3',
        user_id: 'user3',
        name: 'Aisha Rahman',
        phone: '+60187654321',
        whatsapp: '+60187654321',
        profile_photo: null,
        credits_balance: 200,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
    },
]

export const mockProperties: Property[] = [
    {
        id: '1',
        title: 'Luxury Penthouse in KLCC',
        description: 'Stunning penthouse with panoramic city views. Features include a private pool, modern kitchen, and premium finishes throughout.',
        price: 2500000,
        location: 'KLCC, Kuala Lumpur',
        property_type: 'Condo',
        bedrooms: 4,
        bathrooms: 3,
        built_up_size: 3200,
        tenure: 'Freehold',
        furnishing: 'Fully Furnished',
        images: ['property1.jpg'],
        status: 'active',
        agent_id: '1',
        created_at: '2024-12-01',
        updated_at: '2024-12-01',
    },
    {
        id: '2',
        title: 'Modern Semi-D in Damansara Heights',
        description: 'Beautiful semi-detached house in prestigious neighborhood. Spacious layout with garden and covered parking.',
        price: 3800000,
        location: 'Damansara Heights, Kuala Lumpur',
        property_type: 'Landed',
        bedrooms: 5,
        bathrooms: 4,
        built_up_size: 4500,
        tenure: 'Freehold',
        furnishing: 'Partially Furnished',
        images: ['property2.jpg'],
        status: 'active',
        agent_id: '2',
        created_at: '2024-12-02',
        updated_at: '2024-12-02',
    },
    {
        id: '3',
        title: 'Cozy Apartment in Mont Kiara',
        description: 'Well-maintained apartment perfect for young professionals. Close to amenities and public transport.',
        price: 680000,
        location: 'Mont Kiara, Kuala Lumpur',
        property_type: 'Apartment',
        bedrooms: 2,
        bathrooms: 2,
        built_up_size: 1100,
        tenure: 'Freehold',
        furnishing: 'Fully Furnished',
        images: ['property3.jpg'],
        status: 'active',
        agent_id: '1',
        created_at: '2024-12-03',
        updated_at: '2024-12-03',
    },
    {
        id: '4',
        title: 'Commercial Office Space in Bangsar',
        description: 'Prime commercial space in bustling Bangsar area. Ideal for businesses looking for high visibility location.',
        price: 1200000,
        location: 'Bangsar, Kuala Lumpur',
        property_type: 'Commercial',
        bedrooms: 0,
        bathrooms: 2,
        built_up_size: 2000,
        tenure: 'Freehold',
        furnishing: 'Unfurnished',
        images: ['property4.jpg'],
        status: 'active',
        agent_id: '3',
        created_at: '2024-12-04',
        updated_at: '2024-12-04',
    },
    {
        id: '5',
        title: 'Spacious Condo in Setia Alam',
        description: 'Family-friendly condominium with excellent facilities including swimming pool, gym, and playground.',
        price: 550000,
        location: 'Setia Alam, Shah Alam',
        property_type: 'Condo',
        bedrooms: 3,
        bathrooms: 2,
        built_up_size: 1400,
        tenure: 'Freehold',
        furnishing: 'Partially Furnished',
        images: ['property5.jpg'],
        status: 'active',
        agent_id: '2',
        created_at: '2024-12-05',
        updated_at: '2024-12-05',
    },
    {
        id: '6',
        title: 'Bungalow in Tropicana Golf Resort',
        description: 'Exclusive bungalow in gated community with golf course views. Premium living at its finest.',
        price: 5200000,
        location: 'Tropicana, Petaling Jaya',
        property_type: 'Landed',
        bedrooms: 6,
        bathrooms: 5,
        built_up_size: 6000,
        tenure: 'Freehold',
        furnishing: 'Fully Furnished',
        images: ['property6.jpg'],
        status: 'active',
        agent_id: '3',
        created_at: '2024-12-06',
        updated_at: '2024-12-06',
    },
]

export const propertyTypes = ['Condo', 'Landed', 'Commercial', 'Apartment']
export const locations = [
    'KLCC, Kuala Lumpur',
    'Damansara Heights, Kuala Lumpur',
    'Mont Kiara, Kuala Lumpur',
    'Bangsar, Kuala Lumpur',
    'Setia Alam, Shah Alam',
    'Tropicana, Petaling Jaya',
    'Cyberjaya, Selangor',
    'Putrajaya',
]

export const getAgentById = (agentId: string): Agent | undefined => {
    return mockAgents.find(agent => agent.id === agentId)
}

export const getPropertyById = (propertyId: string): Property | undefined => {
    return mockProperties.find(property => property.id === propertyId)
}

export const getFeaturedProperties = (): Property[] => {
    return mockProperties.slice(0, 3)
}

export const getRecentProperties = (): Property[] => {
    return mockProperties.slice(0, 6)
}
