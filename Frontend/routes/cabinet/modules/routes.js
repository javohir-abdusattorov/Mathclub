const { Router } = require('express')
const router = Router()
const express = require('express')
const path = require('path')

router.use('/', express.static(path.join(__dirname, './modules')))
router.use('/:id', express.static(path.join(__dirname, './detail')))


router.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, 'modules/index.html'))
})

router.get("/:id", (req, res) => {
	res.sendFile(path.join(__dirname, './detail/index.html'))
})

module.exports = router