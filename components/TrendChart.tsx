"use client"

import { useMemo } from 'react'
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
    ComposedChart,
    Area
} from 'recharts'
import { Transaction } from '@/lib/supabase'

interface TrendChartProps {
    transactions: Transaction[]
    className?: string
}

export default function TrendChart({ transactions, className = '' }: TrendChartProps) {
    const data = useMemo(() => {
        if (!transactions || transactions.length === 0) return []

        // 1. Filter valid transactions with dates and prices
        const validTransactions = transactions.filter(
            t => t.transaction_date && t.price > 0
        )

        // 2. Sort by date
        validTransactions.sort((a, b) =>
            new Date(a.transaction_date!).getTime() - new Date(b.transaction_date!).getTime()
        )

        // 3. Group by Year (or Year-Month if needed, simpler to start with Year)
        // If range is < 2 years, maybe group by Quarter or Month?
        // Let's stick to Year-Month if we have enough data, or just Year if disparate.
        // For historical data usually Year is good.
        // Let's try Year logic first.

        const groupByYear = validTransactions.reduce((acc, t) => {
            const year = new Date(t.transaction_date!).getFullYear().toString()
            if (!acc[year]) {
                acc[year] = { year, count: 0, totalPrice: 0, totalPsf: 0, psfCount: 0 }
            }
            acc[year].count += 1
            acc[year].totalPrice += t.price

            // Calculate PSF if available
            const area = t.built_up_sqft || t.land_area_sqft
            if (area && area > 0) {
                const psf = t.price / area
                // Filter outliers (e.g. < RM 10 or > RM 5000)
                if (psf > 10 && psf < 10000) {
                    acc[year].totalPsf += psf
                    acc[year].psfCount += 1
                }
            }

            return acc
        }, {} as Record<string, { year: string, count: number, totalPrice: number, totalPsf: number, psfCount: number }>)

        // 4. Convert to array and calculate averages
        return Object.values(groupByYear)
            .map(group => ({
                year: group.year,
                avgPrice: Math.round(group.totalPrice / group.count),
                avgPsf: group.psfCount > 0 ? Math.round(group.totalPsf / group.psfCount) : 0,
                volume: group.count
            }))
            .sort((a, b) => parseInt(a.year) - parseInt(b.year))
    }, [transactions])

    if (data.length === 0) {
        return (
            <div className={`flex items-center justify-center h-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 ${className}`}>
                <div className="text-center text-gray-400">
                    <p>No transaction data available for analysis.</p>
                    <p className="text-sm mt-2">Try adjusting your filters.</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full overflow-y-auto bg-gray-50 ${className}`}>

            {/* Average Price Trend */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Average Price Trend</h3>
                <p className="text-sm text-gray-500 mb-6">Historical average transaction price by year</p>
                <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
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
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => [
                                    `RM ${value?.toLocaleString() ?? 0}`,
                                    'Avg Price'
                                ]}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="avgPrice"
                                name="Average Price"
                                stroke="#0ea5e9"
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Price Per Sqft Trend */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Average PSF Trend</h3>
                <p className="text-sm text-gray-500 mb-6">Price per square foot performance over time</p>
                <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
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
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => [
                                    `RM ${value?.toLocaleString() ?? 0}`,
                                    'Avg PSF'
                                ]}
                            />
                            <Legend />
                            <Bar
                                dataKey="avgPsf"
                                name="Average PSF"
                                fill="#8b5cf6"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Transaction Volume */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px] lg:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Transaction Volume</h3>
                <p className="text-sm text-gray-500 mb-6">Number of transactions recorded per year</p>
                <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data}>
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
                                yAxisId="left"
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                            />
                            {/* Secondary Axis for Price for context */}
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#94a3b8"
                                fontSize={12}
                                tickFormatter={(value) => `RM ${(value / 1000).toFixed(0)}k`}
                                tickLine={false}
                                axisLine={false}
                                hide
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="volume"
                                name="Volume"
                                fill="#f0f9ff"
                                stroke="#0ea5e9"
                                yAxisId="left"
                            />
                            <Bar
                                dataKey="volume"
                                name="Transactions"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                yAxisId="left"
                                barSize={40}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    )
}
