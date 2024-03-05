// 暴露一个函数 而不是mongoose
module.exports = function (success, error) {
    if (typeof error !== 'function') {
        error = () => {
            console.log('数据库连接失败')
        }
    }
    const mongoose = require('mongoose');
    const { DBHOST, DBPORT, DBNAME } = require('../config/dbconfig.js')

    mongoose.set('strictQuery', true);

    mongoose.connect(`mongodb://${DBHOST}:${DBPORT}/${DBNAME}`)

    mongoose.connection.once('open', () => {
        success();
    })
}
