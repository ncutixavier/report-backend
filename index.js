const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const authJwt = require('./helpers/jwt')
const errorHandler = require('./helpers/error-handler')
const cors = require('cors')

require('dotenv').config()
const app = express()

app.use(cors())
app.options('*', cors())

app.get('/', (req, res) => {
    res.send("This is report backend")
})

app.use(bodyParser.json())
app.use(morgan('tiny'))
// app.use(authJwt())
app.use(errorHandler)

const user_routes = require('./routes/users')
const report_routes = require('./routes/reports')

app.use('/api/v1/users', user_routes)
app.use('/api/v1/reports', report_routes)

app.use('/public/reports', express.static(__dirname + '/public/reports'))

mongoose.connect(process.env.CON, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    dbName: 'report'
})
    .then(() => console.log('DB Connected!'))
    .catch(err => console.log(err))

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})
