export const calculateMonthlyRepayment = (
    price: number,
    interestRate: number = 4.0, // 4% default
    years: number = 35, // 35 years default
    loanMargin: number = 0.9 // 90% loan margin
): number => {
    const principal = price * loanMargin
    const monthlyRate = interestRate / 100 / 12
    const numberOfPayments = years * 12

    // Mortgage formula: M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1 ]
    const mortgage =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1)

    return Math.round(mortgage)
}
