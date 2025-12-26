const r = require('./precision_report.json')

console.log('LOW PRECISION ADDRESSES (59 properties)')
console.log('=========================================')
console.log('These addresses are too vague for exact geocoding:\n')

r.lowPrecision.forEach((p, i) => {
    console.log((i + 1) + '. ' + (p.name || 'N/A').substring(0, 50))
    console.log('   Address: ' + (p.address || 'N/A'))
    console.log('   State: ' + (p.state || 'N/A'))
    console.log('')
})
