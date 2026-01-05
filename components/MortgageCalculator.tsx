'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatPrice } from '@/lib/utils'

interface MortgageCalculatorProps {
    propertyPrice: number
    isRent?: boolean // Don't show for rental properties
}

export default function MortgageCalculator({ propertyPrice, isRent = false }: MortgageCalculatorProps) {
    const [downPaymentPercent, setDownPaymentPercent] = useState(10)
    const [interestRate, setInterestRate] = useState(4.5)
    const [loanTermYears, setLoanTermYears] = useState(30)
    const [isExpanded, setIsExpanded] = useState(false)

    // Don't render for rental properties
    if (isRent || !propertyPrice) return null

    // Calculate mortgage details
    const calculations = useMemo(() => {
        const downPayment = (propertyPrice * downPaymentPercent) / 100
        const loanAmount = propertyPrice - downPayment
        const monthlyInterestRate = interestRate / 100 / 12
        const numberOfPayments = loanTermYears * 12

        // Monthly payment formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
        let monthlyPayment = 0
        if (monthlyInterestRate > 0) {
            const factor = Math.pow(1 + monthlyInterestRate, numberOfPayments)
            monthlyPayment = loanAmount * (monthlyInterestRate * factor) / (factor - 1)
        } else {
            monthlyPayment = loanAmount / numberOfPayments
        }

        const totalPayment = monthlyPayment * numberOfPayments
        const totalInterest = totalPayment - loanAmount

        return {
            downPayment,
            loanAmount,
            monthlyPayment,
            totalPayment,
            totalInterest
        }
    }, [propertyPrice, downPaymentPercent, interestRate, loanTermYears])

    const loanTermOptions = [15, 20, 25, 30, 35]

    return (
        <div className="glass p-6 rounded-2xl">
            {/* Header - Clickable to expand/collapse */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-left"
            >
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-heading font-semibold text-gray-900">Mortgage Calculator</h3>
                        <p className="text-sm text-gray-500">Est. monthly payment</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-primary-600">
                        RM {calculations.monthlyPayment.toLocaleString('en-MY', { maximumFractionDigits: 0 })}
                    </span>
                    <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-5">
                    {/* Property Price (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Property Price</label>
                        <div className="px-4 py-3 bg-gray-100 rounded-lg text-gray-900 font-semibold">
                            {formatPrice(propertyPrice)}
                        </div>
                    </div>

                    {/* Down Payment */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700">Down Payment</label>
                            <span className="text-sm font-semibold text-primary-600">
                                {downPaymentPercent}% (RM {calculations.downPayment.toLocaleString('en-MY', { maximumFractionDigits: 0 })})
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="50"
                            step="5"
                            value={downPaymentPercent}
                            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0%</span>
                            <span>50%</span>
                        </div>
                    </div>

                    {/* Interest Rate */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700">Interest Rate (p.a.)</label>
                            <span className="text-sm font-semibold text-primary-600">{interestRate}%</span>
                        </div>
                        <input
                            type="range"
                            min="2"
                            max="10"
                            step="0.1"
                            value={interestRate}
                            onChange={(e) => setInterestRate(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>2%</span>
                            <span>10%</span>
                        </div>
                    </div>

                    {/* Loan Term */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Loan Term</label>
                        <div className="flex gap-2">
                            {loanTermOptions.map((years) => (
                                <button
                                    key={years}
                                    onClick={() => setLoanTermYears(years)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${loanTermYears === years
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {years} yrs
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Loan Amount</span>
                            <span className="font-semibold text-gray-900">
                                RM {calculations.loanAmount.toLocaleString('en-MY', { maximumFractionDigits: 0 })}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Interest</span>
                            <span className="font-semibold text-gray-900">
                                RM {calculations.totalInterest.toLocaleString('en-MY', { maximumFractionDigits: 0 })}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-gray-200 pt-3">
                            <span className="text-gray-600">Total Payment</span>
                            <span className="font-semibold text-gray-900">
                                RM {calculations.totalPayment.toLocaleString('en-MY', { maximumFractionDigits: 0 })}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="font-semibold text-gray-900">Monthly Payment</span>
                            <span className="text-2xl font-bold text-primary-600">
                                RM {calculations.monthlyPayment.toLocaleString('en-MY', { maximumFractionDigits: 0 })}
                            </span>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <p className="text-xs text-gray-500 text-center">
                        * This is an estimate only. Actual payments may vary based on your financial institution.
                    </p>
                </div>
            )}
        </div>
    )
}
