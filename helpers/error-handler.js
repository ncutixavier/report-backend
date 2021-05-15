function errorHandler(err, req, res, next) {
    if (err.name === "UnauthorizedError") {
        return res.status(401).json({
            message: "User is not authorized"
        })
    }

    if (err.name === "JsonWebTokenError") {
        return res.status(400).json({
            message: "Login again to access"
        })
    }

    return res.status(500).json(err)
}

module.exports = errorHandler
