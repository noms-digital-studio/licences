const moment = require('moment')
const path = require('path')
const logger = require('../../log.js')
const { asyncMiddleware } = require('../utils/middleware')
const {
  port,
  gotenberg: { hdcUrl },
  pdf: {
    forms: { formTemplates, formsDateFormat, pdfOptions },
  },
  wordFormatForms,
} = require('../config')
const { curfewAddressCheckFormFileName } = require('./utils/pdfUtils')
const { isEmpty, getIn } = require('../utils/functionalHelpers')

module.exports = ({ formService }) => (router) => {
  router.get(
    '/curfewAddress/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      const {
        prisoner,
        licence: { licence },
        licenceStatus,
      } = res.locals

      const isBass = getIn(licenceStatus, ['decisions', 'bassReferralNeeded']) === true
      const isAp = getIn(licenceStatus, ['decisions', 'approvedPremisesRequired']) === true

      const pageData = await formService.getCurfewAddressCheckData({
        agencyLocationId: prisoner.agencyLocationId,
        licence,
        isBass,
        isAp,
        bookingId,
        token: res.locals.token,
      })

      const completionDate = moment().format(formsDateFormat)
      const filename = curfewAddressCheckFormFileName(prisoner)
      const approvedPremisesAddress =
        getIn(licence, ['curfew', 'approvedPremisesAddress']) ||
        getIn(licence, ['bassReferral', 'approvedPremisesAddress']) ||
        {}
      return res.renderPDF(
        'forms/curfewAddress',
        { ...pageData, approvedPremisesAddress, hdcUrl, port, completionDate },
        { filename, pdfOptions }
      )
    })
  )

  router.get(
    '/:templateName/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { templateName, bookingId } = req.params
      const {
        licence: { licence },
        licenceStatus,
        prisoner,
      } = res.locals

      if (isEmpty(formTemplates[templateName])) {
        throw new Error(`unknown form template: ${templateName}`)
      }

      if (wordFormatForms.includes(templateName)) {
        logger.info(`Returning word document for the '${templateName}' form`)
        return res.download(path.join(__dirname, `../views/forms/downloads/${templateName}.docx`))
      }

      logger.info(`Render PDF for form '${templateName}'`)

      const isBass = getIn(licenceStatus, ['decisions', 'bassReferralNeeded']) === true
      const isAp = getIn(licenceStatus, ['decisions', 'approvedPremisesRequired']) === true
      try {
        const [pageData, curfewData] = await Promise.all([
          formService.getTemplateData(templateName, licence, prisoner),
          formService.getCurfewAddressCheckData({
            agencyLocationId: prisoner.agencyLocationId,
            licence,
            isBass,
            isAp,
            bookingId,
            token: res.locals.token,
          }),
        ])

        const filename = `${prisoner.offenderNo}.pdf`
        const pdf = res.renderPDF(
          `forms/${templateName}`,
          { ...pageData, ...curfewData, hdcUrl },
          { filename, pdfOptions }
        )

        logger.info(`Returning rendered PDF for form '${templateName}'`)
        return pdf
      } catch (e) {
        logger.warn(`Caught an exception while rendering form ${templateName}: ${e}`)
        throw e
      }
    })
  )

  router.get(
    '/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      return res.render('forms/all', { bookingId, forms: Object.entries(formTemplates) })
    })
  )

  return router
}
