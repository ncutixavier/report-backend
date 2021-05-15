const jwt = require('jsonwebtoken')
const { User } = require('../models/user')

exports.protect = async (req, res, next) => {

    let token
    if (req.headers.authorization) {
        token = req.headers.authorization
    }
    if (!token) {
        return next(
            res.status(401).json({
                message: "Please login to get access"
            })
        )

    }

    try {
        const decoded = await jwt.verify(token, process.env.SECRET)

        const freshUser = await User.findById(decoded.id)
        req.user = freshUser

    } catch (error) {
        console.log(error)
        return next(
            res.status(403).json({
                message: "Login to get access"
            })
        )
    }
    next()
}

//restrict to ...
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                res.status(403).json({
                    message: "You are not allowed to access!"
                })
            )
        }
        next()
    }
}
