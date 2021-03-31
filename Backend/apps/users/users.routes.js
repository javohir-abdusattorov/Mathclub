
const ErrorResponse = require('../../utils/errorResponse')
const asyncHandler = require('../../middleware/async')

const User = require("./user.model")

const ValidationService = require("../../utils/validationService")
const validation = new ValidationService()

const Service = require("./users.service")
const service = new Service()


module.exports = class UserRoutes {

  // @desc      Get all users
  // @route     GET /api/v1/users/all
  // @access    Public
  getAllUsers = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults)
  })

  // @desc      Edit user
  // @route     PUT /api/v1/users/edit
  // @access    Private
  editUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id).select("+password")
    const result = await service.editUser(user, ["name", "email", "phoneNumber"], req.body)
    if (result.error) return next(new ErrorResponse(result.message, 401))

    res.status(200).json({
      success: true,
      data: result.data
    })
  })

}
