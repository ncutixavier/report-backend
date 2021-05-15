const express = require('express')
const { Report } = require('../models/report')
const { User } = require('../models/user')
const mongoose = require('mongoose')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')
const getTodayDate = require('../helpers/getTodayDate')
const protectRoute = require('../helpers/protectRoutes')

console.log(getTodayDate())

const FILE_TYPE_MAP = {
    'application/pdf': 'pdf'
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let upload_error = new Error('Invalid file type')
        if (isValid) {
            upload_error = null
        }
        cb(upload_error, 'public/reports')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('_')
        const extension = FILE_TYPE_MAP[file.mimetype]
        cb(null, `${fileName}_${Date.now()}.${extension}`)
    }
})

const uploadOptions = multer({ storage: storage })

router.get('/', protectRoute.protect, async (req, res) => {
    let filter = {}
    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') }
    }
    const report_list = await Report.find().populate('user')
    if (!report_list) {
        res.status(500).json({
            success: 'false'
        })
    }
    res.send(report_list)
})

router.get('/:id', protectRoute.protect, async (req, res) => {
    const report = await Report.findById(req.params.id).populate('user')
    if (!report) {
        return res.status(404).json({
            message: 'report is no longer existed'
        })
    }
    res.status(200).send(report)
})

router.post('/',
    uploadOptions.single('report_file'),
    protectRoute.protect,
    protectRoute.restrictTo('admin'),
    async (req, res) => {
        let user = await User.findById(req.body.user)
        if (!user)
            return res.status(400).send('Invalid user')

        let file = req.file
        if (!file)
            return res.status(400).send('Report file is required!')

        const file_name = req.file.filename
        const base_path = `${req.protocol}://${req.get('host')}/public/reports/`
        let report = new Report({
            title: `${req.body.title || "Report"}_${getTodayDate().split(' ').join('_')}`,
            comment: req.body.comment,
            report_file: `${base_path}${file_name}`,
            user: req.body.user,
        })
        report = await report.save()
        if (!report)
            return res.status(400).send('Report cannot be created')
        res.send(report)
    })

router.put('/:id',
    uploadOptions.single('report_file'),
    protectRoute.protect,
    protectRoute.restrictTo('admin'),
    async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Report is no longer existed')
    }

    let user = await User.findById(req.body.user)
    if (!user) return res.status(400).send('Invalid user')

    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).send('Invalid report')


    const file = req.file
    let image_path
    if (file) {
        const file_name = req.file.filename
        const base_path = `${req.protocol}://${req.get('host')}/public/reports/`
        image_path = `${base_path}${file_name}`
    } else {
        image_path = report.report_file
    }

    let updateReport = await Report.findByIdAndUpdate(
        req.params.id, {

        title: req.body.title,
        comment: req.body.comment,
        report_file: image_path,
        user: req.body.user,
    }, { new: true }
    )
    if (!updateReport) return res.status(400).send('report cannot be updated')
    res.send(updateReport)
})

router.delete('/:id',
    protectRoute.protect,
    protectRoute.restrictTo('admin'),
    (req, res) => {
    Report.findByIdAndRemove(req.params.id)
        .then(report => {
            if (report) {
                let file = report.report_file.split('/')[report.report_file.split('/').length - 1]
                fs.unlinkSync('./public/reports/' + file);
                return res.status(200).json({
                    message: 'report is deleted'
                })
            } else {
                return res.status(404).json({
                    message: 'report not found'
                })
            }
        })
        .catch(err => {
            console.log(err)
            return res.status(400).json({
                message: 'user not existed'
            })
        })
})

module.exports = router
