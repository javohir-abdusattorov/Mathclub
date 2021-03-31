
const User = require('../users/user.model')
const Module = require('../modules/module.model')
const Transaction = require('./transaction.model')

const ValidationService = require("../../utils/validationService")
const validation = new ValidationService()
const ModuleService = require("../modules/modules.service")
const moduleService = new ModuleService()

const transactionTimeout = +process.env.TRANSACTION_TIMEOUT


module.exports = class TransactionService {

  paycomAuthorization = (headers) => {
    if (!headers.authorization) return false
    const hdr = Buffer.from(`${headers.authorization.split(' ')[1]}`,'base64').toString('ascii').split(':')[1]
    if (process.env.PAYME_MERCHANT_KEY !== hdr) return false

    return true
  }

  // PAYCOM METHODS
  CheckPerformTransaction = async (body, date) => {
    const { module_id, user_id } = body.params.account
    const idValidation = await validation.validateUserAndModule(user_id, module_id, body)
    if (idValidation.error) return idValidation
    const { user, topicModule, userModule } = idValidation

    if (!userModule) return {
      result: null,
      error: {
        code: -31050,
        message: {
          ru: "Siz bu modulni sotib olmayapsiz",
          uz: "Siz bu modulni sotib olmayapsiz",
          en: "Siz bu modulni sotib olmayapsiz"
        },
        data: "notBuying"
      },
      id: body.id
    }

    if (userModule.paystate === 1) return {
      result: null,
      error: {
        code: -31060,
        message: {
          ru: "Boshqa transaction",
          uz: "Boshqa transaction",
          en: "Boshqa transaction"
        },
        data: "another"
      },
      id: body.id
    }

    if (userModule.paystate !== 0) return {
      result: null,
      error: {
        code: -31050,
        message: {
          ru: "Pul to'lab bo'lingan",
          uz: "Pul to'lab bo'lingan",
          en: "Pul to'lab bo'lingan"
        },
        data: "payedOrCanceled"
      },
      id: body.id
    }

    if (topicModule.price !== Math.floor(body.params.amount / 100)) return {
      result: null,
      error: {
        code: -31001,
        message: {
          ru: "Суммы не совпадают",
          uz: "Narxlar mos tushmayapti",
          en: "Prices are not equal"
        },
        data: "amount"
      },
      id: body.id
    }

    return {
      error: null,
      result: { allow : true }
    }
  }

  CreateTransaction = async (body, date) => {
    const params = body.params
    const { module_id, user_id } = params.account

    const transaction = await Transaction.findOne({ paycom_id: params.id })
    const idValidation = await validation.validateUserAndModule(user_id, module_id, body)
    if (idValidation.error) return idValidation
    const { user, userModule } = idValidation


    if (transaction) {
      if (transaction.paycom_state === '1' && userModule.paystate === 1) {
        const notTimeout = (date - transaction.paycom_create_time) / 1000 / 3600 < transactionTimeout

        if (notTimeout) return {
          error: null,
          result: {
            state: 1,
            create_time: transaction.paycom_create_time,
            transaction: transaction.module_id,
          },
          id: body.id
        }

        // Sotib olish otmen bo'ldi !
        transaction.paycom_state = '-1'
        transaction.paycom_reason = 4
        transaction.status = "canceled"
        await moduleService.userCancelBuyingModule(user, userModule)
        await transaction.save()

        return {
          result: null,
          error: {
            code: -31008,
            message: {
              ru: "Состояния транзакции не соответствует",
              uz: "Tranzaksiya otmen boldi",
              en: "Unexpected transaction state"
            },
            data: "unexpectedtrstate"
          },
          id: body.id
        }
      }

      return {
        result: null,
        error: {
          code: -31008,
          message: {
            ru: "Состояния транзакции не соответствует",
            uz: "Tranzaksiya holati mos emas",
            en: "Unexpected transaction state"
          },
          data: "unexpectedtrstate"
        },
        id: body.id
      }
    }

    const result = await this.CheckPerformTransaction(body, date)
    if (result.result) {

      // Pul to'lash boshlandi
      userModule.paystate = 1
      userModule.create_time = params.time
      await user.save()

      await Transaction.create({
        user_id,
        module_id,
        status: "waiting",
        paycom_state: "1",
        paycom_create_time: params.time,
        paycom_id: params.id,
        amount: Math.floor(params.amount / 100)
      })

      return {
        error: null,
        result: {
          create_time: +params.time,
          transaction: module_id,
          state: 1
        },
        id: body.id
      }
    }

    return result
  }

  PerformTransaction = async (body, date) => {
    const transaction = await Transaction.findOne({ paycom_id: body.params.id })

    if (!transaction) return {
      error: {
        code: -31003,
        message: {
          ru: 'Транзакция не найдена',
          uz: 'Tranzaktsiya topilmadi',
          en: 'Transaction not found'
        },
        data: null
      },
      result: null,
      id: body.id
    }

    const user = await User.findById(transaction.user_id)
    const userModule = user.buyingModules.find(item => item.module.toString() === transaction.module_id)

    if (transaction.paycom_state !== '1') {
      if (transaction.paycom_state !== '2') return {
        result: null,
        error: {
          code: -31008,
          message: {
            ru: "Невозможно выполнить данную операцию",
            uz: "Bu operatsiyani amalga oshirib bo'lmaydi",
            en: "Can not process this operation"
          }
        }
      }

      return {
        error: null,
        result: {
          perform_time: transaction.paycom_perform_time,
          transaction: transaction.module_id,
          state: 2
        },
        id: body.id
      }
    }

    const isTimeout = ((date - transaction.paycom_create_time) / 1000 / 3600) > transactionTimeout
    if (isTimeout) {
      // Sotib olish otmen bo'ldi !
      transaction.paycom_reason = 4
      transaction.paycom_state = -1
      transaction.status = "canceled"
      await moduleService.userCancelBuyingModule(user, userModule)
      await transaction.save()

      return {
        result: null,
        error: {
          code: -31008,
          message: {
            ru: "Невозможно выполнить данную операцию",
            uz: "Bu operatsiyani amalga oshirib bo'lmaydi",
            en: "Can not process this operation"
          }
        }
      }
    }

    // Modul sotib olindi !
    transaction.status = 2
    transaction.paycom_state = 2
    transaction.paycom_perform_time = date
    await moduleService.userBoughtModule(user, userModule)
    await transaction.save()

    return {
      error: null,
      result: {
        perform_time: date,
        transaction: transaction.module_id,
        state: 2
      },
      id: body.id
    }
  }

  CancelTransaction = async (body, date) => {
    const transaction = await Transaction.findOne({ paycom_id: body.params.id })
    if (!transaction) return {
      error: {
        code: -31003,
        message: {
          ru: 'Транзакция не найдена',
          uz: 'Tranzaktsiya topilmadi',
          en: 'Transaction not found'
        }
      },
      result: null,
      id: body.id
    }

    const user = await User.findById(transaction.user_id)
    const userModule = user.buyingModules.find(item => item.module.toString() === transaction.module_id)

    if (transaction.paycom_state === '1') {
      // Sotib olish otmen bo'ldi
      transaction.paycom_state = -1
      transaction.status = "canceled"
      transaction.paycom_reason = body.params.reason
      transaction.paycom_cancel_time = date
      await moduleService.userCancelBuyingModule(user, userModule)
      await transaction.save()

      return {
        error: null,
        result: {
          cancel_time: transaction.paycom_cancel_time,
          transaction: transaction.module_id,
          state: -1,
        },
        id: body.id
      }
    }

    // Sotib olgandan keyin otmen bo'ldi
    if (transaction.paycom_state === '2') return {
      error: {
        code: -31003,
        message: {
          ru: 'Modul sotib olingan, sotib olingandan keyin bekor qilib bo\'lmaydi',
          uz: 'Modul sotib olingan, sotib olingandan keyin bekor qilib bo\'lmaydi',
          en: 'Modul sotib olingan, sotib olingandan keyin bekor qilib bo\'lmaydi'
        }
      },
      result: null,
      id: body.id
    }

    return {
      error: null,
      result: {
        cancel_time: transaction.paycom_cancel_time,
        transaction: transaction.module_id,
        state: +transaction.paycom_state,
      },
      id: body.id
    }
  }

  CheckTransaction = async (body, date) => {
    const transaction = await Transaction.findOne({ paycom_id: body.params.id })
    if (!transaction) return {
      error: {
        code: -31003,
        message: {
          ru: 'Транзакция не найдена',
          uz: 'Tranzaktsiya topilmadi',
          en: 'Transaction not found'
        }
      },
      result: null,
      id: body.id
    }

    return {
      error: null,
      result: {
        create_time: transaction.paycom_create_time,
        perform_time: transaction.paycom_perform_time,
        cancel_time: transaction.paycom_cancel_time ? transaction.paycom_cancel_time : 0,
        transaction: transaction.module_id,
        state: +transaction.paycom_state,
        reason: +transaction.paycom_reason
      },
      id: body.id
    }
  }

  GetStatement = async (body, date) => {
    const transactions = await Transaction.find({
      paycom_create_time: {
        $gte: body.params.from,
        $lte: body.params.to
      }
    })
    return { result: { transactions } }
  }


}
