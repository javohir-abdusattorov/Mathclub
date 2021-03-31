
const path = require('path')
const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const morgan = require('morgan')
const fileupload = require('express-fileupload')
const errorHandler = require('./middleware/error')
const colors = require('colors')
const connectDB = require('./config/db')

//Load env vars
dotenv.config({ path: './config/config.env' })

// Connect to Database
connectDB()

const app = express()

// Body Parser
app.use(express.json())

// Load dev middlewares
if(process.env.NODE_ENV === 'development') app.use(morgan('dev'))

// File Upload
app.use(fileupload())

// Enable CORS
app.use(cors())

// Set static folder
app.use(express.static(path.join(__dirname, 'public/landing-video')))

// Register routes
app.use('/api/v1/auth', require('./apps/auth/auth.controller'))
app.use('/api/v1/modules', require('./apps/modules/modules.controller'))
app.use('/api/v1/users', require('./apps/users/users.controller'))
app.use('/api/v1/config', require('./apps/config/config.controller'))
app.use('/api/v1/transactions', require('./apps/transactions/transactions.controller'))

// Error handling
app.use(errorHandler)

// Running server
const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.white.bold)
})