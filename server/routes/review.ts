import { getReviewSections } from './viewModels/reviewModels'
import { asyncMiddleware } from '../utils/middleware'
import { getIn } from '../utils/functionalHelpers'
import logger from '../../log'
import { isPostApproval } from '../services/config/licenceStage'

import { PrisonerService } from '../../types/licences'
import { LicenceService } from '../services/licenceService'

function shouldValidate(role, stage, postApproval) {
  return postApproval
    ? role === 'CA'
    : {
        READONLY: [],
        RO_READONLY: [],
        CA: ['ELIGIBILITY', 'PROCESSING_CA', 'FINAL_CHECKS'],
        RO: ['PROCESSING_RO'],
        DM: ['APPROVAL'],
      }[role].includes(stage)
}

export = ({
  licenceService,
  conditionsService,
  prisonerService,
}: {
  licenceService: LicenceService
  conditionsService: any
  prisonerService: PrisonerService
}) => {
  function validate(licenceStatus, showErrors, licence, stage) {
    const { decisions, tasks } = licenceStatus
    return showErrors ? licenceService.validateFormGroup({ licence, stage, decisions, tasks }) : {}
  }

  return (router) => {
    router.get(
      '/:sectionName/:bookingId',
      asyncMiddleware(async (req, res) => {
        const { sectionName, bookingId } = req.params
        const { licenceStatus } = res.locals
        logger.debug(`GET /review/${sectionName}/${bookingId}`)

        const licence = getIn(res.locals.licence, ['licence']) || {}
        const stage = getIn(res.locals.licence, ['stage']) || {}
        const licenceVersion = getIn(res.locals.licence, ['version']) || {}

        const postApproval = isPostApproval(stage)
        const showErrors = shouldValidate(req.user.role, stage, postApproval)
        const errorObject = validate(licenceStatus, showErrors, licence, stage)

        const data = conditionsService.populateLicenceWithConditions(licence, errorObject)

        const prisonerInfo = await prisonerService.getPrisonerDetails(bookingId, res.locals.token)

        const sections = getReviewSections(licenceStatus)

        res.render(`review/${sectionName}`, {
          bookingId,
          data,
          sections,
          prisonerInfo,
          stage,
          licenceVersion,
          errorObject,
          showErrors,
          postApproval,
        })
      })
    )

    return router
  }
}
