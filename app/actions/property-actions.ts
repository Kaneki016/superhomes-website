'use server'

import {
    getFeaturedProperties as dbGetFeatured,
    getHandpickedProperties as dbGetHandpicked,
    getFilterOptions as dbGetFilterOptions,
    getDistinctStates as dbGetDistinctStates,
    getPlatformStats as dbGetPlatformStats,
    getDistinctPropertyTypesByListingType as dbGetPropertyTypes,
    getTransactions as dbGetTransactions,
    getTransactionDistricts as dbGetTransactionDistricts,
    getTransactionMukims as dbGetTransactionMukims,
    getNeighborhoodsByMukim as dbGetNeighborhoodsByMukim,
    getTransactionMetrics as dbGetTransactionMetrics,
    getTransactionPropertyTypes as dbGetTransactionPropertyTypes,
    getTransactionTenures as dbGetTransactionTenures,
    getTransactionById as dbGetTransactionById,
    searchProperties as dbSearchProperties,
    getPropertiesPaginated as dbGetPropertiesPaginated,
    searchAgents as dbSearchAgents,
    getPropertiesByAgentIds as dbGetPropertiesByAgentIds,
    getPropertyById as dbGetPropertyById,
    getPropertyBySlug as dbGetPropertyBySlug,
    getAgentByAgentId as dbGetAgentByAgentId,
    getSimilarProperties as dbGetSimilarProperties,
    getAgentsPaginated as dbGetAgentsPaginated,
    getPropertiesByAgentId as dbGetPropertiesByAgentId,
} from '@/lib/database'

export async function getFeaturedProperties(limit: number) {
    return await dbGetFeatured(limit)
}

export async function getHandpickedProperties(limit: number, state?: string, filters?: any) {
    return await dbGetHandpicked(limit, state, filters)
}

export async function getFilterOptions() {
    return await dbGetFilterOptions()
}

export async function getDistinctStates() {
    return await dbGetDistinctStates()
}

export async function getPlatformStats() {
    return await dbGetPlatformStats()
}

export async function getDistinctPropertyTypesByListingType(listingType: string) {
    return await dbGetPropertyTypes(listingType as 'sale' | 'rent')
}

// Transaction Data
export async function getTransactions(page: number, pageSize: number, filters?: any) {
    return await dbGetTransactions(page, filters) // Original only took page and filters
}

export async function getTransactionDistricts() {
    return await dbGetTransactionDistricts()
}

export async function getTransactionMukims(district: string) {
    return await dbGetTransactionMukims(district)
}

export async function getNeighborhoodsByMukim(mukim: string) {
    return await dbGetNeighborhoodsByMukim(mukim)
}

export async function getTransactionMetrics(filters?: any) {
    return await dbGetTransactionMetrics(filters)
}

export async function getTransactionPropertyTypes() {
    return await dbGetTransactionPropertyTypes()
}

export async function getTransactionTenures() {
    return await dbGetTransactionTenures()
}

export async function getTransactionById(id: string) {
    return await dbGetTransactionById(id)
}

// General Property Helpers
export async function searchProperties(filters: any) { return await dbSearchProperties(filters) }

export async function getPropertiesPaginated(
    page: number = 1,
    pageSize: number = 12,
    filters: any = {},
    prioritizeStates: boolean = false
) {
    return await dbGetPropertiesPaginated(page, pageSize, filters, prioritizeStates)
}

export async function searchAgents(query: string, limit?: number) { return await dbSearchAgents(query, limit) }
export async function getPropertiesByAgentIds(agentIds: string[], limit?: number) { return await dbGetPropertiesByAgentIds(agentIds, limit) }
export async function getPropertyById(id: string) { return await dbGetPropertyById(id) }
export async function getPropertyBySlug(slug: string) { return await dbGetPropertyBySlug(slug) }
export async function getAgentByAgentId(agentId: string) { return await dbGetAgentByAgentId(agentId) }
export async function getSimilarProperties(
    propertyId: string,
    propertyType: string,
    state?: string | null,
    listingType?: string,
    district?: string | null
) {
    return await dbGetSimilarProperties(propertyId, propertyType, state, listingType, district)
}

export async function getAgentsPaginated(
    page: number = 1,
    pageSize: number = 12,
    state?: string
) {
    return await dbGetAgentsPaginated(page, pageSize, state)
}

export async function getPropertiesByAgentId(
    agentId: string,
    page: number = 1,
    limit: number = 12
) {
    return await dbGetPropertiesByAgentId(agentId, page, limit)
}
// Removed getPropertiesByAgent as it was a duplicate/typo
