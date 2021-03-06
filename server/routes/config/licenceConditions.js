module.exports = {
  standard: {
    fields: [
      {
        additionalConditionsRequired: {
          responseType: 'requiredYesNo',
          validationMessage: 'Select yes or no',
        },
      },
    ],
    nextPath: {
      decisions: {
        discriminator: 'additionalConditionsRequired',
        Yes: {
          path: '/hdc/licenceConditions/additionalConditions/',
          change: '/hdc/licenceConditions/additionalConditions/change/',
        },
        No: {
          path: '/hdc/taskList/',
          change: '/hdc/review/licenceDetails/',
        },
      },
      path: '/hdc/taskList/',
      change: '/hdc/review/licenceDetails/',
    },
    modificationRequiresApproval: true,
  },
  additional: {
    fields: [
      {
        NOCONTACTASSOCIATE: {
          contains: [
            {
              groupsOrOrganisation: {
                validationMessage: 'Enter a name or describe specific groups or organisations',
              },
            },
          ],
        },
      },
      {
        INTIMATERELATIONSHIP: {
          contains: [
            {
              intimateGender: {
                validationMessage: 'Select women / men / women or men',
              },
            },
          ],
        },
      },
      {
        NOCONTACTNAMED: {
          contains: [
            {
              noContactOffenders: {
                validationMessage: 'Enter named offender(s) or individual(s)',
              },
            },
          ],
        },
      },
      {
        NORESIDE: {
          contains: [
            {
              notResideWithGender: {
                validationMessage: 'Select any / any female / any male',
              },
            },
            {
              notResideWithAge: {
                validationMessage: 'Enter age',
              },
            },
          ],
        },
      },
      {
        NOUNSUPERVISEDCONTACT: {
          contains: [
            {
              unsupervisedContactGender: {
                validationMessage: 'Select any / any female / any male',
              },
            },
            {
              unsupervisedContactAge: {
                validationMessage: 'Enter age',
              },
            },
            {
              unsupervisedContactSocial: {
                validationMessage: 'Enter name of appropriate social service department',
              },
            },
          ],
        },
      },
      {
        NOCHILDRENSAREA: {
          contains: [
            {
              notInSightOf: {
                validationMessage: "Enter location, for example children's play area",
              },
            },
          ],
        },
      },
      {
        NOWORKWITHAGE: {
          contains: [
            {
              noWorkWithAge: {
                validationMessage: 'Enter age',
              },
            },
          ],
        },
      },
      {
        NOCOMMUNICATEVICTIM: {
          contains: [
            {
              victimFamilyMembers: {
                validationMessage: 'Enter name of victim and /or family members',
              },
            },
            {
              socialServicesDept: {
                validationMessage: 'Enter name of appropriate social service department',
              },
            },
          ],
        },
      },
      {
        COMPLYREQUIREMENTS: {
          contains: [
            {
              courseOrCentre: {
                validationMessage: 'Enter name of course / centre',
              },
            },
            {
              abuseAndBehaviours: {
                validationMessage:
                  'Select at least one option from the alcohol abuse / drug abuse / sexual behaviour / violent behaviour / gambling / solvent abuse / anger / debt / prolific behaviour / offending behaviour',
              },
            },
          ],
        },
      },
      {
        ATTENDALL: {
          contains: [
            {
              appointmentName: {
                validationMessage: 'Enter name',
              },
            },
            {
              appointmentProfession: {
                validationMessage: 'Select psychiatrist / psychologist / medical practitioner',
              },
            },
          ],
        },
      },
      {
        HOMEVISITS: {
          contains: [
            {
              mentalHealthName: {
                validationMessage: 'Enter name',
              },
            },
          ],
        },
      },
      {
        REMAINADDRESS: {
          contains: [
            {
              curfewAddress: {
                validationMessage: 'Enter curfew address',
              },
            },
            {
              curfewFrom: {
                validationMessage: 'Enter start of curfew hours',
              },
            },
            {
              curfewTo: {
                validationMessage: 'Enter end of curfew hours',
              },
            },
          ],
        },
      },
      {
        CONFINEADDRESS: {
          contains: [
            {
              confinedTo: {
                validationMessage: 'Enter time',
              },
            },
            {
              confinedFrom: {
                validationMessage: 'Enter time',
              },
            },
            {
              confinedReviewFrequency: {
                validationMessage: 'Enter frequency, for example weekly',
              },
            },
          ],
        },
      },
      {
        REPORTTO: {
          contains: [
            {
              reportingAddress: {
                validationMessage: 'Enter name of approved premises / police station',
              },
            },
            {
              reportingTime: {
                validationMessage: 'Enter time / daily',
              },
            },
            {
              reportingDaily: {
                validationMessage: 'Enter time / daily',
              },
            },
            {
              reportingFrequency: {
                validationMessage: 'Enter frequency, for example weekly',
              },
            },
          ],
        },
      },
      {
        VEHICLEDETAILS: {
          contains: [
            {
              vehicleDetails: {
                validationMessage: 'Enter details, for example make, model',
              },
            },
          ],
        },
      },
      {
        EXCLUSIONADDRESS: {
          contains: [
            {
              noEnterPlace: {
                validationMessage: 'Enter name / type of premises / address / road',
              },
            },
          ],
        },
      },
      {
        EXCLUSIONAREA: {
          contains: [
            {
              exclusionArea: {
                validationMessage: 'Enter clearly specified area',
              },
            },
          ],
        },
      },
      {
        DRUG_TESTING: {
          contains: [
            {
              drug_testing_name: {
                validationMessage: 'Enter appointment name',
              },
            },
            {
              drug_testing_address: {
                validationMessage: 'Enter appointment address',
              },
            },
          ],
        },
      },
      {
        ATTENDDEPENDENCY: {
          contains: [
            {
              appointmentDate: {
                validationMessage: 'Enter appointment date',
              },
            },
            {
              appointmentTime: {
                validationMessage: 'Enter appointment time',
              },
            },
            {
              appointmentAddress: {
                validationMessage: 'Enter appointment name and address',
              },
            },
          ],
        },
      },
      {
        ATTENDDEPENDENCYINDRUGSSECTION: {
          contains: [
            {
              appointmentDateInDrugsSection: {
                validationMessage: 'Enter appointment date',
              },
            },
            {
              appointmentTimeInDrugsSection: {
                validationMessage: 'Enter appointment time',
              },
            },
            {
              appointmentAddressInDrugsSection: {
                validationMessage: 'Enter appointment name and address',
              },
            },
          ],
        },
      },
      {
        ATTENDSAMPLE: {
          contains: [
            {
              attendSampleDetailsName: {
                validationMessage: 'Enter appointment name',
              },
            },
            {
              attendSampleDetailsAddress: {
                validationMessage: 'Enter appointment address',
              },
            },
          ],
        },
      },
      // 2019
      {
        DO_NOT_MEET: {
          contains: [
            {
              do_not_meet_name: {
                validationMessage: 'Enter name',
              },
            },
          ],
        },
      },
      {
        TELL_PROBATION_ABOUT_RELATIONSHIP: {
          contains: [
            {
              tell_probation_about_relationship_gender: {
                validationMessage: 'Select an option',
              },
            },
          ],
        },
      },
      {
        DO_NOT_LIVE_OR_STAY: {
          contains: [
            {
              do_not_live: {
                validationMessage: 'Select an option',
              },
            },
          ],
        },
      },
      {
        NO_UNSUPERVISED_CONTACT: {
          contains: [
            {
              do_not_unsupervised_contact: {
                validationMessage: 'Select an option',
              },
            },
            {
              do_not_unsupervised_social_services_dept_name: {
                validationMessage: 'Enter social services name',
              },
            },
          ],
        },
      },
      {
        DO_NOT_STAY_IN_SIGHT_OF: {
          contains: [
            {
              do_not_in_sight_of_type: {
                validationMessage: 'Enter a type of location',
              },
            },
          ],
        },
      },
      {
        DO_NOT_TAKE_PART_IN_ACTIVITY: {
          contains: [
            {
              do_not_work_involve: {
                validationMessage: 'Select an option',
              },
            },
          ],
        },
      },
      {
        DO_NOT_CONTACT_VICTIM: {
          contains: [
            {
              do_not_contact_victim_name: {
                validationMessage: 'Enter a victim name',
              },
            },
            {
              do_not_contact_victim_social_services_dept_name: {
                validationMessage: 'Enter social services name',
              },
            },
          ],
        },
      },
      {
        FOLLOW_REHABILITATION_INSTRUCTIONS: {
          contains: [
            {
              follow_rehabilitation_instructions: {
                validationMessage: 'Select an option',
              },
            },
          ],
        },
      },
      {
        GIVE_URINE_SAMPLE: {
          contains: [
            {
              give_sample: {
                validationMessage: 'Select an option',
              },
            },
          ],
        },
      },
      {
        GO_TO_APPOINTMENTS: {
          contains: [
            {
              go_to_appointments_with: {
                validationMessage: 'Select an option',
              },
            },
          ],
        },
      },
      {
        ALLOW_VISIT: {
          contains: [
            {
              allow_visit_with: {
                validationMessage: 'Select an option',
              },
            },
          ],
        },
      },
      {
        STAY_AT_ADDRESS: {
          contains: [
            {
              stay_at_address_name: {
                validationMessage: 'Enter an address',
              },
            },
            {
              stay_at_address_from: {
                validationMessage: 'Enter a curfew from time',
              },
            },
            {
              stay_at_address_to: {
                validationMessage: 'Enter a curfew to time',
              },
            },
            {
              stay_at_address_frequency: {
                validationMessage: 'Select an option',
              },
            },
          ],
        },
      },
      {
        REPORT_TO_STAFF_AT: {
          contains: [
            {
              report_to_staff_at_location: {
                validationMessage: 'Enter a location',
              },
            },
            {
              report_to_staff_at_time_and_day: {
                validationMessage: 'Enter a time and day',
              },
            },
          ],
        },
      },
      {
        POLICE_TAKE_TO: {
          contains: [
            {
              police_take_to_address: {
                validationMessage: 'Enter an address',
              },
            },
          ],
        },
      },
      {
        TELL_PROBATION_DOCUMENT: {
          contains: [
            {
              tell_probation_document_own: {
                validationMessage: 'Select an option',
              },
            },
            {
              tell_probation_document_apply: {
                validationMessage: 'Select an option',
              },
            },
          ],
        },
      },
      {
        DO_NOT_GO_PREMISES: {
          contains: [
            {
              do_not_go_premises_address: {
                validationMessage: 'Give premises details',
              },
            },
          ],
        },
      },
      {
        STAY_AT_NIGHT: {
          contains: [
            {
              stay_at_night_address: {
                validationMessage: 'Give an address',
              },
            },
          ],
        },
      },
      {
        ONLY_USE_INTERNET_AT: {
          contains: [
            {
              only_use_internet_at_location: {
                validationMessage: 'Give a location',
              },
            },
          ],
        },
      },
      {
        DO_NOT_ACCESS_DOWNLOAD: {
          contains: [
            {
              do_not_access_download_type: {
                validationMessage: 'Select an option',
              },
            },
            {
              do_not_access_download_target: {
                validationMessage: 'Give details',
              },
            },
          ],
        },
      },
      {
        DO_NOT_OWN_ITEM: {
          contains: [
            {
              do_not_own_item: {
                validationMessage: 'Give details',
              },
            },
          ],
        },
      },
      {
        TELL_ABOUT_ANIMAL: {
          contains: [
            {
              tell_about_animal: {
                validationMessage: 'Give details',
              },
            },
          ],
        },
      },
      {
        DO_NOT_HAVE_MORE_MONEY: {
          contains: [
            {
              do_not_have_more_money_amount: {
                validationMessage: 'Give amount',
              },
            },
          ],
        },
      },
    ],
  },
  conditionsSummary: {
    fields: [
      {
        additionalConditionsJustification: {
          responseType: 'requiredString',
          validationMessage: 'You must explain why you selected these additional conditions',
        },
      },
    ],
    validate: true,
    nextPath: {
      path: '/hdc/taskList/',
      change: '/hdc/review/licenceDetails/',
    },
  },
}
