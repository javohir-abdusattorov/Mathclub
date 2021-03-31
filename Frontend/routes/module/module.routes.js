const { Router } = require('express')
const router = Router()
const express = require('express')
const path = require('path')

router.use('/preview/:id', express.static(path.join(__dirname, 'detail')))

router.get("/preview/:id", (req, res) => {
	res.sendFile(path.join(__dirname, 'detail/index.html'))
})

module.exports = router