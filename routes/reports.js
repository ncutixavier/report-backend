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
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'application/pdf': 'pdf',
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
        cb(null, `${file.fieldname}_${Date.now()}.${extension}`)
    }
})

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'public/reports')
//     },
//     filename: function (req, file, cb) {
//         const fileName = file.originalname.split(' ').join('_')
//         const extension = FILE_TYPE_MAP[file.mimetype]
//         cb(null, `${file.fieldname}_${Date.now()}.${extension}`)
//     }
// })

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
            message: 'Report is no longer existed'
        })
    }
    res.status(200).send(report)
})

router.get('/:title', protectRoute.protect, async (req, res) => {
    const report = await Report.findOne({ title: req.params.title }).populate('user')
    if (!report) {
        return res.status(404).json({
            message: 'Report is no longer existed'
        })
    }
    res.status(200).send(report)
})

router.post('/',
    uploadOptions.array('report_file', 2),
    protectRoute.protect,
    protectRoute.restrictTo('admin'),
    async (req, res) => {
        let user = await User.findById(req.body.user)
        if (!user)
            return res.status(400).send('Invalid user')

        const files = req.files
        if (files.length < 0) {
            console.log("no file")
            return res.status(400).send('Files is required!')
        }
        console.log("Files:", files)
        let reports_path = []
        const base_path = `https://${req.get('host')}/public/reports/`

        files.map(file => {
            reports_path.push(`${base_path}${file.filename}`)
        })


        let report = new Report({
            title: `${req.body.title || "Report"}_${getTodayDate().split(' ').join('_')}`,
            comment: req.body.comment,
            db_name: req.body.db_name,
            number_of_errors: req.body.number_of_errors,
            company: req.body.company,
            report_file: reports_path,
            user: req.body.user,
        })
        report = await report.save()
        if (!report)
            return res.status(400).send('Report cannot be created')
        res.send(report)
    })

router.put('/:id',
    uploadOptions.array('report_file', 2),
    protectRoute.protect,
    protectRoute.restrictTo('admin'),
    async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Report is no longer existed')
        }

        let user = await User.findById(req.body.user)
        if (!user) return res.status(400).send('Invalid user')

        const report = await Report.findById(req.params.id)
        if (!report) return res.status(404).send('Report doesn\'t exist')


        const files = req.files
        const base_path = `https://${req.get('host')}/public/reports/`

        let reports_path = []
        if (files) {
            files.map(file => {
                reports_path.push(`${base_path}${file.filename}`)
            })
        } else {
            reports_path = report.report_file
        }

        let updateReport = await Report.findByIdAndUpdate(
            req.params.id, {

            // title: req.body.title,
            db_name: req.body.db_name,
            number_of_errors: req.body.number_of_errors,
            company: req.body.company,
            comment: req.body.comment,
            report_file: reports_path,
            user: req.body.user,
        }, { new: true }
        )
        if (!updateReport) return res.status(400).send('report cannot be updated')
        res.send(updateReport)
    })
// router.delete('/', async (req, res) => {
//     await Report.deleteMany({ title: "Report_26_May_2021" }).then(function () {
//         res.send("Data deleted")
//     }).catch(function (error) {
//         console.log(error); // Failure
//     });
// })
router.delete('/:id',
    protectRoute.protect,
    protectRoute.restrictTo('admin'),
    (req, res) => {
        Report.findByIdAndRemove(req.params.id)
            .then(report => {
                if (report) {
                    report.report_file.map((rep) => {
                        let file = rep.split('/')[rep.split('/').length - 1]
                        fs.unlinkSync('./public/reports/' + file);
                    })
                    // let file = report.report_file.split('/')[report.report_file.split('/').length - 1]
                    // fs.unlinkSync('./public/reports/' + file);
                    return res.status(200).json({
                        message: 'Report has been deleted'
                    })
                } else {
                    return res.status(404).json({
                        message: 'Report not found'
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
