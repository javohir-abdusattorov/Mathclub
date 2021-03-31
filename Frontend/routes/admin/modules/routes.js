const { Router } = require('express')
const router = Router()
const express = require('express')
const path = require('path')

router.use('/', express.static(path.join(__dirname, './modules')))
router.use('/:moduleID', express.static(path.join(__dirname, './topics')))
router.use('/:moduleID/:topicID', express.static(path.join(__dirname, './lessons')))


router.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, 'modules/index.html'))
})

router.get("/:moduleID", (req, res) => {
	res.sendFile(path.join(__dirname, './topics/index.html'))
})

router.get("/:moduleID/:topicID", (req, res) => {
	res.sendFile(path.join(__dirname, './lessons/index.html'))
})

module.exports = router