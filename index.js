const express = require('express');
const app = express();

const cors = require('cors')

require('./dbconfig')

app.use(express.json())
app.use(cors())

app.use('/auth', require('./routes/auth'))
app.use('/vacations', require('./routes/vacations'))

app.listen(process.env.PORT || 1110, () => console.log("1110 OK"))