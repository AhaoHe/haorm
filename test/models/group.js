const { sqlOperation } = require('../config')
const { QueryTypes } = require('../../lib')
const Group =  {
    tablename:'b_group',
    struct : {
        id : {
            fieldName : 'id',
            value : 'number',
            primarykey: true
        },
        name : {
            fieldName : 'g_name',
            value : 'string'
        },
        g_status:{
            fieldName : 'g_status',
            value : 'bool'
        }
    }
}

//返回ORM生成的类
module.exports = sqlOperation.define('group',Group)
module.exports.Group = Group;