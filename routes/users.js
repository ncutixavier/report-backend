const express = require('express')
const { User } = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const router = express.Router()
const protectRoute = require('../helpers/protectRoutes')

router.get('/', protectRoute.protect, protectRoute.restrictTo('admin'), async (req, res) => {
    const user_list = await User.find().select('-passwordHash')
    if (!user_list) {
        res.status(500).json({
            success: 'false'
        })
    }
    res.status(200).send(user_list)
})

router.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash')
    if (!user) {
        return res.status(500).json({
            message: 'user is no longer existed'
        })
    }
    res.status(200).send(user)
})

router.post('/', async (req, res) => {
    const exist_user = await User.findOne({ email: req.body.email })
    if (exist_user) {
        return res.status(400).json({
            message: 'user is already exist'
        })
    }
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        role: req.body.role
    })

    user = await user.save()
    if (!user) {
        return res.status(404).send('The user cannot be created')
    }
    res.send(user)
})

router.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return res.status(400).json({
            message: 'user is not found'
        })
    }
    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign({
            id: user.id,
            role: user.role
        }, process.env.SECRET, { expiresIn: '1d' })
        return res.status(200).json({
            token,
            user
        })
    } else {
        return res.status(400).send('Password is wrong!')
    }
})

router.delete('/:id', (req, res) => {
    User.findByIdAndRemove(req.params.id)
        .then(user => {
            if (user) {
                return res.status(200).json({
                    message: 'user is deleted'
                })
            } else {
                return res.status(404).json({
                    message: 'user not found'
                })
            }
        })
        .catch(err => {
            return res.status(400).json({
                message: 'user not existed'
            })
        })
})

router.get('/get/count', async (req, res) => {
    const count_users = await User.countDocuments(count => count)
    if (!count_users) {
        res.status(500).json({
            success: 'false'
        })
    }
    res.send({
        count_users: count_users
    })
})

module.exports = router
