const mongoose = require('mongoose')

//创建文档的结构对象
//设置集合中文档的属性以及属性值的类型
let ItemSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    categoryId: String,
    imageUrl: [String],
})

//创建模型对象 对文档操作封装对象
let ItemModel = mongoose.model('items', ItemSchema)

module.exports = ItemModel;