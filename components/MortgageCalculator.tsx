'use client'

import { useState, useEffect } from 'react'

interface MortgageCalculatorProps {
    initialPrice?: number
    className?: string
}

export default function MortgageCalculator({ initialPrice = 500000, className = '' }: MortgageCalculatorProps) {
    const [price, setPrice] = useState(initialPrice)
    const [downpaymentPercent, setDownpaymentPercent] = useState(10)
    const [interestRate, setInterestRate] = useState(4.2)
    const [years, setYears] = useState(35)

    const [monthlyPayment, setMonthlyPayment] = useState(0)
    const [totalInterest, setTotalInterest] = useState(0)

    useEffect(() => {
        setPrice(initialPrice)
    }, [initialPrice])

    useEffect(() => {
        calculateMortgage()
    }, [price, downpaymentPercent, interestRate, years])

    const calculateMortgage = () => {
        const principal = price * (1 - downpaymentPercent / 100)
        const monthlyRate = interestRate / 100 / 12
        const numberOfPayments = years * 12

        if (monthlyRate === 0) {
            setMonthlyPayment(principal / numberOfPayments)
            setTotalInterest(0)
            return
        }

        // Formula: M = P[r(1+r)^n]/[(1+r)^n-1]
        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1)

        setMonthlyPayment(payment)
        setTotalInterest((payment * numberOfPayments) - principal)
    }

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${className}`}>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <span className="text-xl mr-2">🧮</span> Mortgage Calculator
            </h3>
            <div className="space-y-4">
                {/* Property Price */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Property Price (RM)</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full form-input rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                </div>

                {/* Downpayment & Percent */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Downpayment (%)</label>
                        <input
                            type="number"
                            value={downpaymentPercent}
                            onChange={(e) => setDownpaymentPercent(Number(e.target.value))}
                            className="w-full form-input rounded-lg border-gray-300 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Amount (RM)</label>
                        <div className="w-full px-3 py-2 bg-gray-50 text-gray-700 text-sm border rounded-lg">
                            {(price * downpaymentPercent / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                </div>

                {/* Interest & Years */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Interest Rate (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={interestRate}
                            onChange={(e) => setInterestRate(Number(e.target.value))}
                            className="w-full form-input rounded-lg border-gray-300 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Loan Period (Years)</label>
                        <input
                            type="number"
                            max="35"
                            value={years}
                            onChange={(e) => setYears(Number(e.target.value))}
                            className="w-full form-input rounded-lg border-gray-300 text-sm"
                        />
                    </div>
                </div>

                {/* Result */}
                <div className="mt-6 pt-4 border-t border-dashed">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Estimated Monthly Repayment</p>
                        <p className="text-2xl font-bold text-primary-600 mt-1">
                            RM {monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                            Total Interest: RM {totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
