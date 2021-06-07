const express = require('express')
const probationAreas = require('./stubs/probationAreas')

const teamC01T04 = {
  code: 'C01T04',
  description: 'OMU A',
  telephone: '01234567890',
  localDeliveryUnit: { code: 'ABC124', description: 'ABC124 delivery unit' },
  district: { code: 'D', description: 'E' },
  borough: { code: 'F', description: 'G' },
}

const deliusTeams = [teamC01T04]

const AUTH_RO_USER_TEST = {
  username: 'AUTH_RO_USER_TEST',
  staffCode: 'DELIUS_ID_TEST',
  staffIdentifier: 1,
  email: 'hdc_test+RO_USER_TEST@digital.justice.gov.uk',
  staff: {
    forenames: 'FIRSTA',
    surname: 'LASTA',
  },
  teams: deliusTeams,
}

const RO_USER_TEST = {
  username: 'RO_USER_TEST',
  staffCode: 'AUTH_DELIUS_ID_TEST',
  staffIdentifier: 2,
  email: 'hdc_test+RO_USER_TEST@digital.justice.gov.uk',
  staff: {
    forenames: 'FIRSTA',
    surname: 'LASTA',
  },
  teams: deliusTeams,
}

const RO_USER = {
  username: 'RO_USER',
  staffCode: 'DELIUS_ID',
  staffIdentifier: 3,
  email: 'hdc_test+RO_USER@digital.justice.gov.uk',
  staff: {
    forenames: 'JESSY',
    surname: 'SMITH',
  },
  teams: deliusTeams,
}

const RO_USER_READONLY_TEST = {
  username: 'RO_USER_READONLY_TEST',
  staffCode: 'AUTH_DELIUS_ID_TEST',
  staffIdentifier: 4,
  email: 'hdc_test+RO_USER_READONLY_TEST@digital.justice.gov.uk',
  staff: {
    forenames: 'FIRSTA',
    surname: 'LASTA',
  },
  teams: deliusTeams,
}

const staffDetailsByUsername = {
  AUTH_RO_USER_TEST,
  RO_USER_TEST,
  RO_USER,
  RO_USER_READONLY_TEST,
}

const staffDetailsByStaffIdentifier = {
  1: AUTH_RO_USER_TEST,
  2: RO_USER_TEST,
  3: RO_USER,
  4: RO_USER_READONLY_TEST,
}

const router = express.Router()

router.get('/staff/username/:username', (req, res) => {
  const { username } = req.params
  const staffDetails = staffDetailsByUsername[username]
  if (staffDetails) {
    res.send(staffDetails)
  } else {
    res.sendStatus(404)
  }
})

router.get('/staff/staffIdentifier/:staffIdentifier', (req, res) => {
  const { staffIdentifier } = req.params
  const staffDetails = staffDetailsByStaffIdentifier[staffIdentifier]
  if (staffDetails) {
    res.send(staffDetails)
  } else {
    res.sendStatus(404)
  }
})

router.get('/staff/staffIdentifier/:staffIdentifier/managedOffenders', (req, res) => {
  const { staffIdentifier } = req.params

  const offenders = [
    {
      staffIdentifier,
      offenderId: 1234567,
      nomsNumber: 'A5001DY',
      crnNumber: 1234567,
      offenderSurname: 'Andrews',
      isCurrentRo: true,
      isCurrentOm: true,
      isCurrentPom: true,
      omStartDate: '01/01/2001',
      omEndDate: '01/01/2001',
    },
  ]

  res.send(offenders)
})

router.get('/offenders/nomsNumber/:nomsNumber/allOffenderManagers', (req, res) => {
  const ros = [
    {
      isPrisonOffenderManager: false,
      isUnallocated: false,
      isResponsibleOfficer: true,
      staff: { forenames: 'Ryan', surname: 'Orton' },
      staffCode: 'DELIUS_ID',
      staffId: 2,
      team: teamC01T04,
      probationArea: { code: 'ABC', description: 'ABC probation area' },
    },
  ]

  res.send(ros)
})

router.get('/probationAreas', (req, res) => {
  // return all probation areas
  const allProbationAreas = probationAreas.map((probArea) => ({
    code: probArea.code,
    description: probArea.description,
  }))
  const response = { content: allProbationAreas }
  res.send(response)
})

router.get('/probationAreas/code/:code/localDeliveryUnits', (req, res) => {
  // return the LDUs for a specific probation area
  const { code: probationAreaCode } = req.params
  const probationArea = probationAreas.filter((probArea) => probArea.code === probationAreaCode)
  const response = { content: probationArea[0].ldus }
  res.send(response)
})

module.exports = router
