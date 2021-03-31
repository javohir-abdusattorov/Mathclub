const { Router } = require('express')
const router = Router()
const Module = require('./module.model')
const Routes = require('./modules.routes')
const routes = new Routes()

const advancedResults = require('../../middleware/advancedResults')
const { protect, authorize } = require('../../middleware/auth')


router.get('/all', advancedResults(Module), routes.getAllModules)
router.get('/module/:id', routes.getModuleById)
router.get('/my-modules', protect, authorize("user"), routes.getUserModules)
router.get('/topic-file/:module/:topic/:access', routes.getTopicFile)
router.get('/lesson-video/:module/:topic/:lesson/:access', routes.getLessonVideo)

router.post('/create', protect, authorize("admin"), routes.createModule)
router.put('/edit/:id', protect, authorize("admin"), routes.editModule)
router.patch('/delete/:id', protect, authorize("admin"), routes.deleteModule)

router.post('/create-topic', protect, authorize("admin"), routes.createTopic)
router.put('/edit-topic', protect, authorize("admin"), routes.editTopic)
router.patch('/delete-topic', protect, authorize("admin"), routes.deleteTopic)

router.post('/create-lesson', protect, authorize("admin"), routes.createLesson)
router.put('/edit-lesson', protect, authorize("admin"), routes.editLesson)
router.patch('/delete-lesson', protect, authorize("admin"), routes.deleteLesson)

router.post('/buy-module/:id', protect, authorize("user"), routes.userBuyModule)
router.post('/give-module', protect, authorize("admin"), routes.adminGiveModule)
router.post('/return-module', protect, authorize("admin"), routes.adminReturnModule)


module.exports = router
