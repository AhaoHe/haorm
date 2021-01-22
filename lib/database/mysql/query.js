//import AbstractQuery from '../abstract/query'
const { endWith } = require('../../utils/string-tool');
const AbstractQuery = require('../abstract/query');
//const QueryTypes = require('../../../../dist/utils/query-types');

//基础数据库查询方法
class MysqlQuery extends AbstractQuery{
    
    constructor(conn,orm,config){
        //通过父类保存conn
        super(conn,orm,config)
    }



    async query(sql,parameters){
        if(!endWith(sql,';'))
            sql += ';';
        const that = this;
        const query = parameters && parameters.length
        ?  new Promise((resolve, reject) =>{
                that.conn.query(sql, parameters,
                    (err, results, fields) => err ? reject(err) : resolve(that.result({results,fields}))
                ).setMaxListeners(100);
                that.close(that.conn);
            })
        : new Promise((resolve, reject) =>{
                that.conn.query({sql,...this.config},
                    (err, results, fields) => err ? reject(err) : resolve(that.result({results,fields}))
                ).setMaxListeners(100);
                that.close(that.conn);
            });
        return await query;
    }

    async ConnectionQuery(conn,sql,parameters,type, result){
        if(!endWith(sql,';'))
            sql += ';';
        let o = {
            result : result,
            type : type || sql.substring(0,6).toUpperCase(),
            hasCache : result == undefined ? false : true
        }
        if(o.result != undefined)
            return o
        const query = parameters && parameters.length
        ?  new Promise((resolve, reject) =>{
                
                if(result)
                    resolve(o)
                conn.query(sql, parameters,
                    (err, results, fields) => err ? reject(err) : (()=>{
                                                                        if(o.result == undefined)
                                                                            o.result = { results, fields }
                                                                        resolve(o)
                                                                  })()
                ).setMaxListeners(100)
            })
        : new Promise((resolve, reject) =>{
                conn.query({sql,...this.config},
                    (err, results, fields) => err ? reject(err) : (()=>{
                                                                        if(o.result == undefined)
                                                                            o.result = { results, fields }
                                                                        resolve(o)
                                                                })()
                ).setMaxListeners(100)
            });
        return await query;
    }

    async Transaction(sqlArr){
        const that = this;
        const query = new Promise((resolve, reject) =>{
            if(!Array.isArray(sqlArr))
                reject("Transaction SQL need typeof Array")  
            this.conn.beginTransaction(function(err){
                if(err){
                    //开启事务失败
                    that.close(this.conn)
                    reject(err)
                }
                // 将所有需要执行的sql封装为数组
                let promiseArr = sqlArr.map(({ sql, parameters, type, result }) => {
                    if(sql == '')
                        return;
                    return that.ConnectionQuery(that.conn,sql,parameters,type, result);
                })
                // Promise调用所有sql，一旦出错，回滚，否则，提交事务并释放链接
                Promise.all(promiseArr).then(res => {
                    that.commit(that.conn,reject)
                    //resolve(that.result(res));
                    resolve(that.transactionResult(res));
                }).catch(err => {
                    that.rollback(that.conn)
                    reject(err)
                })
            })
        })
        return await query;
    }

    commit = async (conn,reject) => {
        conn.commit((error) => {
            if (error) {
                console.log('事务提交失败')
                reject(error)//回调函数
            }
        })
        conn.release()  // 释放链接
    }

    rollback = async (conn) =>{
        conn.rollback(() => {
            console.log('数据操作回滚')
        })
        conn.release()  // 释放链接
    }

    close = async (conn) => {
        conn.release();
        console.log('mysql连接池释放.....release');
    }
    
    /* 
        {
            columns:['id','name'],
            rows:[
                {
                    id:1,
                    name:'name'
                }
            ]
            get [expr](){ return this.rows[expr]; }
        }
    */
    result = (res) =>{
        if(this.IsSelectQuery()){
            if(Array.isArray(res)){
                let result = {
                    results : res.map(e => this.handleSelect(e.results))
                }
                return result;
            }else{
                return this.handleSelect(res.results)
            }
        }
        if(this.IsInsertQuery()){
            return this.handleInsert(res.results);
        }
        if(this.IsUpdateQuery()){
            return this.handleAffectedRows(res.results);
        }
        if(this.IsDeleteQuery()){
            return this.handleAffectedRows(res.results);
        }
        return {results:res.results};
    }

    transactionResult = (res) =>{
        let result = [];
        res.forEach((item)=>{
            if(item != undefined){
                this.config.type = item.type;
                let tmp = item.hasCache ? item.result : this.result(item.result)
                result.push(tmp);
            }
        })
        return result;
    }

}

module.exports = MysqlQuery;
module.exports.Query = MysqlQuery;
module.exports.default = MysqlQuery;