const adminRole = 'BATCHLOAD'

const roleMap = new Map()
  .set('NOMIS_BATCHLOAD', adminRole)
  .set('LICENCE_READONLY', 'READONLY')
  .set('LICENCE_RO_READONLY', 'RO_READONLY')
  .set('LICENCE_CA', 'CA')
  .set('LICENCE_RO', 'RO')
  .set('LICENCE_DM', 'DM')

const authServiceRoles = [...roleMap.keys()]
const applicationRoles = [...roleMap.values()]

module.exports = {
  applicationRoleForAuthServiceRole: (authServiceRole) => roleMap.get(authServiceRole),
  isAuthServiceRole: (role) => authServiceRoles.includes(role),
  isApplicationRole: (role) => applicationRoles.includes(role),
  isAdminRole: (role) => adminRole === role,
}
