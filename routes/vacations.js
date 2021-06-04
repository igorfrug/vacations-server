const router = require('express').Router()

const { query } = require('../dbconfig')
const { RT, staffOnly } = require('../vt');




////////////////////////////////////////////////////////////////////////////////

router.get('/all/:id', RT, async (req, res) => {
    console.log("all",req.params.id)
    try {

        const selectFollowed_q = `SELECT * FROM followeddestinations WHERE user_id=?`
        const selectFollowed = await query(selectFollowed_q, req.params.id)
        console.log('selectFollowed', selectFollowed)
        const selectID = selectFollowed.map(sf => sf.destination_id)
        console.log(selectID.toString())
        if (selectID.length > 0) {
            q = `SELECT * FROM destinations WHERE id NOT IN (${selectID.toString()})`
            const destinations = await query(q)

            res.status(201).json({ err: false, destinations: destinations });
            console.log("final", destinations)
        } else {
            const q = `SELECT * FROM destinations`
            const destinations = await query(q)
            res.status(201).json({ err: false, destinations: destinations })
            console.log('2', destinations)
        }
    } catch (err) {
        res.status(500).json({ err: true, err })
        console.log(err)
    }
});

router.get('/followed/:userid', RT, async (req, res) => {
    try {
        const q = `SELECT  followedDestinations.*,destinations.followers FROM followeddestinations INNER JOIN destinations ON followeddestinations.destination_id=destinations.id WHERE followeddestinations.user_id=?`
        const myDestinations = await query(q, req.params.userid);
        res.status(201).json({ err: false, myDestinations });
        console.log('my destinations', myDestinations)
    } catch (err) {
        res.status(500).json({ err: true, err })
        console.log(err)
    }
});
router.post('/follow', RT, async (req, res) => {
    let { destinationId, image, name, price, startsFrom, endsAt, followers, moreInfo, userId } = req.body
    console.log('e p r s t', req.body)

    try {
        const select_q = `SELECT followers,followed FROM destinations WHERE id = ?`

        followers = await query(select_q, destinationId)
        const updatedFollowers = followers[0].followers + 1
        console.log("followers", followers, updatedFollowers)
        const update_q = `UPDATE destinations SET followers=?,followed=1 WHERE id = ?`
        const updatedDestination = await query(update_q, updatedFollowers, destinationId)
        const select_Q = `SELECT * FROM destinations `
        const selectedDestination = await query(select_Q, destinationId)
        console.log('selectedDestination', selectedDestination)
        console.log(updatedDestination, "updated destinations")
        const insert_query = `INSERT INTO followeddestinations  (destination_id,image, name, price, starts_from, ends_at,  more_info,user_id)
             VALUES(?,?,?,?,?,?,?,?)`
        await query(insert_query, destinationId, image, name, price, startsFrom, endsAt, moreInfo, userId);


        const select_query = `SELECT followeddestinations.*,destinations.followers FROM followeddestinations INNER JOIN destinations ON followeddestinations.destination_id=destinations.id WHERE followeddestinations.user_id=?`
        const followedDestinations = await query(select_query, userId)
        res.status(201).json({ followedDestinations });
        console.log('followedDestinations', followedDestinations)
    } catch (err) {
        console.log(err)
        res.status(500).json({ err: true, msg: err })
    }
});
router.delete('/:userid', RT, async (req, res) => {
    const { userid } = req.params
    const { id, destination_id } = req.body

    try {
        console.log('pizdec', req.params.userid, req.body.id, req.body.destination_id)
        const select_q = `SELECT followers FROM destinations WHERE id =?`
        followers = await query(select_q, destination_id)
        const updatedFollowers = followers[0].followers - 1
        console.log("followers", followers, updatedFollowers)
        const delete_q = `DELETE FROM followeddestinations WHERE user_id = ? AND id = ?`
        await query(delete_q, req.params.userid, req.body.id)
        const update_q = `UPDATE destinations SET followers = "${updatedFollowers}" WHERE destinations.id=?`
        await query(update_q, destination_id,)
        const select_q2 = `SELECT followers FROM destinations WHERE id = ?`
        const zeroFollowers = await query(select_q, destination_id)
        console.log('zeroFollowers', zeroFollowers[0].followers)
        if (zeroFollowers[0].followers === 0) {
            const updateFollows_q = `UPDATE destinations SET followed=0  WHERE id = ?`
            await query(updateFollows_q, destination_id)
            const select_qr = 'SELECT followed FROM destinations'
            const updateFollows = await query(select_qr)
            console.log('updateFollows', updateFollows)
        }
        const select_q1 = `SELECT followeddestinations.*,destinations.followers FROM followeddestinations INNER JOIN destinations ON followeddestinations.destination_id=destinations.id WHERE followeddestinations.user_id=?`
        const followedDestinations = await query(select_q1, req.params.userid)
        res.json({ err: false, followedDestinations })
        console.log('followedDestinations', followedDestinations)
    } catch (error) {
        res.status(500).json({ err: true, error })
    }
});

////////////////////////////////////////A D M I N////////////////////////////////////////////////////////////////////////////////
router.get('/admin', RT, staffOnly, async (req, res) => {
    const token = req.token;
    try {
        const q = `SELECT * FROM destinations`
        const destinations = await query(q)
        res.status(201).json({ err: false, destinations })
        console.log(destinations)
    } catch (err) {
        res.status(500).json({ err: true, err })
        console.log(err)
    }
});
router.get('/followed', RT, staffOnly, async (req, res) => {
    const token = req.token;
    try {
        const q = `SELECT * FROM destinations WHERE followed=1`
        const myDestinations = await query(q);
        res.status(201).json({ err: false, myDestinations, token });
        console.log('my destinations', myDestinations)
    } catch (err) {
        res.status(500).json({ err: true, err })
        console.log(err)
    }
});

router.post('/add', RT, staffOnly, async (req, res) => {
    const token = req.token;
    const { image, name, price, startsFrom, endsAt, followers, moreInfo } = req.body
    console.log(image, name, price, startsFrom, endsAt, followers, moreInfo)

    try {
        const insert_query = `INSERT INTO destinations(image, name, price, starts_from, ends_at, followers, more_info)
                    VALUES(?,?,?,?,?,?,?)`
        const select_query = `SELECT * FROM destinations`
        await query(insert_query, image, name, price, startsFrom, endsAt, moreInfo, userId)
        const newDestination = await query(select_query)
        res.status(201).json({ err: false, newDestination, token })
        console.log(newDestination)
    } catch (err) {
        console.log(err)
        res.status(500).json({ err: true, msg: err })
    }
});
router.put('/edit/admin/:id', RT, staffOnly, async (req, res) => {
    const token = req.token;
    console.log("hey")
    let { id } = req.params.id
    let { image, name, price, startsFrom, endsAt, followers, moreInfo } = req.body

    try {
        const update_query = `UPDATE destinations SET image = ?, name = ?, price = ?, starts_from = ?, ends_at = ?, followers = ?, more_info = ?
                    WHERE id = ?`
        const update_query1 = `UPDATE followeddestinations SET image = ?, name = ?, price = "${price}", starts_from = ?, ends_at =?, followers = ?, more_info = ?
                    WHERE destination_id = ?`

        const select_query = `SELECT * FROM destinations WHERE id = ?`
        await query(update_query, image, name, price, startsFrom, endsAt, moreInfo, userId, req.params.id)
        await query(update_query1, image, name, price, startsFrom, endsAt, moreInfo, userId, req.params.id)
        const updatedDestination = await query(select_query, req.params.id)
        res.status(201).json({ updatedDestination: updatedDestination[0], token })
        console.log('upd-d', updatedDestination)
    } catch (err) {
        console.log(err)
        res.status(500).json({ err: true, msg: err })
    }
});
router.delete('/delete/admin/:id', RT, staffOnly, async (req, res) => {
    const token = req.token;
    try {
        console.log(req.params.id)
        const delete_q = `DELETE FROM destinations WHERE id = ?`
        await query(delete_q, req.params.id)
        console.log('delete')
        const select_q = `SELECT * FROM destinations`
        const destinations = await query(select_q)
        res.status(201).json({ err: false, destinations, token })
        console.log(destinations)
    } catch (error) {
        res.status(500).json({ err: true, error })
    }
});
module.exports = router