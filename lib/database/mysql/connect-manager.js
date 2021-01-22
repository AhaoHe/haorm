const AbstractConnectManager = require('../abstract/connect-manager')
const mysql = require('mysql2')
/* 
* Mysql连接池管理
*/
class MysqlConnectManager extends AbstractConnectManager{
    constructor(database,orm){
        super(database,orm)
    }

    createPool(MYSQL_CONFIG){
        return mysql.createPool(MYSQL_CONFIG);
    }

    async releaseConnection(conn){
        conn.release();
    }

    _getConnection(pool){
        let p = new Promise((resolve, reject) =>{
            pool.getConnection(function(err,conn){
                if(err) {
                    switch(err.code){
                        case "PROTOCOL_CONNECTION_LOST"://要求重连
                            conn.destroy();
                            resolve(undefined)
                            break;
                        // case "ECONNREFUSED"://如果错误为连接失败
                        //     resolve(undefined);
                        //     break;
                        default:
                            reject(err.message);
                            break;
                    } 
                }
                resolve(conn)
            })
        });
        return p;
    }
}

module.exports = MysqlConnectManager;
module.exports.default = MysqlConnectManager;