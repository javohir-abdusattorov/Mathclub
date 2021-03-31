
const bcrypt = require('bcryptjs')
const User = require("./user.model")


module.exports = class UsersService {

	editUser = async (user, fields, body) => {
    if (!body) return { error: true, message: `Xato so'rov yuborildi` }

    const updatingObj = {}
    for (const field of fields) if (field in body) updatingObj[field] = body[field]

    if (body.oldPassword && body.newPassword && body.newPassword !== body.oldPassword) {
      const isMatch = await user.matchPassword(body.oldPassword)
      if (!isMatch) return { error: true, message: `Noto'g'ri parol` }

      const salt = await bcrypt.genSalt(10)
      updatingObj.password = await bcrypt.hash(body.newPassword, salt)
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      updatingObj,
      { new: true, runValidators: true }
    )

    return { error: false, data: updatedUser }
	}
}
