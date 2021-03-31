
const ErrorResponse = require('../../utils/errorResponse')
const asyncHandler = require('../../middleware/async')

const Transaction = require('./transaction.model')

const Service = require("./transactions.service")
const service = new Service()


module.exports = class TransactionRoutes {

  // @desc      Get all transactions
  // @route     GET /api/v1/transactions/all
  // @access    Public
  getAllTransactions = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults)
  })

  // @desc      Endpoint for Payme
	// @route     POST /api/v1/transactions/payme
	// @access    Public
  payme = asyncHandler(async (req, res, next) => {
    const body = req.body
    const { method } = body
    const date = new Date().getTime()
    const authResult = service.paycomAuthorization(req.headers)

    if (!authResult) return res.status(200).send({
      "result": null,
      "error": {
        "code": -32504,
        "message": {
          "ru": "Неверная авторизация",
          "uz": "Avtorizatsiyada xatolik",
          "en": "Wrong Authorization",
        },
        "data": req.body.id,
        "id": req.body.id,
      }
    })


    if (method === 'CheckPerformTransaction') {
      const result = await service.CheckPerformTransaction(body, date)
      res.status(200).send(result)
    }

    else if (method === 'CreateTransaction') {
      const result = await service.CreateTransaction(body, date)
      res.status(200).send(result)
    }

    else if (method === 'PerformTransaction') {
      const result = await service.PerformTransaction(body, date)
      res.status(200).send(result)
    }

    else if (method === 'CancelTransaction') {
      const result = await service.CancelTransaction(body, date)
      res.status(200).send(result)
    }

    else if (method === 'CheckTransaction') {
      const result = await service.CheckTransaction(body, date)
      res.status(200).send(result)
    }

    else if (method === 'GetStatement') {
      const result = await service.GetStatement(body, date)
      res.status(200).send(result)
    }

    else res.sendStatus(404)

  })
}