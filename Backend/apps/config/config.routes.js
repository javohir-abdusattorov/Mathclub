
const ErrorResponse = require('../../utils/errorResponse')
const asyncHandler = require('../../middleware/async')

const Config = require("./config.model")

const ValidationService = require("../../utils/validationService")
const validation = new ValidationService()
const FileService = require("../../utils/fileService")
const fileService = new FileService()

const Service = require("./config.service")
const service = new Service()

const gg = async () => {
  // const hh = await Config.create({
  //   landing: {
  //     video: {
  //       isVisible: true,
  //       video: "landing-video/11.mp4"
  //     },
  //     text: {
  //       isVisible: true,
  //       text: `Lorem ipsum dolor sit amet consectetur adipisicing elit. At voluptatem quaerat sunt officiis ab ut recusandae adipisci. Ipsam accusamus in voluptatibus quis, obcaecati earum placeat temporibus officia iure sunt, doloremque. Error quam amet doloremque porro neque ab ex, voluptatibus expedita ipsum aut rem perferendis aliquid, iste quisquam molestiae quae! Dicta assumenda minus consequuntur fugit ad necessitatibus, vitae quisquam, quas, perferendis dolores a quidem quaerat quos repellendus reiciendis ducimus! Saepe quia expedita nemo eligendi doloribus dolor ipsum, voluptas maxime et atque nihil ipsam eos dolore assumenda libero qui at architecto alias cupiditate obcaecati molestias iusto nobis, illo inventore? Facilis voluptatibus dolorum in, cum ipsa assumenda ab quo natus fugiat dolorem ut magnam, maiores cupiditate ex odit nesciunt harum perferendis nulla perspiciatis distinctio illum, soluta similique minima? Quas facere, itaque quidem, tempore, esse a dicta blanditiis enim rem quo odio, ratione quae alias neque dolorem hic. Aliquam neque nisi corporis id distinctio. Quis, possimus. Est, eaque non expedita. Assumenda adipisci ducimus molestiae perferendis sapiente maxime quibusdam tenetur quo. Illo aliquid recusandae ipsam quaerat esse aperiam consectetur numquam illum, voluptate iure? Doloremque pariatur consequuntur dignissimos numquam omnis, culpa iusto perspiciatis officiis qui fugit voluptas maiores aliquid nobis minima corporis aspernatur, inventore cumque vitae!`
  //     }
  //   }
  // })

  const hh = await Config.updateOne({}, {
    landing: {
      video: {
        isVisible: true,
        video: "landing-video/11.mp4"
      },
      text: {
        isVisible: true,
        text: `Lorem ipsum dolor sit amet consectetur adipisicing elit. At voluptatem quaerat sunt officiis ab ut recusandae adipisci. Ipsam accusamus in voluptatibus quis, obcaecati earum placeat temporibus officia iure sunt, doloremque. Error quam amet doloremque porro neque ab ex, voluptatibus expedita ipsum aut rem perferendis aliquid, iste quisquam molestiae quae! Dicta assumenda minus consequuntur fugit ad necessitatibus, vitae quisquam, quas, perferendis dolores a quidem quaerat quos repellendus reiciendis ducimus! Saepe quia expedita nemo eligendi doloribus dolor ipsum, voluptas maxime et atque nihil ipsam eos dolore assumenda libero qui at architecto alias cupiditate obcaecati molestias iusto nobis, illo inventore? Facilis voluptatibus dolorum in, cum ipsa assumenda ab quo natus fugiat dolorem ut magnam, maiores cupiditate ex odit nesciunt harum perferendis nulla perspiciatis distinctio illum, soluta similique minima? Quas facere, itaque quidem, tempore, esse a dicta blanditiis enim rem quo odio, ratione quae alias neque dolorem hic. Aliquam neque nisi corporis id distinctio. Quis, possimus. Est, eaque non expedita. Assumenda adipisci ducimus molestiae perferendis sapiente maxime quibusdam tenetur quo. Illo aliquid recusandae ipsam quaerat esse aperiam consectetur numquam illum, voluptate iure? Doloremque pariatur consequuntur dignissimos numquam omnis, culpa iusto perspiciatis officiis qui fugit voluptas maiores aliquid nobis minima corporis aspernatur, inventore cumque vitae!`
      }
    }
  })

  console.log(hh)
}


module.exports = class ConfigRoutes {

  // @desc      Get config
  // @route     GET /api/v1/config/get
  // @access    Private (Admin only)
  getConfig = asyncHandler(async (req, res, next) => {
    const config = await Config.findOne()
    res.json(config)
  })

  // @desc      Edit config
  // @route     PUT /api/v1/config/edit
  // @access    Private (Admin only)
  editConfig = asyncHandler(async (req, res, next) => {
    const config = await Config.findOne()
    config.landing.video.isVisible = JSON.parse(req.body["video.isVisible"])
    config.landing.text.isVisible = JSON.parse(req.body["text.isVisible"])
    config.landing.text.text = req.body["text.text"]

    if (req.files && req.files["video.video"]) {
      const video = req.files["video.video"]
      if (video.mimetype.split('/')[0] !== "video") return next(new ErrorResponse(`Bu format qo'llab quvvatlanmaydi!`, 400))
      if (video.name.split('.').last() !== "mp4") return next(new ErrorResponse(`Bu format qo'llab quvvatlanmaydi! Faqat .mp4 format qo'llab quvvatlanadi`, 400))

      fileService.deleteFiles([ config.landing.video.video ])
      config.landing.video.video = await fileService.uploadLandingVideo(video)
    }

    await config.save()
    res.status(200).json({
      success: true,
      data: config
    })
  })

}
