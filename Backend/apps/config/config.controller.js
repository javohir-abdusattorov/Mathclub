const { Router } = require('express')
const router = Router()
const Routes = require('./config.routes')
const routes = new Routes()
const { protect, authorize } = require('../../middleware/auth')

router.get('/get', routes.getConfig)
router.put('/edit', protect, authorize("admin"), routes.editConfig)

module.exports = router