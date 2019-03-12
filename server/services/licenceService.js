const moment = require('moment')
const logger = require('../../log.js')
const { formatObjectForView } = require('./utils/formatForView')
const { licenceStages, transitions } = require('./config/licenceStages')
const recordList = require('./utils/recordList')
const formValidation = require('./utils/formValidation')

const {
  getIn,
  isEmpty,
  notAllValuesEmpty,
  allValuesEmpty,
  equals,
  firstKey,
  removePath,
  removePaths,
  addPaths,
  pickBy,
  replacePath,
  mergeWithRight,
  pick,
  getFieldName,
} = require('../utils/functionalHelpers')

module.exports = function createLicenceService(licenceClient) {
  async function reset() {
    try {
      await licenceClient.deleteAll()
    } catch (error) {
      logger.error('Error during reset licences', error.stack)
      throw error
    }
  }

  async function getLicence(bookingId) {
    try {
      const details = await Promise.all([
        licenceClient.getLicence(bookingId),
        licenceClient.getApprovedLicenceVersion(bookingId),
      ])

      const rawLicence = details[0]
      const rawVersionDetails = details[1]

      const licence = getIn(rawLicence, ['licence'])
      if (!licence) {
        return null
      }
      const formattedLicence = formatObjectForView(licence)
      const approvedVersionDetails = rawVersionDetails ? formatObjectForView(rawVersionDetails) : {}
      const stage = getIn(rawLicence, ['stage'])
      const version = `${rawLicence.version}.${rawLicence.vary_version}`
      const versionDetails = { version: rawLicence.version, vary_version: rawLicence.vary_version }
      const approvedVersion = `${approvedVersionDetails.version}.${approvedVersionDetails.vary_version}`

      return {
        licence: formattedLicence,
        stage,
        version,
        versionDetails,
        approvedVersion,
        approvedVersionDetails,
      }
    } catch (error) {
      logger.error('Error during getLicence', error.stack)
      throw error
    }
  }

  function createLicence({ bookingId, data = {}, stage = null } = {}) {
    const varyVersion = stage === 'VARY' ? 1 : 0
    return licenceClient.createLicence(bookingId, data, licenceStages[stage], 1, varyVersion)
  }

  async function updateLicenceConditions(bookingId, existingLicence, newConditionsObject, postRelease) {
    try {
      const existingLicenceConditions = getIn(existingLicence, ['licence', 'licenceConditions'])
      const licenceConditions = { ...existingLicenceConditions, ...newConditionsObject }

      if (equals(existingLicenceConditions, licenceConditions)) {
        return
      }

      await updateModificationStage(bookingId, existingLicence.stage, { requiresApproval: true })

      return licenceClient.updateSection('licenceConditions', bookingId, licenceConditions, postRelease)
    } catch (error) {
      logger.error('Error during updateAdditionalConditions', error.stack)
      throw error
    }
  }

  async function deleteLicenceCondition(bookingId, existingLicence, conditionId) {
    try {
      const existingLicenceConditions = getIn(existingLicence, ['licence', 'licenceConditions'])

      const newConditions = removeCondition(existingLicenceConditions, conditionId, bookingId)

      return licenceClient.updateSection('licenceConditions', bookingId, newConditions)
    } catch (error) {
      logger.error('Error during updateAdditionalConditions', error.stack)
      throw error
    }
  }

  function removeCondition(oldConditions, idToRemove) {
    if (idToRemove.startsWith('bespoke')) {
      return removeBespokeCondition(oldConditions, idToRemove)
    }

    return removeAdditionalCondition(oldConditions, idToRemove)
  }

  function removeAdditionalCondition(oldConditions, idToRemove) {
    const { [idToRemove]: conditionToRemove, ...theRest } = oldConditions.additional
    logger.debug(`Deleted condition: ${conditionToRemove}`)

    return { ...oldConditions, additional: theRest }
  }

  function removeBespokeCondition(oldConditions, idToRemove) {
    const indexToRemove = idToRemove.substr(idToRemove.indexOf('-') + 1)

    if (indexToRemove >= oldConditions.bespoke.length) {
      return oldConditions
    }

    const elementToRemove = oldConditions.bespoke[indexToRemove]

    const theRest = oldConditions.bespoke.filter(e => e !== elementToRemove)

    return { ...oldConditions, bespoke: theRest }
  }

  function markForHandover(bookingId, transitionType) {
    const newStage = getIn(transitions, [transitionType])

    if (!newStage) {
      throw new Error(`Invalid handover transition: ${transitionType}`)
    }

    return licenceClient.updateStage(bookingId, newStage)
  }

  function updateModificationStage(bookingId, stage, { requiresApproval, noModify }) {
    if (noModify) {
      return
    }

    if (requiresApproval && (stage === 'DECIDED' || stage === 'MODIFIED')) {
      return licenceClient.updateStage(bookingId, licenceStages.MODIFIED_APPROVAL)
    }

    if (stage === 'DECIDED') {
      return licenceClient.updateStage(bookingId, licenceStages.MODIFIED)
    }
  }

  const getFormResponse = (fieldMap, userInput) => fieldMap.reduce(answersFromMapReducer(userInput), {})

  async function update({ bookingId, originalLicence, config, userInput, licenceSection, formName, postRelease }) {
    const stage = getIn(originalLicence, ['stage'])
    const licence = getIn(originalLicence, ['licence'])

    if (!licence) {
      return null
    }

    const updatedLicence = getUpdatedLicence({
      licence,
      fieldMap: config.fields,
      userInput,
      licenceSection,
      formName,
    })

    if (equals(licence, updatedLicence)) {
      return licence
    }

    await licenceClient.updateLicence(bookingId, updatedLicence, postRelease)

    await updateModificationStage(bookingId, stage, {
      requiresApproval: config.modificationRequiresApproval,
      noModify: config.noModify,
    })

    return updatedLicence
  }

  function getUpdatedLicence({ licence, fieldMap, userInput, licenceSection, formName }) {
    const answers = getFormResponse(fieldMap, userInput)

    return { ...licence, [licenceSection]: { ...licence[licenceSection], [formName]: answers } }
  }

  function answersFromMapReducer(userInput) {
    return (answersAccumulator, field) => {
      const { fieldName, answerIsRequired, innerFields, inputIsList, inputIsSplitDate } = getFieldInfo(field, userInput)

      if (!answerIsRequired) {
        return answersAccumulator
      }

      if (inputIsList) {
        const arrayOfInputs = userInput[fieldName]
          .map(item => getFormResponse(field[fieldName].contains, item))
          .filter(notAllValuesEmpty)

        return { ...answersAccumulator, [fieldName]: arrayOfInputs }
      }

      if (!isEmpty(innerFields)) {
        const innerFieldMap = field[fieldName].contains
        const innerAnswers = getFormResponse(innerFieldMap, userInput[fieldName])

        if (allValuesEmpty(innerAnswers)) {
          return answersAccumulator
        }

        return { ...answersAccumulator, [fieldName]: innerAnswers }
      }

      if (inputIsSplitDate) {
        return { ...answersAccumulator, [fieldName]: getCombinedDate(field[fieldName], userInput) }
      }

      return { ...answersAccumulator, [fieldName]: userInput[fieldName] }
    }
  }

  function getCombinedDate(dateConfig, userInput) {
    const { day, month, year } = dateConfig.splitDate

    if ([day, month, year].every(item => userInput[item].length === 0)) return ''

    return `${userInput[day]}/${userInput[month]}/${userInput[year]}`
  }

  function addSplitDateFields(rawData, formFieldsConfig) {
    return formFieldsConfig.reduce((data, field) => {
      const fieldKey = firstKey(field)
      const fieldConfig = field[fieldKey]
      const splitDateConfig = getIn(fieldConfig, ['splitDate'])

      if (!rawData[fieldKey] || !splitDateConfig) {
        return data
      }

      const date = moment(rawData[fieldKey], 'DD/MM/YYYY')
      if (!date.isValid()) {
        return data
      }

      return {
        ...data,
        [splitDateConfig.day]: date.format('DD'),
        [splitDateConfig.month]: date.format('MM'),
        [splitDateConfig.year]: date.format('YYYY'),
      }
    }, rawData)
  }

  function getFieldInfo(field, userInput) {
    const fieldName = Object.keys(field)[0]
    const fieldConfig = field[fieldName]

    const fieldDependentOn = userInput[fieldConfig.dependentOn]
    const predicateResponse = fieldConfig.predicate
    const dependentMatchesPredicate = fieldConfig.dependentOn && fieldDependentOn === predicateResponse
    const inputIsSplitDate = fieldConfig.splitDate

    return {
      fieldName,
      answerIsRequired: !fieldDependentOn || dependentMatchesPredicate,
      innerFields: field[fieldName].contains,
      inputIsList: fieldConfig.isList,
      fieldConfig,
      inputIsSplitDate,
    }
  }

  async function removeDecision(bookingId, rawLicence) {
    const { licence } = rawLicence
    const updatedLicence = removePath(['approval'], licence)

    await licenceClient.updateLicence(bookingId, updatedLicence)
    return updatedLicence
  }

  function rejectBass(licence, bookingId, bassRequested, reason) {
    const lastBassReferral = getIn(licence, ['bassReferral'])

    if (!lastBassReferral) {
      return licence
    }

    const oldRecord = mergeWithRight(lastBassReferral, { rejectionReason: reason })
    const newRecord = { bassRequest: { bassRequested } }

    return deactivateBassEntry(licence, oldRecord, newRecord, bookingId)
  }

  function withdrawBass(licence, bookingId, withdrawal) {
    const lastBassReferral = getIn(licence, ['bassReferral'])

    if (!lastBassReferral) {
      return licence
    }

    const oldRecord = mergeWithRight(lastBassReferral, { withdrawal })
    const newRecord = { bassRequest: { bassRequested: 'Yes' } }

    return deactivateBassEntry(licence, oldRecord, newRecord, bookingId)
  }

  function deactivateBassEntry(licence, oldRecord, newRecord, bookingId) {
    const bassRejections = recordList({ licence, path: ['bassRejections'], allowEmpty: true })
    const licenceWithBassRejections = bassRejections.add({ record: oldRecord })

    const updatedLicence = replacePath(['bassReferral'], newRecord, licenceWithBassRejections)

    return licenceClient.updateLicence(bookingId, updatedLicence)
  }

  function reinstateBass(licence, bookingId) {
    const bassRejections = recordList({ licence, path: ['bassRejections'] })

    const entryToReinstate = removePath(['withdrawal'], bassRejections.last())

    const licenceAfterWithdrawalRemoved = bassRejections.remove()

    const updatedLicence = replacePath(['bassReferral'], entryToReinstate, licenceAfterWithdrawalRemoved)

    return licenceClient.updateLicence(bookingId, updatedLicence)
  }

  async function rejectProposedAddress(licence, bookingId, withdrawalReason) {
    const address = getIn(licence, ['proposedAddress', 'curfewAddress'])
    const curfew = getIn(licence, ['curfew'])
    const addressReview = curfew ? pick(['curfewAddressReview'], curfew) : null
    const riskManagementInputs = getIn(licence, ['risk', 'riskManagement'])
    const riskManagement = riskManagementInputs
      ? pick(['proposedAddressSuitable', 'unsuitableReason'], riskManagementInputs)
      : null

    const addressToStore = pickBy(val => val, { address, addressReview, riskManagement, withdrawalReason })

    const addressRejections = recordList({ licence, path: ['proposedAddress', 'rejections'], allowEmpty: true })
    const licenceWithAddressRejection = addressRejections.add({ record: addressToStore })

    const updatedLicence = removePaths(
      [
        ['proposedAddress', 'curfewAddress'],
        ['risk', 'riskManagement', 'proposedAddressSuitable'],
        ['risk', 'riskManagement', 'unsuitableReason'],
        ['curfew', 'curfewAddressReview'],
      ],
      licenceWithAddressRejection
    )

    await licenceClient.updateLicence(bookingId, updatedLicence)
    return updatedLicence
  }

  async function reinstateProposedAddress(licence, bookingId) {
    const addressRejections = recordList({ licence, path: ['proposedAddress', 'rejections'] })
    const licenceAfterRemoval = addressRejections.remove()

    const entryToReinstate = addressRejections.last()
    const curfewAddressReview = getIn(entryToReinstate, ['addressReview', 'curfewAddressReview'])
    const address = getIn(entryToReinstate, ['address'])
    const riskManagement = getIn(entryToReinstate, ['riskManagement'])

    const updatedLicence = addPaths(
      [
        [['proposedAddress', 'curfewAddress'], address],
        [['risk', 'riskManagement', 'proposedAddressSuitable'], getIn(riskManagement, ['proposedAddressSuitable'])],
        [['risk', 'riskManagement', 'unsuitableReason'], getIn(riskManagement, ['unsuitableReason'])],
        [['curfew', 'curfewAddressReview'], curfewAddressReview],
      ].filter(argument => argument[1]),
      licenceAfterRemoval
    )

    await licenceClient.updateLicence(bookingId, updatedLicence)
    return updatedLicence
  }

  function validateFormGroup({ licence, stage, decisions = {}, tasks = {} } = {}) {
    const { addressUnsuitable, bassAreaNotSuitable, bassReferralNeeded, addressReviewFailed } = decisions
    const newAddressAddedForReview = stage !== 'PROCESSING_RO' && tasks.curfewAddressReview === 'UNSTARTED'
    const newBassAreaAddedForReview = stage !== 'PROCESSING_RO' && tasks.bassAreaCheck === 'UNSTARTED'

    const groupName = () => {
      if (stage === 'PROCESSING_RO') {
        if (addressReviewFailed) {
          return 'PROCESSING_RO_ADDRESS_REVIEW_REJECTED'
        }
        if (addressUnsuitable) {
          return 'PROCESSING_RO_RISK_REJECTED'
        }
        if (bassAreaNotSuitable) {
          return 'BASS_AREA'
        }
        if (bassReferralNeeded) {
          return 'PROCESSING_RO_BASS_REQUESTED'
        }
      }

      if (bassReferralNeeded && (stage === 'ELIGIBILITY' || newBassAreaAddedForReview)) {
        return 'BASS_REQUEST'
      }

      if (newAddressAddedForReview) {
        return 'ELIGIBILITY'
      }

      return stage
    }

    return formValidation.validateGroup({
      licence,
      group: groupName(),
      bespokeConditions: {
        offenderIsMainOccupier: decisions.offenderIsMainOccupier,
      },
    })
  }

  async function createLicenceFromFlatInput(input, bookingId, existingLicence, pageConfig, postRelease) {
    const inputWithCurfewHours = addCurfewHoursInput(input)

    const newLicence = pageConfig.fields.reduce((licence, field) => {
      const fieldName = getFieldName(field)
      const inputPosition = field[fieldName].licencePosition

      if (!inputWithCurfewHours[fieldName]) {
        return licence
      }
      return replacePath(inputPosition, inputWithCurfewHours[fieldName], licence)
    }, existingLicence)

    await licenceClient.updateLicence(bookingId, newLicence, postRelease)
    return newLicence
  }

  function addCurfewHoursInput(input) {
    if (input.daySpecificInputs === 'Yes') {
      return input
    }

    return Object.keys(input).reduce((builtInput, fieldItem) => {
      if (fieldItem.includes('From')) {
        return { ...builtInput, [fieldItem]: builtInput.allFrom }
      }

      if (fieldItem.includes('Until')) {
        return { ...builtInput, [fieldItem]: builtInput.allUntil }
      }

      return builtInput
    }, input)
  }

  return {
    reset,
    getLicence,
    createLicence,
    updateLicenceConditions,
    deleteLicenceCondition,
    markForHandover,
    update,
    updateSection: licenceClient.updateSection,
    rejectProposedAddress,
    reinstateProposedAddress,
    validateForm: formValidation.validate,
    validateFormGroup,
    saveApprovedLicenceVersion: licenceClient.saveApprovedLicenceVersion,
    addSplitDateFields,
    removeDecision,
    rejectBass,
    withdrawBass,
    reinstateBass,
    addCurfewHoursInput,
    createLicenceFromFlatInput,
  }
}
