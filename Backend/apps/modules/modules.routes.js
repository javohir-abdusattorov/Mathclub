
const path = require("path")
const crypto = require("crypto")
const jwt = require('jsonwebtoken')
const ErrorResponse = require('../../utils/errorResponse')
const asyncHandler = require('../../middleware/async')

const Module = require("./module.model")
const User = require('../users/user.model')

const ValidationService = require("../../utils/validationService")
const validation = new ValidationService()
const FileService = require("../../utils/fileService")
const fileService = new FileService()

const Service = require("./modules.service")
const service = new Service()

const openTopics = +process.env.OPEN_TOPICS


module.exports = class ModuleRoutes {

  // @desc      Get all modules
  // @route     GET /api/v1/modules/all
  // @access    Public
  getAllModules = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults)
  })

  // @desc      Get all modules
  // @route     GET /api/v1/modules/module/:id
  // @access    Public
  getModuleById = asyncHandler(async (req, res, next) => {
    const result = await validation.validateModuleID(req.params.id)
    if (!result.success) return next(new ErrorResponse(result.message, 400))

    res.status(200).json({
      success: true,
      data: result.data
    })
  })

  // @desc      Get all user modules
  // @route     GET /api/v1/modules/my-modules
  // @access    Private (Customer only)
  getUserModules = asyncHandler(async (req, res, next) => {
    const userModules = req.user.modules.map(item => item.module)
    const modules = await Module.find({ _id: { $in: userModules } }).lean()
    const data = {
      modules,
      buyingModules: []
    }

    for (const buyModule of req.user.buyingModules) {
      const moduleID = buyModule.module.toString()
      const inModules = userModules.some(item => item.toString() === moduleID)
      if (!inModules) {
        const loaded = modules.find(item => item._id.toString() === moduleID)
        if (loaded) data.buyingModules.push(loaded)
          else data.buyingModules.push(await Module.findById(moduleID).lean())
      }
    }

    for (const buyModule of data.buyingModules) buyModule.payUrl = service.paymeRedirectUrl(req.user._id, buyModule)

    res.status(200).json({ success: true, data })
  })

  // @desc      Get lesson video
  // @route     GET /api/v1/modules/lesson-video/:module/:topic/:lesson/:access
  // @access    Private
  getLessonVideo = asyncHandler(async (req, res, next) => {
    let user
    const q = req.params

    // Check module, topic, lesson
    const result = await validation.validateModuleID(q.module)
    if (!result.success) return res.sendStatus(400)
    const userModule = result.data
    const i = userModule.topics.findIndex(item => item.id === q.topic)
    if (i < 0) return res.sendStatus(501)
    const j = userModule.topics[i].lessons.findIndex(item => item.id === q.lesson)
    if (j < 0) return res.sendStatus(502)

    const filePath = path.join(__dirname, `../../public/${ userModule.topics[i].lessons[j].video }`)
    if (i < openTopics) return res.sendFile(filePath)

    // Check user by query token
    if (!q.access) return res.sendStatus(505)
    try {
      const decoded = jwt.verify(q.access, process.env.JWT_SECRET)
      user = await User.findById(decoded.id)
      if (!user) return res.sendStatus(506)
    } catch (err) { return res.sendStatus(507) }

    // Check user permission
    if (user.role == "admin") return res.sendFile(filePath)

    const hasModule = user.modules.some(item => item.module.toString() === userModule._id.toString())
    if (!hasModule) return res.sendStatus(508)

    res.sendFile(filePath)
  })

  // @desc      Get topic file
  // @route     GET /api/v1/modules/topic-file/:module/:topic/:access
  // @access    Private
  getTopicFile = asyncHandler(async (req, res, next) => {
    let user
    const q = req.params

    // Check module, topic, lesson
    const result = await validation.validateModuleID(q.module)
    if (!result.success) return res.sendStatus(400)
    const userModule = result.data
    const i = userModule.topics.findIndex(item => item.id === q.topic)
    if (i < 0) return res.sendStatus(501)

    const filePath = path.join(__dirname, `../../public/${userModule.topics[i].file}`)
    if (i < openTopics) return res.sendFile(filePath)

    // Check user by query token
    if (!q.access) return res.sendStatus(505)
    try {
      const decoded = jwt.verify(q.access, process.env.JWT_SECRET)
      user = await User.findById(decoded.id)
      if (!user) return res.sendStatus(506)
    } catch (err) { return res.sendStatus(507) }

    // Check user permission
    if (user.role == "admin") return res.sendFile(filePath)

    const hasModule = user.modules.some(item => item.module.toString() === userModule._id.toString())
    if (!hasModule) return res.sendStatus(508)

    res.sendFile(filePath)
  })

// -------------------------------------------------------------------------------------------------------

  // @desc      Create
  // @route     POST /api/v1/modules/create
  // @access    Private (Admin only)
  createModule = asyncHandler(async (req, res, next) => {
    const result = validation.validateBody(req.body, [
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "price", type: "number" },
      { name: "type", type: "string" },
    ])
    if (!result.success) return next(new ErrorResponse(result.message, 400))

    const { name, price, description, type } = req.body
    const newModule = await Module.create({
      name,
      price,
      description,
      type,
      topics: []
    })

    res.status(200).json({
      success: true,
      data: newModule,
    })
  })

  // @desc      Edit module
  // @route     PUT /api/v1/modules/edit/:id
  // @access    Private (Admin only)
  editModule = asyncHandler(async (req, res, next) => {
    const result = await validation.validateModuleID(req.params.id)
    if (!result.success) return next(new ErrorResponse(result.message, 400))

    const editModule = result.data
    const fields = ["name", "description", "price", "type"]
    for (const field of fields) if (field in req.body) editModule[field] = req.body[field]

    await editModule.save()
    res.status(200).json({
      success: true,
      data: editModule,
    })
  })

  // @desc      Delete module
  // @route     PATCH /api/v1/modules/delete/:id
  // @access    Private (Admin only)
  deleteModule = asyncHandler(async (req, res, next) => {
    const result = await validation.validateModuleID(req.params.id)
    if (!result.success) return next(new ErrorResponse(result.message, 400))

    const editModule = result.data
    const lessonVideos = []
    for (const topic of editModule.topics) for (const lesson of topic.lessons) lessonVideos.push(lesson.video)

    await service.removeModuleFromUsers(editModule._id)
    fileService.deleteFiles(lessonVideos)
    await Module.deleteOne({ _id: editModule._id })

    res.status(200).json({ success: true })
  })

// -------------------------------------------------------------------------------------------------------

  // @desc      Create topic for module
  // @route     POST /api/v1/modules/create-topic
  // @access    Private (Admin only)
  createTopic = asyncHandler(async (req, res, next) => {
    const result = await validation.validateWaterfall(
      validation.validateBody(req.body, [
        { name: "module", type: "string" },
        { name: "name", type: "string" },
        { name: "description", type: "string" },
      ]),
      await validation.validateModuleID(req.body.module),
    )
    if (!result.success) return next(new ErrorResponse(result.message, 400))

    const topicModule = result.data[0]
    const randomStr = `${crypto.randomBytes(20).toString('hex').slice(0, 5)}${new Date().getTime()}${crypto.randomBytes(20).toString('hex').slice(0, 5)}`
    const createObj = {
      name: req.body.name,
      description: req.body.description,
      id: randomStr,
      lessons: []
    }

    if (req.files && req.files.file) {
      const file = req.files.file
      if (file.name.split('.').last() !== "pdf") return next(new ErrorResponse(`Bu format qo'llab quvvatlanmaydi!`, 400))
      createObj.file = await fileService.uploadTopicFile(file, randomStr)
    }

    topicModule.topics.push(createObj)
    await topicModule.save()

    res.status(200).json({
      success: true,
      data: topicModule.topics.last(),
    })
  })

  // @desc      Edit topic
  // @route     PUT /api/v1/modules/edit-topic
  // @access    Private (Admin only)
  editTopic = asyncHandler(async (req, res, next) => {
    const result = await validation.validateWaterfall(
      validation.validateBody(req.body, [
        { name: "module", type: "string" },
        { name: "topic", type: "string" },
      ]),
      await validation.validateModuleID(req.body.module)
    )
    if (!result.success) return next(new ErrorResponse(result.message, 400))

    const topicModule = result.data[0]
    const i = topicModule.topics.findIndex(item => item.id === req.body.topic)

    if (i < 0) return next(new ErrorResponse(`Bunday MAVZU topilmadi.`, 400))

    const fields = ["name", "description"]
    const topic = topicModule.topics[i]
    for (const field of fields) if (field in req.body) topic[field] = req.body[field]

    if (req.files && req.files.file) {
      const file = req.files.file
      if (file.name.split('.').last() !== "pdf") return next(new ErrorResponse(`Bu format qo'llab quvvatlanmaydi! Faqat .pdf format qo'llab quvvatlanadi`, 400))

      fileService.deleteFiles([topic.file])
      topic.file = await fileService.uploadTopicFile(file, topic.id)
    }

    await topicModule.save()
    res.status(200).json({
      success: true,
      data: topic,
    })
  })

  // @desc      Delete topic
  // @route     PATCH /api/v1/modules/delete-topic
  // @access    Private (Admin only)
  deleteTopic = asyncHandler(async (req, res, next) => {
    const result = await validation.validateWaterfall(
      validation.validateBody(req.body, [
        { name: "module", type: "string" },
        { name: "topic", type: "string" },
      ]),
      await validation.validateModuleID(req.body.module)
    )
    if (!result.success) return next(new ErrorResponse(result.message, 400))

    const { topic, name, description } = req.body
    const topicModule = result.data[0]
    const i = topicModule.topics.findIndex(item => item.id === topic)
    if (i < 0) return next(new ErrorResponse(`Bunday MAVZU topilmadi.`, 400))

    const lessonVideos = topicModule.topics[i].lessons.map(item => item.video)
    fileService.deleteFiles(lessonVideos)
    if (topicModule.topics[i].file) fileService.deleteFiles([topicModule.topics[i].file])

    topicModule.topics.splice(i, 1)
    await topicModule.save()

    res.status(200).json({ success: true })
  })

// -------------------------------------------------------------------------------------------------------

  // @desc      Create lesson for topic
  // @route     POST /api/v1/modules/create-lesson
  // @access    Private (Admin only)
  createLesson = asyncHandler(async (req, res, next) => {
    const result = await validation.validateWaterfall(
      validation.validateBody(req.body, [
        { name: "module", type: "string" },
        { name: "topic", type: "string" },

        { name: "name", type: "string" },
        { name: "description", type: "string" },
      ]),
      await validation.validateModuleID(req.body.module),
    )
    if (!result.success) return next(new ErrorResponse(result.message, 400))

    const { topic, name, description } = req.body
    const topicModule = result.data[0]
    const i = topicModule.topics.findIndex(item => item.id === topic)

    if (i < 0) return next(new ErrorResponse(`Bunday MAVZU topilmadi.`, 400))
    if (!req.files || !req.files.video) return next(new ErrorResponse(`Iltimos video yuklang`, 400))

    const video = req.files.video
    if (video.mimetype.split('/')[0] !== "video") return next(new ErrorResponse(`Bu format qo'llab quvvatlanmaydi!`, 400))
    if (video.name.split('.').last() !== "mp4") return next(new ErrorResponse(`Bu format qo'llab quvvatlanmaydi! Faqat .mp4 format qo'llab quvvatlanadi`, 400))

    const randomStr = `${crypto.randomBytes(20).toString('hex').slice(0, 5)}${new Date().getTime()}${crypto.randomBytes(20).toString('hex').slice(0, 5)}`
    const moduleVideo = await fileService.uploadLessonVideo(video, randomStr)

    topicModule.topics[i].lessons.push({
      id: randomStr,
      name,
      description,
      video: moduleVideo,
    })
    await topicModule.save()

    res.status(200).json({
      success: true,
      data: topicModule.topics[i].lessons.last(),
    })
  })

  // @desc      Edit lesson
  // @route     PUT /api/v1/modules/edit-lesson
  // @access    Private (Admin only)
  editLesson = asyncHandler(async (req, res, next) => {
    const result = await validation.validateWaterfall(
      validation.validateBody(req.body, [
        { name: "module", type: "string" },
        { name: "topic", type: "string" },
        { name: "lesson", type: "string" },
      ]),
      await validation.validateModuleID(req.body.module),
    )
    if (!result.success) return next(new ErrorResponse(result.message, 400))

    let { topic, lesson, name, description } = req.body
    const topicModule = result.data[0]
    const i = topicModule.topics.findIndex(item => item.id === topic)
    if (i < 0) return next(new ErrorResponse(`Bunday MAVZU topilmadi.`, 400))

    const j = topicModule.topics[i].lessons.findIndex(item => item.id === lesson)
    if (j < 0) return next(new ErrorResponse(`Bunday DARS topilmadi.`, 400))

    lesson = topicModule.topics[i].lessons[j]
    const fields = ["name", "description"]
    for (const field of fields) if (field in req.body) lesson[field] = req.body[field]

    if (req.files && req.files.video) {
      const video = req.files.video
      if (video.mimetype.split('/')[0] !== "video") return next(new ErrorResponse(`Bu format qo'llab quvvatlanmaydi!`, 400))
      if (video.name.split('.').last() !== "mp4") return next(new ErrorResponse(`Bu format qo'llab quvvatlanmaydi! Faqat .mp4 format qo'llab quvvatlanadi`, 400))

      fileService.deleteFiles([lesson.video])
      lesson.video = await fileService.uploadLessonVideo(video, lesson.id)
    }
    await topicModule.save()

    res.status(200).json({
      success: true,
      data: lesson,
    })
  })

  // @desc      Delete lesson
  // @route     PATCH /api/v1/modules/delete-lesson
  // @access    Private (Admin only)
  deleteLesson = asyncHandler(async (req, res, next) => {
    const result = await validation.validateWaterfall(
      validation.validateBody(req.body, [
        { name: "module", type: "string" },
        { name: "topic", type: "string" },
        { name: "lesson", type: "string" },
      ]),
      await validation.validateModuleID(req.body.module),
    )
    if (!result.success) return next(new ErrorResponse(result.message, 400))

    const { topic, lesson, name, description } = req.body
    const topicModule = result.data[0]

    const i = topicModule.topics.findIndex(item => item.id === topic)
    if (i < 0) return next(new ErrorResponse(`Bunday MAVZU topilmadi.`, 400))

    const j = topicModule.topics[i].lessons.findIndex(item => item.id === lesson)
    if (j < 0) return next(new ErrorResponse(`Bunday DARS topilmadi.`, 400))

    fileService.deleteFiles([ topicModule.topics[i].lessons[j].video ])
    topicModule.topics[i].lessons.splice(j, 1)
    await topicModule.save()

    res.status(200).json({
      success: true,
      data: topicModule,
    })
  })

// -------------------------------------------------------------------------------------------------------

  // @desc      User buy module
  // @route     POST /api/v1/modules/buy-module/:id
  // @access    Private (User only)
  userBuyModule = asyncHandler(async (req, res, next) => {
    const result = await validation.validateModuleID(req.params.id)
    if (!result.success) return next(new ErrorResponse(result.message, 400))

    const topicModule = result.data
    const hasModule = req.user.modules.some(item => item.module.toString() === topicModule._id.toString())
    if (hasModule) return next(new ErrorResponse(`Sizda bu modul bor.`, 400))

    const buyingModule = req.user.buyingModules.some(item => item.module.toString() === topicModule._id.toString())
    if (buyingModule) return next(new ErrorResponse(`Sizda bu modulni sotib olmoqdasiz`, 400))

    req.user.buyingModules.push({
      name: topicModule.name,
      module: topicModule._id,
      paystate: 0
    })

    await req.user.save()
    const redirectUrl = service.paymeRedirectUrl(req.user._id, topicModule)

    res.status(200).json({
      success: true,
      data: redirectUrl,
    })
  })

  // @desc      Admin give module for free
  // @route     POST /api/v1/modules/give-module
  // @access    Private (Admin only)
  adminGiveModule = asyncHandler(async (req, res, next) => {
    const result = await validation.validateWaterfall(
      validation.validateBody(req.body, [
        { name: "module", type: "string" },
        { name: "user", type: "string" },
      ]),
      await validation.validateModuleID(req.body.module),
      await validation.validateUserID(req.body.user),
    )
    if (!result.success) return next(new ErrorResponse(result.message, 400))

    const topicModule = result.data[0]
    const user = result.data[1]

    const hasModule = user.modules.some(item => item.module.toString() === topicModule._id.toString())
    if (hasModule) return next(new ErrorResponse(`Foydalanuvchida bu modul bor.`, 400))

    const buyingModule = user.buyingModules.some(item => item.module.toString() === topicModule._id.toString())
    if (buyingModule) return next(new ErrorResponse(`Foydalanuvchi bu modulni sotib olmoqda.`, 400))

    user.modules.push({
      name: topicModule.name,
      module: topicModule._id
    })

    await user.save()

    res.status(200).json({
      success: true,
      data: user,
    })
  })

  // @desc      Admin return module from user
  // @route     POST /api/v1/modules/return-module
  // @access    Private (Admin only)
  adminReturnModule = asyncHandler(async (req, res, next) => {
    const result = await validation.validateWaterfall(
      validation.validateBody(req.body, [
        { name: "module", type: "string" },
        { name: "user", type: "string" },
      ]),
      await validation.validateModuleID(req.body.module),
      await validation.validateUserID(req.body.user),
    )
    if (!result.success) return next(new ErrorResponse(result.message, 400))

    const topicModule = result.data[0]
    const user = result.data[1]

    const i = user.modules.findIndex(item => item.module.toString() === topicModule._id.toString())
    const j = user.buyingModules.findIndex(item => item.module.toString() === topicModule._id.toString())
    if (i < 0) return next(new ErrorResponse(`Foydalanuvchida bu modul yo'q.`, 400))

    if (j >= 0) user.buyingModules.splice(j, 1)
    user.modules.splice(i, 1)
    await user.save()

    res.status(200).json({
      success: true,
      data: user,
    })
  })

}


Array.prototype.last = function() { return this[this.length - 1] }