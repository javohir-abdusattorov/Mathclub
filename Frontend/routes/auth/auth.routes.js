const { Router } = require('express')
const router = Router()
const express = require('express')
const path = require('path')

router.use('/login', express.static(path.join(__dirname, 'login')))
router.use('/register', express.static(path.join(__dirname, 'register')))

router.get("/login", (req, res) => {
	res.sendFile(path.join(__dirname, 'login/index.html'))
})

router.get("/register", (req, res) => {
	res.sendFile(path.join(__dirname, 'register/index.html'))
})

module.exports = router