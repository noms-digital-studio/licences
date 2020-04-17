const config = require('../config')

module.exports = () => (router) => {
  router.get('/', (req, res) => {
    if (req.user && config.roles.admin.includes(req.user.role)) {
      return res.redirect('/admin/')
    }
    return res.redirect('/caseList/active')
  })

  return router
}
