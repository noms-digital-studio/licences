package uk.gov.justice.digital.hmpps.licences.pages.assessment
import geb.Page

class ProposedAddressCurfewAddressChoicePage extends Page {

  static url = '/hdc/proposedAddress/curfewAddressChoice'

  static at = {
    browser.currentUrl.contains(url)
  }
    static content = {}
}
