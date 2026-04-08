const mongoose = require('../db')

const readingSchema = new mongoose.Schema({
level: Number,
motor: String,
time: {
type: Date,
default: Date.now
}
})

module.exports = mongoose.model('Reading', readingSchema)
