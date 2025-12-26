const fs = require('fs')
const r = require('./precision_report.json')

let output = 'LOW PRECISION ADDRESSES - 59 PROPERTIES\n'
output += '==========================================\n'
output += 'These addresses are too vague for exact geocoding:\n\n'

r.lowPrecision.forEach((p, i) => {
    output += (i + 1) + '. ' + (p.name || 'N/A') + '\n'
    output += '   Address: ' + (p.address || 'N/A') + '\n'
    output += '   State: ' + (p.state || 'N/A') + '\n'
    output += '   ID: ' + p.id + '\n\n'
})

fs.writeFileSync('low_precision_list.txt', output, 'utf8')
console.log('Saved to: low_precision_list.txt')
console.log('Total properties:', r.lowPrecision.length)
