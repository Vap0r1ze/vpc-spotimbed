const pluralRules = new Intl.PluralRules('en', { type: 'ordinal' })
const orindalSuffixes = {
  one: 'st',
  two: 'nd',
  few: 'rd',
  other: 'th',
}
const monthNames = 'January February March April May June July August September October November December'.split(' ')

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
