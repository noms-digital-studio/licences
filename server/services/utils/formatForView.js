const moment = require('moment')
const setCase = require('case')

module.exports = { formatObjectForView, formatObjectForViewWithOptions }

function formatObjectForView(object) {
  return formatObjectForViewWithOptions(object, { capitalise: nameFields, dates: dateFields, custom: customFields })
}

function formatObjectForViewWithOptions(object, options) {
  return Object.keys(object).reduce((builtObject, itemKey) => {
    if (object[itemKey] instanceof Date || (object[itemKey] && options.dates && options.dates.includes(itemKey))) {
      return { ...builtObject, [itemKey]: moment(object[itemKey]).format('DD/MM/YYYY') }
    }

    if (object[itemKey] instanceof Object && !Array.isArray(object[itemKey])) {
      return { ...builtObject, [itemKey]: formatObjectForViewWithOptions(object[itemKey], options) }
    }

    if (options.capitalise && options.capitalise.includes(itemKey)) {
      return { ...builtObject, [itemKey]: setCase.capital(object[itemKey].toLowerCase()) }
    }

    if (options.custom && options.custom[itemKey]) {
      return { ...builtObject, [itemKey]: customFields[itemKey](object[itemKey]) }
    }

    return { ...builtObject, [itemKey]: object[itemKey] }
  }, {})
}

function formatAgencyLocationDesc(agencyLocationDesc) {
  if (agencyLocationDesc && agencyLocationDesc.toLowerCase().indexOf('(hmp)') !== -1) {
    return `HMP ${setCase.capital(agencyLocationDesc.toLowerCase().replace('(hmp)', '')).trim()}`
  }
  if (agencyLocationDesc && agencyLocationDesc.toLowerCase().indexOf('hmp') !== -1) {
    return `HMP ${setCase.capital(agencyLocationDesc.toLowerCase().replace('hmp', '')).trim()}`
  }
  return setCase.capital(agencyLocationDesc)
}

function formatAgencyBusinessPhone(phones) {
  if (phones && phones.length > 0) {
    return phones.find((phone) => phone.type === 'BUS') || ''
  }
  return ''
}

function formatOffences(offences) {
  return offences && offences[0] ? offences[0].offenceDescription : ''
}

function formatAliases(aliasesList) {
  return aliasesList && aliasesList[0]
    ? aliasesList
        .map((alias) => {
          const name = [alias.firstName, alias.lastName].join(' ')
          return setCase.capital(name.toLowerCase())
        })
        .join(', ')
    : ''
}

const customFields = {
  agencyLocationDesc: formatAgencyLocationDesc,
  premise: formatAgencyLocationDesc,
  phones: formatAgencyBusinessPhone,
  offences: formatOffences,
  aliases: formatAliases,
}

const nameFields = ['lastName', 'firstName', 'middleName', 'gender', 'assignedLivingUnitDesc']

const dateFields = [
  'captureDate',
  'dateOfBirth',
  'effectiveConditionalReleaseDate',
  'homeDetentionCurfewEligibilityDate',
  'homeDetentionCurfewActualDate',
  'licenceExpiryDate',
  'sentenceExpiryDate',
  'sentenceStartDate',
  'topupSupervisionExpiryDate',
  'effectiveAutomaticReleaseDate',
  'releaseDate',
]
