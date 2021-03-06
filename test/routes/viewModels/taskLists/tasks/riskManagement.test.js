const riskManagement = require('../../../../../server/routes/viewModels/taskLists/tasks/riskManagement')

describe('risk management task', () => {
  test('should return Address unsuitable if addressUnsuitable = true', () => {
    expect(
      riskManagement.view({
        decisions: { addressUnsuitable: true },
        tasks: {},
      })
    ).toStrictEqual({
      action: { href: '/hdc/review/risk/', text: 'View', type: 'btn-secondary' },
      label: 'Address unsuitable',
      title: 'Risk management',
    })
  })

  test('should return No risks if risk management not needed', () => {
    expect(
      riskManagement.view({
        decisions: { addressReviewFailed: false, riskManagementNeeded: false },
        tasks: { riskManagement: 'DONE' },
      })
    ).toStrictEqual({
      action: { href: '/hdc/review/risk/', text: 'View', type: 'btn-secondary' },
      label: 'No risks',
      title: 'Risk management',
    })
  })

  test('should return Risk management required if risk management needed', () => {
    expect(
      riskManagement.view({
        decisions: { addressReviewFailed: false, riskManagementNeeded: true },
        tasks: { riskManagement: 'DONE' },
      })
    ).toStrictEqual({
      action: { href: '/hdc/review/risk/', text: 'View', type: 'btn-secondary' },
      label: 'Risk management required',
      title: 'Risk management',
    })
  })

  test('should return Not completed if risk task not done', () => {
    expect(
      riskManagement.view({
        decisions: { addressReviewFailed: false, riskManagementNeeded: true },
        tasks: { riskManagement: 'UNSTARTED' },
      })
    ).toStrictEqual({
      action: { href: '/hdc/review/risk/', text: 'View', type: 'btn-secondary' },
      label: 'Not completed',
      title: 'Risk management',
    })
  })

  test('should return warning if still waiting for information', () => {
    expect(
      riskManagement.view({
        decisions: { awaitingRiskInformation: true },
        tasks: {},
      })
    ).toStrictEqual({
      action: { href: '/hdc/review/risk/', text: 'View', type: 'btn-secondary' },
      label: 'WARNING||Still waiting for information',
      title: 'Risk management',
    })
  })

  test('should show continue btn to curfewAddressReview if curfewAddressReview: !DONE || UNSTARTED', () => {
    expect(
      riskManagement.view({
        decisions: {},
        tasks: { riskManagement: 'SOMETHING' },
      })
    ).toStrictEqual({
      action: {
        href: '/hdc/review/risk/',
        text: 'View',
        type: 'btn-secondary',
      },
      label: 'Not completed',
      title: 'Risk management',
    })
  })
})

describe('Action varies based on type', () => {
  test('view', () => {
    expect(
      riskManagement.view({
        decisions: {},
        tasks: { riskManagement: 'SOMETHING' },
      }).action
    ).toStrictEqual({
      href: '/hdc/review/risk/',
      text: 'View',
      type: 'btn-secondary',
    })
  })

  test('edit', () => {
    expect(
      riskManagement.edit({
        decisions: {},
        tasks: { riskManagement: 'SOMETHING' },
      }).action
    ).toStrictEqual({
      dataQa: 'risk-management',
      href: '/hdc/risk/riskManagement/',
      text: 'View/Edit',
      type: 'btn-secondary',
    })
  })

  test('ro', () => {
    expect(
      riskManagement.ro({
        decisions: {},
        tasks: { riskManagement: 'SOMETHING' },
      }).action
    ).toStrictEqual({
      href: '/hdc/risk/riskManagement/',
      text: 'Continue',
      type: 'btn',
    })
  })
})
