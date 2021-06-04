const { json } = require('express');
const jwt = require('jsonwebtoken');
const jwt_decode = require('jwt-decode')
const { query } = require('./dbconfig')


const RT = async (req, res,next) => {
    const token = req.headers['x-access_token']
    const decoded = jwt_decode(token)
    console.log("decoded", decoded)
    const refresh_token = req.headers['refresh_token']
    const refresh_decoded = jwt_decode(refresh_token)
    console.log("refresh_decoded", refresh_decoded)
    console.log("uyty")
    if (Date.now() / 1000 < decoded.exp) {
        console.log("hey hey")
        if (!token) return res.status(401).json('Please log in')
        jwt.verify(token, "pizdec", async (err, payload) => {
            if(err)return res.status(401).json("Please log in")
        console.log('payload', payload)
        req.user = payload
        console.log("VT OK!")
        next()
    })
    } else if  (Date.now() / 1000 > decoded.exp && Date.now() / 1000 < refresh_decoded.exp){
        console.log("bubu",decoded.id)
        try {
            const select_query = `SELECT id,role,username,password,signedIn FROM users WHERE id="${decoded.id}"`
            console.log("hey")
            const user = await query(select_query)
            console.log(user, "user from sql")
            if (!user) return res.status(401).json({ err: true, msg: "user not found" })
            const access_token = jwt.sign({ ...user[0], password: "****" }, "pizdec", {
                expiresIn: "3m"
            })
            const signedIn_q = `UPDATE users SET access_token="${access_token}"   WHERE id="${user[0].id}"`
            await query(signedIn_q);
            const refreshedUser_q = `SELECT * FROM users WHERE id = "${user[0].id}"`


            const refreshedUser = await query(refreshedUser_q)
            console.log('refreshed',refreshedUser[0]);

            res.status(200).json({ err: false, refreshedUser: refreshedUser[0] })
        } catch (err) {
            console.log(err)
            res.status(500).json({ err: true, msg: err })
        }
    }else{
        console.log("RT error")
        res.status(401).json("Please log in")
    }

}



const staffOnly = (req, res, next) => {
    const token = req.headers['x-access_token']
    console.log('token', token)
    jwt.verify(token, "pizdec", (err, payload) => {
        console.log("staffOnly", payload)
        if (err) return res.status(401).json("authentification failed")
        if (payload.role !== 'admin') return res.status(403).json("You are not supposed to be here!")
        req.user = payload
        console.log("Staff Only OK!")
        next()
    })
}
module.exports = { RT, staffOnly }