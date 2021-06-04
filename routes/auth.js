const router = require('express').Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const { query } = require('../dbconfig');



router.post('/register', async (req, res) => {

    let { name, surname, role, username, password } = req.body;
    console.log(req.body);
    if (!name || !surname || !username || !password) return res.status(400).
        json({
            err: true,
            msg: "Please,provide all the information needed"
        });
    try {
        const select_query = `SELECT * from users`
        console.log("hey")
        const users = await query(select_query)
        const user = users.find(user => user.username == username)
        console.log(users)
        const adminUser = { name: 'Igor', surname: 'Frug', username: 'travelFrog', password: 'travelFrogAdmin' }
        if (user) return res.status(401).json({ err: true, msg: "The username is taken" })
        if (req.body.username === adminUser.username && req.body.password === adminUser.password) {
            role = 'admin'
        } else {
            role = 'guest'
        }
        const hash = await bcrypt.hash(password, 10)
        const insert_query = `INSERT INTO users ( name, sur_name, role, username, password)
        VALUES ("${name}","${surname}","${role}","${username}","${hash}")`
        // const insert_query = `INSERT INTO users ( name, sur_name, role, username, password)
        // VALUES("?", "?", "?", "?", "?")`
        await query(insert_query)
        const select_updatedquery = `SELECT * from users`
        const updatedUsers = await query(select_updatedquery)
        res.status(201).json(updatedUsers)
        console.log(updatedUsers)
    } catch (err) {
        console.log(err)
        res.status(500).json({ err: true, msg: err })
    }
});
router.get('/secret/:id', async (req, res) => {
    console.log(req.params.id)
    const token = req.token;
    try {
        const q = `SELECT * FROM users WHERE id = "${req.params.id}"`
        const authedUser = await query(q)
        res.status(201).json(authedUser)
        console.log(authedUser)
    } catch (err) {
        console.log(err, err.msg)
    }

})

router.put('/login', async (req, res) => {
    const { username, password } = req.body
    console.log(username, password)
    if (!username || !password) return res.status(400).
        json({
            err: true,
            msg: "Please,provide all the information needed"
        })
    try {
        const select_query = `SELECT id, role, username, password, signedIn FROM users WHERE username = ?`
        
        const user = await query(select_query,username)
        console.log(user, "user from sql")
        if (!user) return res.status(401).json({ err: true, msg: "user not found" })
        const match = await bcrypt.compare(password, user[0].password);
        console.log(password, user[0].password, match)
        if (!match) return res.status(403).json({ err: true, msg: "wrong password" })

        const access_token = jwt.sign({ ...user[0], password: "****" }, "pizdec", {
            expiresIn: "3m"
        })

        const refresh_token = jwt.sign({ id: user[0].id, role: user[0].role }, "blah", {
            expiresIn: "10m"
        })
        console.log('userID', user[0].id)
        console.log('user role', user[0].role)

        if (!user[0].connectedDevices) {
            user[0].connectedDevices = [refresh_token]
            console.log(user[0].connectedDevices)
            console.log(user[0])
        } else {
            user.connectedDevices.push(refresh_token)
        }
        const signedIn_q = `UPDATE users SET signedIn = 1, role = "${user[0].role}", access_token = "${access_token}", refresh_token = "${refresh_token}", connected_devices = "${user[0].connectedDevices}"   WHERE username = "${user[0].username}"`
        await query(signedIn_q);
        console.log(signedIn_q)
        const signedInUser_q = `SELECT * FROM users WHERE username = ?`

        const signedInUser = await query(signedInUser_q,user[0].username)

        console.log('signed',signedInUser);

        res.status(200).json(signedInUser)
    } catch (err) {
        console.log(err)
        res.status(500).json({ err: true, msg: err })
    }

});
router.put('/logout', async (req, res) => {
    const { storedToken } = req.body
    console.log("logout", req.body)
    try {
        const q = `SELECT * FROM users WHERE id = ?"`
        const signedUser = await query(q,storedToken.id)
        console.log("signedUser", signedUser)
        const update_q = `UPDATE users SET signedIn = 0, access_token = null, refresh_token = null, connected_devices = null WHERE id = "${signedUser[0].id}"`

        let almostSignedUser = await query(update_q)
        console.log("almost signedout", almostSignedUser)
        const select_q = `SELECT * FROM users WHERE id = ?`

        const signedOutUser = await query(select_q,signedUser[0].id)
        console.log("signedOutUser", signedOutUser)
        res.status(201).json(signedOutUser)

        console.log("signedOutUser", signedOutUser)

    } catch (err) {
        res.status(500).json(err)
    }
});





module.exports = router