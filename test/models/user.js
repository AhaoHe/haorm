const { sqlOperation } = require('../config')
const { QueryTypes } = require('../../lib')
const User =  {
    tablename:'b_user',
    struct : {
        id : {
            fieldName : 'id',
            value : 'number',
            primarykey: true
        },
        name : {
            fieldName : 'u_login',
            value : 'string'
        },
        password : {
            fieldName : 'u_passwd',
            value : 'string',
            ignore:[QueryTypes.UPDATE]
        },
        mail : {
            fieldName : 'u_mail',
            value : 'string',
            ignore:[QueryTypes.INSERT]
        }
    },
    cache: true
}

//返回ORM生成的类
module.exports = sqlOperation.define('user',User)