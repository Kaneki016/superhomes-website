"use client"

import { useMemo, useState } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    Area,
    AreaChart
} from 'recharts'
import { Transaction } from '@/lib/types'
import { TrendingUp, TrendingDown, Minus, Sparkles, Loader2 } from 'lucide-react'
import { generateTrendInsight } from '@/app/actions/ai-trend-insight'

export type ChartType = 'price' | 'psf' | 'volume'

interface TrendChartProps {
    transactions: Transaction[]
    className?: string
    minimal?: boolean
    chartType?: ChartType  // if set, renders only this chart at full width
}

// Custom Tooltip Component for better aesthetics
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 min-w-[200px]">
                <p className="text-gray-500 text-sm font-medium mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-1 text-sm">
                        <span className="flex items-center gap-2">
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color || entry.fill }}
                            />
                            <span className="text-gray-600 capitalize">
                                {entry.name}
                            </span>
                        </span>
                        <span className="font-semibold text-gray-900">
                            {formatter ? formatter(entry.value, entry.name)[0] : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

// Header Component for each chart to show summary stats
const StatHeader = ({ title, subTitle, currentValue, prevValue, type = 'price', minimal = false }: any) => {
    let change = 0
    let isUp = false
    let isNeutral = true

    if (currentValue && prevValue) {
        change = ((currentValue - prevValue) / prevValue) * 100
        isUp = change > 0
        isNeutral = change === 0
    }

    const formattedValue = type === 'price'
        ? `RM ${(currentValue / 1000).toLocaleString()}k`
        : type === 'psf' ? `RM ${Math.round(currentValue)}`
            : `${currentValue}`

    return (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                {!minimal && <p className="text-sm text-gray-500">{subTitle}</p>}
            </div>
            {!minimal && currentValue > 0 && (
                <div className="flex items-end gap-3 mt-2 sm:mt-0">
                    <span className="text-2xl font-bold text-gray-900 tracking-tight">
                        {formattedValue}
                    </span>
                    {!isNeutral && prevValue > 0 ? (
                        <span className={`flex items-center text-sm font-medium mb-1 ${isUp ? 'text-emerald-600' : 'text-rose-600'} bg-opacity-10 px-2 py-0.5 rounded-full ${isUp ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                            {isUp ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                            {Math.abs(change).toFixed(1)}%
                        </span>
                    ) : (
                        <span className="flex items-center text-sm font-medium text-gray-400 mb-1 px-2 py-0.5">
                            <Minus size={14} className="mr-1" /> Stable
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}

// Custom Legend for 2-row layout
const CustomLegend = (props: any) => {
    const { payload } = props;

    return (
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 justify-center">
            {payload.map((entry: any, index: number) => (
                <div key={`item-${index}`} className="flex items-center gap-2 text-xs text-gray-600">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

export default function TrendChart({ transactions, className = '', minimal = false, chartType }: TrendChartProps) {
    // Single-chart mode: renders only one chart, full-width, no grid
    const singleChart = !!chartType
    const [aiInsight, setAiInsight] = useState<string | null>(null)
    const [isLoadingAi, setIsLoadingAi] = useState(false)
    const [aiError, setAiError] = useState<string | null>(null)

    const data = useMemo(() => {
        if (!transactions || transactions.length === 0) return []

        const validTransactions = transactions.filter(
            t => t.transaction_date && t.price > 0
        )

        validTransactions.sort((a, b) =>
            new Date(a.transaction_date!).getTime() - new Date(b.transaction_date!).getTime()
        )

        const groupByYear = validTransactions.reduce((acc, t) => {
            const year = new Date(t.transaction_date!).getFullYear().toString()
            if (!acc[year]) {
                acc[year] = {
                    year,
                    prices: [],
                    psfs: [],
                    types: {} as Record<string, number>
                }
            }

            acc[year].prices.push(t.price)

            const area = t.built_up_sqft || t.land_area_sqft
            if (area && area > 0) {
                const psf = t.price / area
                if (psf > 10 && psf < 10000) {
                    acc[year].psfs.push(psf)
                }
            }

            const type = t.property_type || 'Unknown'
            acc[year].types[type] = (acc[year].types[type] || 0) + 1

            return acc
        }, {} as Record<string, { year: string, prices: number[], psfs: number[], types: Record<string, number> }>)

        const formatTypeKey = (key: string) => key.replace(/\s+/g, '_')

        return Object.values(groupByYear)
            .map(group => {
                const sortedPrices = group.prices.sort((a, b) => a - b)
                const totalPrices = sortedPrices.reduce((sum, p) => sum + p, 0)
                const avgPrice = Math.round(totalPrices / sortedPrices.length)
                const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)]

                const sortedPsfs = group.psfs.sort((a, b) => a - b)
                const totalPsfs = sortedPsfs.reduce((sum, p) => sum + p, 0)
                const avgPsf = sortedPsfs.length > 0 ? Math.round(totalPsfs / sortedPsfs.length) : 0
                const medianPsf = sortedPsfs.length > 0 ? Math.round(sortedPsfs[Math.floor(sortedPsfs.length / 2)]) : 0

                const typeCounts: Record<string, number> = {}
                Object.entries(group.types).forEach(([type, count]) => {
                    typeCounts[formatTypeKey(type)] = count
                })

                return {
                    year: group.year,
                    avgPrice,
                    medianPrice,
                    avgPsf,
                    medianPsf,
                    volume: group.prices.length,
                    ...typeCounts
                }
            })
            .sort((a, b) => parseInt(a.year) - parseInt(b.year))
    }, [transactions])

    const propertyTypes = useMemo(() => {
        const types = new Set<string>()
        transactions.forEach(t => {
            if (t.property_type) types.add(t.property_type.replace(/\s+/g, '_'))
            else types.add('Unknown')
        })
        return Array.from(types).sort()
    }, [transactions])

    // Distinct Colors for differentiability
    const colors = [
        '#2563eb', // Strong Blue
        '#16a34a', // Green
        '#ea580c', // Orange
        '#db2777', // Pink
        '#7c3aed', // Purple
        '#0d9488', // Teal
        '#ca8a04', // Dark Yellow/Gold
        '#dc2626', // Red
        '#4b5563'  // Grey
    ]

    const handleGenerateInsight = async () => {
        setIsLoadingAi(true)
        setAiError(null)
        setAiInsight(null)

        // Summarize data for AI
        const summary = data.map(d =>
            `Year ${d.year}: Median Price RM${d.medianPrice}, Volume ${d.volume}`
        ).join('\n')

        const result = await generateTrendInsight(summary)

        if (result.success && result.data) {
            setAiInsight(result.data)
        } else {
            setAiError(result.message || 'Failed to generate insights')
        }
        setIsLoadingAi(false)
    }

    // Helper to get latest stats for headers
    const latestData = data.length > 0 ? data[data.length - 1] : null
    const prevData = data.length > 1 ? data[data.length - 2] : null

    if (data.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-12 ${className}`}>
                <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <Minus className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No trend data available</h3>
                <p className="text-gray-500 mt-2 text-center max-w-[250px]">Try selecting a different area or adjusting your filters to see historical trends.</p>
            </div>
        )
    }

    return (
        <div className={`${singleChart
            ? 'p-4 lg:p-6'
            : `grid grid-cols-1 lg:grid-cols-2 gap-4 ${minimal ? 'p-3' : 'p-6 bg-gray-50/50 gap-6'}`
            } h-auto ${className}`}>

            {/* AI Insight Card */}
            {!minimal && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-indigo-100 lg:col-span-2">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-white p-2 rounded-lg shadow-sm text-indigo-600">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">AI Market Analyst</h3>
                                <p className="text-sm text-gray-600">Smart insights based on this data</p>
                            </div>
                        </div>
                        <button
                            onClick={handleGenerateInsight}
                            disabled={isLoadingAi || !!aiInsight}
                            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${aiInsight
                                ? 'bg-gray-100 text-gray-400 cursor-default'
                                : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 shadow-sm'
                                }`}
                        >
                            {isLoadingAi ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 size={14} className="animate-spin" /> Analyzing...
                                </span>
                            ) : aiInsight ? (
                                'Analysis Complete'
                            ) : (
                                'Generate Insights'
                            )}
                        </button>
                    </div>

                    {aiInsight ? (
                        <div className="bg-white/60 p-4 rounded-xl border border-indigo-100/50">
                            <ul className="space-y-2 text-gray-700 text-sm leading-relaxed">
                                {aiInsight.split('•').filter(i => i.trim()).map((point, i) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="text-indigo-500 mt-1">•</span>
                                        <span>{point.trim()}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : aiError ? (
                        <p className="text-rose-500 text-sm bg-rose-50 p-3 rounded-lg border border-rose-100">
                            {aiError}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-400 italic">
                            Click &quot;Generate Insights&quot; to get a summary of price trends and market volume.
                        </p>
                    )}
                </div>
            )}

            {/* Price Trend — shown when no chartType filter or type === 'price' */}
            {(!singleChart || chartType === 'price') && (
                <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col ${singleChart ? 'h-[480px] p-4' : minimal ? 'h-[260px] p-3' : 'h-[420px] p-6'
                    } hover:shadow-md transition-shadow duration-200`}>
                    <StatHeader
                        title="Price Analysis"
                        subTitle="Avg vs Median Transaction Price"
                        currentValue={latestData?.medianPrice} // Use Median as the headline
                        prevValue={prevData?.medianPrice}
                        type="price"
                        minimal={minimal}
                    />
                    <div className="flex-grow">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="year"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickFormatter={(value) => `RM ${(value / 1000).toFixed(0)}k`}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" />
                                <Area
                                    type="monotone"
                                    dataKey="avgPrice"
                                    name="Average"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fill="url(#colorPrice)"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="medianPrice"
                                    name="Median"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* PSF Trend — shown when no chartType filter or type === 'psf' */}
            {(!singleChart || chartType === 'psf') && (
                <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col ${singleChart ? 'h-[480px] p-4' : minimal ? 'h-[260px] p-3' : 'h-[420px] p-6'
                    } hover:shadow-md transition-shadow duration-200`}>
                    <StatHeader
                        title="PSF Analysis"
                        subTitle="Price Per Sqft Performance"
                        currentValue={latestData?.medianPsf}
                        prevValue={prevData?.medianPsf}
                        type="psf"
                        minimal={minimal}
                    />
                    <div className="flex-grow">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorPsf" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="year"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickFormatter={(value) => `RM ${value}`}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" />
                                <Area
                                    type="monotone"
                                    dataKey="avgPsf"
                                    name="Average PSF"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fill="url(#colorPsf)"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="medianPsf"
                                    name="Median PSF"
                                    stroke="#14b8a6"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Volume — shown when no chartType filter or type === 'volume' */}
            {(!singleChart || chartType === 'volume') && (
                <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col ${singleChart ? 'h-[480px] p-4' : minimal ? 'h-[280px] p-3' : 'h-[500px] p-6'
                    } ${singleChart ? '' : 'lg:col-span-2'} hover:shadow-md transition-shadow duration-200`}>
                    <StatHeader
                        title="Market Activity"
                        subTitle="Transaction Volume by Property Type"
                        currentValue={latestData?.volume}
                        prevValue={prevData?.volume}
                        type="volume"
                        minimal={minimal}
                    />
                    <div className="flex-grow">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="year"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                    allowDecimals={false}
                                    tickFormatter={(v) => Number.isInteger(v) ? String(v) : ''}
                                />
                                <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                                <Legend content={<CustomLegend />} />
                                {propertyTypes.map((type, index) => (
                                    <Bar
                                        key={type}
                                        dataKey={type}
                                        stackId="a"
                                        name={type.replace(/_/g, ' ')}
                                        fill={colors[index % colors.length]}
                                        radius={index === propertyTypes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

        </div>
    )
}
