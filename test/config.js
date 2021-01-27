const { Haorm } = require('../lib/index')

// const MYSQL_CONFIG = {
//     host     : 'localhost', // 可以是本地地址，也可以设置成远程地址
//     port     : '3306',
//     user     : 'root', // 我这边是mysql,一般都是root
//     password : '123456',
//     database : 'test',
//     connectionLimit: 1000
// };
const MYSQL_CONFIG = {
    LoadBalance: 'Default',
    Expiration: 120 * 1000, //单点故障，两分钟重新加入
    read:[{
        host     : 'localhost', // 可以是本地地址，也可以设置成远程地址
        port     : '3306',
        user     : 'root',
        password : '123456',
        database : 'test'
    },{
        host     : 'localhost', // 可以是本地地址，也可以设置成远程地址
        port     : '3306',
        user     : 'root', // 我这边是mysql,一般都是root
        password : '123456',
        database : 'test',
        weight   : 4, //权重（负载均衡策略为加权时），默认1
        connectionLimit: 4000
    }],
    write:[{
        host     : 'localhost', // 可以是本地地址，也可以设置成远程地址
        port     : '3306',
        user     : 'root',
        password : '123456',
        database : 'test'
    },{
        host     : 'localhost', // 可以是本地地址，也可以设置成远程地址
        port     : '3306',
        user     : 'root', // 我这边是mysql,一般都是root
        password : '123456',
        database : 'test',
        weight   : 4, //权重（负载均衡策略为加权时），默认1
        connectionLimit: 4000
    }],
    common:{ //所有数据库配置通用设置,单个设置优先
        connectionLimit: 2000
    }
}

const sqlOperation = new Haorm('mysql',MYSQL_CONFIG,{timeout:4000});
module.exports.default = sqlOperation
module.exports = { sqlOperation }