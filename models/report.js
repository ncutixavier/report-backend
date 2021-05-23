const mongoose = require("mongoose")

const reportSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    report_file: [{
        type: String,
        required: true
    }],
    db_name: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    number_of_errors: {
        type: Number,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comment: {
        type: String,
        default: ''
    },
    dateCreated: {
        type: Date,
        default: Date.now()
    },
})

reportSchema.virtual('id').get(function () {
    return this._id.toHexString();
})

reportSchema.set('toJSON', {
    virtuals: true
})

exports.Report = mongoose.model('Report', reportSchema)
