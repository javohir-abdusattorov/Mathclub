const path = require('path')
const express = require('express')
const cors = require('cors')
const app = express()

// Load dev middlewares
if(process.env.NODE_ENV === 'development') app.use(morgan('dev'))

// Enable CORS
app.use(cors())

// Set static folder
app.use(express.static(path.join(__dirname, 'routes/main')))
app.use('/assets', express.static(path.join(__dirname, 'assets')))

// Registr routes
app.use('/auth', require('./routes/auth/auth.routes'))
app.use('/module', require('./routes/module/module.routes'))
app.use('/mathclub-admin', require('./routes/admin/admin.routes'))
app.use('/cabinet', require('./routes/cabinet/cabinet.routes'))
app.use('/contact', require('./routes/contacts/contacts.routes'))

const PORT = 80

const server = app.listen(PORT, () => {
  console.log(`Frontend running on port ${PORT}`)
})
