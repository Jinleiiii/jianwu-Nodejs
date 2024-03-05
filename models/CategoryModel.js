const mongoose = require('mongoose')

let CategorySchema = new mongoose.Schema({
    name: { type: String, unique: true },
    categoryImage: [String]
})

let CategoryModel = mongoose.model('categories', CategorySchema)

module.exports = CategoryModel;