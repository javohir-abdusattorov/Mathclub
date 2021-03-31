
const clock = require('date-events')()

const Module = require('./module.model')
const User = require('../users/user.model')
const Transaction = require('../transactions/transaction.model')

const paymeRequestUrl = process.env.PAYME_REQUEST_URL
const merchantID = process.env.PAYME_MERCHANT_ID
const transactionTimeout = +process.env.TRANSACTION_TIMEOUT


class ModuleService {

  paymeRedirectUrl = (userID, topicModule) => {
    const options = `m=${merchantID};ac.user_id=${userID};ac.module_id=${topicModule._id};a=${topicModule.price * 100};c=https://mathclub-frontend.herokuapp.com/cabinet/modules;l=uz`
    return paymeRequestUrl + Buffer.from(options).toString("base64")
  }

  removeModuleFromUsers = async (moduleID) => {
    const allUsers = await User.find()
    for (const user of allUsers) {
      const hasModule = user.modules.findIndex(item => item.module.toString() === moduleID)
      const buyingModule = user.buyingModules.findIndex(item => item.module.toString() === moduleID)
      if (hasModule >= 0) user.modules.splice(hasModule, 1)
      if (buyingModule >= 0) user.buyingModules.splice(buyingModule, 1)

      await user.save()
    }
  }

  userBoughtModule = async (user, userModule) => {
    user.modules.push({ name: userModule.name, module: userModule.module, })
    userModule.paystate = 2
    await Module.updateOne({ _id: userModule.module }, { $inc: { sold: 1 } })
    await user.save()
  }

  userCancelBuyingModule = async (user, userModule) => {
    user.buyingModules.splice(user.buyingModules.indexOf(userModule), 1)
    const i = user.modules.findIndex(item => item.module.toString() === userModule.module.toString())
    if (i >= 0) user.modules.splice(i, 1)

    await user.save()
  }

}

const moduleService = new ModuleService()
module.exports = ModuleService

clock.on("minute", async () => {
  const date = new Date().getTime()
  const all = await Transaction.find({ $or: [
    { paycom_state: "0" },
    { paycom_state: "1" },
  ]})

  for (const transaction of all) {
    const isTimeout = ((date - transaction.paycom_create_time) / 1000 / 3600) > transactionTimeout
    if (isTimeout) {
      const user = await User.findById(transaction.user_id)
      const userModule = user.buyingModules.find(item => item.module.toString() === transaction.module_id)

      transaction.paycom_state = '-1'
      transaction.paycom_reason = 4
      transaction.status = "canceled"
      await moduleService.userCancelBuyingModule(user, userModule)
      await transaction.save()

      console.log(transaction.user_id, transaction.module_id);
      console.log(`FUCKED UP`);
    }
  }
})
