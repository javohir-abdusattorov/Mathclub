const { Router } = require('express')
const router = Router()
const Transaction = require('./transaction.model')
const Routes = require('./transactions.routes')
const routes = new Routes()

const advancedResults = require('../../middleware/advancedResults')


router.get('/all', advancedResults(Transaction), routes.getAllTransactions)
router.post('/payme', routes.payme)

module.exports = router