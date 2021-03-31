
const User = require('../apps/users/user.model');
const Module = require('../apps/modules/module.model');


module.exports = class Validation {

	validateWaterfall = async (...validations) => {
		let lastResult = []
		for (let result of validations) {
			if (!result.success) {
				return {
					success: false,
					message: result.message
				}
			} else {
				if (result.data) lastResult.push(result.data)
			}
		}
		return { success: true, data: lastResult }
	}

	validateID = async (Model, id, name) => {
	  if(!id || typeof(id) !== "string" || id.length !== 24) return { success: false, message: `Invalid ID` }
	  let item = await Model.findById(id)
	  if (!item) return { success: false, message: `${name} not found with this ID` }
	  return { success: true, data: item }
	}

	validateUserID = async (id) => await this.validateID(User, id, "User")

	validateModuleID = async (id) => await this.validateID(Module, id, "Module")

	validateType = (item, type) => {
		if (type == "string") {
			if (typeof(item) !== "string") return false
		}
		else if (type == "number") {
			if (typeof(item) !== "number") return false
		}
		else if (type == "boolean") {
			if (typeof(item) !== "boolean") return false
		}
		else if (type == "object") {
			if (typeof(item) !== "object") return false
		}
		else if (type == "array") {
			if (!Array.isArray(item)) return false
		}

		return true
	}

	validateBody = (body, requirements) => {
		if (!body) return { success: false, message: `Invalid data: Don't have body!` }

		for  (let item of requirements) {
			if (item.type !== "boolean" && !body[item.name]) return { success: false, message: `Invalid data: '${item.name}' is required` }

			if (item.type == "number" && !this.validateType(body[item.name], item.type)) body[item.name] = +body[item.name]
			if (item.type == "array" && !this.validateType(body[item.name], item.type)) body[item.name] = JSON.parse(body[item.name])
			if (item.type == "object" && !this.validateType(body[item.name], item.type)) body[item.name] = JSON.parse(body[item.name])

			if (!this.validateType(body[item.name], item.type)) return { success: false, message: `Invalid data: '${item.name}' must be ${item.type}` }
		}

		return { success: true }
	}

  validateUserAndModule = async (user_id, module_id, body) => {
    const moduleResult = await this.validateModuleID(module_id)
    const userResult = await this.validateUserID(user_id)

    if (!moduleResult.success || !userResult.success) return {
      result: null,
      error: {
        code: -31050,
        message: {
          ru: "Module yoki foydalanuvchi topilmadi",
          uz: "Module yoki foydalanuvchi topilmadi",
          en: "Module yoki foydalanuvchi topilmadi"
        },
        data: "notFound"
      },
      id: body.id
    }

    const user = userResult.data
    const topicModule = moduleResult.data
    const userModule = user.buyingModules.find(item => item.module.toString() === module_id)

    return { user, topicModule, userModule }
  }

}