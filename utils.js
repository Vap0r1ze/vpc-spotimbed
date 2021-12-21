const pluralRules = new Intl.PluralRules('en', { type: 'ordinal' })
const orindalSuffixes = {
  one: 'st',
  two: 'nd',
  few: 'rd',
  other: 'th',
}
const monthNames = 'January February March April May June July August September October November December'.split(' ')
const amountSuffixes = ['', 'K', 'M', 'B', 'T', 'Q']

exports.formatOrdinal = n => {
  const rule = pluralRules.select(n)
  const suffix = orindalSuffixes[rule]
  return `${n}${suffix}`
}

exports.getMonth = n => monthNames[n]

exports.formatDuration = ms => `${
  Math.floor(ms/60000)
}:${
  Math.floor(ms/1000 % 60).toString().padStart(2, '0')
}`

exports.toClassName = (statics, conditionals) => statics.concat(...Object.keys(conditionals).filter(k => conditionals[k])).join(' ')

// I wrote these before I realized play count isn't returned from the API

// exports.shortAmount = n => {
//   const degree = Math.floor(Math.log10(n) / 3)
//   const suffix = amountSuffixes[degree]
//   let digitStr = (n / 10**(3*degree)).toFixed(1).replace('.0', '')
//   if (digitStr.length > 3) digitStr = digitStr.split('.')[0]
//   return digitStr + suffix
// }

// exports.delimitedAmount = (n, delimiter = ',') => {
//   const sign = Math.sign(n) === -1 ? '-' : ''
//   const whole = Math.trunc(Math.abs(n)).toString()
//   const decimal = n.toString().includes('.') ? `.${n.toString().split('.')[1]}` : ''
//   const delimitedWhole = whole.toString().split('').reverse().map((char, i) => char + (i && !(i % 3) ? delimiter : '')).reverse().join('')
//   return `${sign}${delimitedWhole}${decimal}`
// }
