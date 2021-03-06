import { Event } from './types'

const YES = 'Yes'

const ELIGIBILITY_PATTERN = '/hdc/eligibility/([a-zA-Z]+)/'

export enum AddressChoice {
  Bass = 'Bass',
  Address = 'Address',
  OptOut = 'OptOut',
}

const hasPath = (details, pathToMatch: string): boolean => details?.path && details.path.startsWith(pathToMatch)

const hasPathAndDecision = (details, expectedPath: string) => {
  const path = details?.path
  const decision = details?.userInput?.decision
  if (!(path && decision)) return false
  return path.startsWith(expectedPath)
}

const getDecision = (details) => details?.userInput?.decision

const isIneligible = (eligibility) =>
  eligibility?.excluded === YES || eligibility?.suitability === YES || eligibility?.crdTime === YES

export default class Booking {
  private eligibility: {
    excluded?: string
    suitability?: string
    crdTime?: string
  }

  private addressChoice?: AddressChoice

  private approvedPremises?: boolean

  private event: Event

  /**
   * Only care about a booking being made ineligible. The opposite transition
   * enables other events like sending from CA to RO.
   */
  private updateEligibilityState(details) {
    if (!hasPathAndDecision(details, '/hdc/eligibility/')) return
    const { path } = details
    const result = new RegExp(ELIGIBILITY_PATTERN).exec(path)

    if (!result || result.length < 2) return
    const formName = result[1]

    const newEligibility = {
      ...this.eligibility,
      [formName]: getDecision(details),
    }

    if (!isIneligible(this.eligibility) && isIneligible(newEligibility)) this.event = Event.ineligible

    this.eligibility = newEligibility
  }

  private updateAddressChoice(details) {
    if (hasPathAndDecision(details, '/hdc/proposedAddress/curfewAddressChoice/')) {
      const decision = getDecision(details)
      if (this.addressChoice !== AddressChoice.OptOut && decision === AddressChoice.OptOut) {
        this.event = Event.optOut
        this.addressChoice = AddressChoice.OptOut
      }
    } else if (hasPath(details, '/hdc/proposedAddress/curfewAddress/')) {
      this.addressChoice = AddressChoice.Address
    } else if (hasPath(details, '/hdc/bassReferral/bassRequest/')) {
      this.addressChoice = AddressChoice.Bass
    } else if (hasPath(details, '/hdc/bassReferral/bassAreaCheck')) {
      if (details?.userInput?.bassAreaCheckSeen === 'true') {
        switch (details?.userInput?.approvedPremisesRequiredYesNo) {
          case 'Yes':
            this.approvedPremises = true
            break
          case 'No':
            this.approvedPremises = false
            break
          default:
            break
        }
      }
    } else if (hasPath(details, '/hdc/curfew/approvedPremises')) {
      switch (details?.userInput?.required) {
        case 'Yes':
          this.approvedPremises = true
          break
        case 'No':
          this.approvedPremises = false
          break
        default:
          break
      }
    }
  }

  /**
   * Update the Booking from data in action and details. If there is a significant state change then
   * the event property will contain its name.
   * @param action
   * @param details
   */
  update(action: string, details: any) {
    this.event = undefined
    if (action !== 'UPDATE_SECTION') return

    this.updateEligibilityState(details)
    this.updateAddressChoice(details)
  }

  getEvent(): Event {
    return this.event
  }

  getAddressChoice(): AddressChoice {
    return this.addressChoice
  }

  getApprovedPremises(): boolean {
    return this.approvedPremises === true
  }
}
