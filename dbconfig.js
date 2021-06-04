const mysql = require('mysql');

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: 'mytravelagency'
});
connection.connect(err => {
    if (err) throw err
    console.log("connected to mysql")
})

const query = (q, ...values) => {
    console.log(values)
    return new Promise((resolve, reject) => {
        connection.query(q, values, (err, results) => {
            if (err) {
                reject(err)
            } else {
                resolve(results)
            }
        })
    })
}


module.exports = {connection, query }