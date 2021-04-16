const { pick } = require('./utils/object-tool');
const Model = require('./model')
const Wrapper = require('./wrapper')
const ModelManager = require('./model-manager')
const QueryTypes = require('./utils/query-types')

class Haorm{
    /* 
        type:数据库类型
        options:数据库连接参数
        config: 通用查询的配置
    */
    constructor(type,options,config){
        this.options = options
        this.config = config || {}

        let Database 
        if(typeof type == 'string'){
            switch(type.toLocaleLowerCase()){
                case 'mysql':
                    Database = require('./database/mysql');
                    break;
                default:
                    throw new Error('not exist database');
            }
        }
        const database = new Database(this);
        this.database = database;
        this.generator = database.queryGenerator;
        this.modelManager = new ModelManager(this);
    }

    define(tag,tabledata){
        const model = class extends Model {};
        //如果参数只有模型数据，没有标签，默认表名当标签
        if(tabledata == undefined && typeof tag == 'object'){
            tabledata = tag;
            tag = tabledata.tablename
        }
        //标签不能为空或undefined
        if(tag == '' || tag == undefined)
            throw new Error('Tag can not be undefined or empty!');
        //标签需要独一无二
        if(this.modelManager.get(tag) != undefined)
            throw new Error('Tag is not unique!');
        model.init(tabledata,this)
        //放入模型管理，方便后期获取
        this.modelManager.set(tag,model);
        model.tag = tag;
        return model.interface;
    }

    getModel(expr){
        return this.modelManager.get(expr);
    }

    openSession(expr){
        return this.modelManager.openSession(expr);
    }

    newWrapper(tag,config){
        return new Wrapper(tag,this,config);
    }

    /* 
        sql可以为sql语句字符串，也可以为对象
        {sql:'sql语句',paramseters:['?1','?2']}

        config:{
            type*:sql语句类型
            model*:模型
            sessionCache*:一级缓存
        }
    */
    async query(sql,config){
        config = config || {}
        config.model = config.tag ? this.modelManager.get(config.tag) : config.model;
        //二级缓存
        const cahceEnable = config.model && config.model.cache;
        if( cahceEnable ){//是否开启了二级缓存
            let r = config.model.getCache(sql);//this.modelManager.getCache(config.model.tag,sql)
            if(r)
                return r;
        }
        //一级缓存(必开)
        let result = config.sessionCache && config.sessionCache.get(sql);
        if(result)
            return result;
        //真正的查询
        config.timeout = config.timeout || this.config.timeout ||4000
        const conn = await this.database.connectionManager.getConnection(config.type)
        //如果类型是读写，就需要改为增删改查的类型了
        if(config.type == QueryTypes.READ ||config.type == QueryTypes.WRITE)
            config.type = sql.substring(0,6).toUpperCase();
        const query = new this.database.Query(conn, this, config);
        result =  await query.query(sql).then((value)=>{
            //处理二级缓存
            if( cahceEnable ){//是否开启了二级缓存
                if(config.type == QueryTypes.SELECT)
                    config.model.setCache(sql,value);//this.modelManager.setCache(config.model.tag,sql,value)
                else
                    config.model.clearCache();//this.modelManager.clearCache(config.model.tag)
            }
            //处理一级缓存
            if(config.type == QueryTypes.SELECT)
                config.sessionCache && config.sessionCache.set(sql,value);
            else
                config.sessionCache && config.sessionCache.clear();
            return value;
        }).catch((err)=>{
            throw new Error(`Query Error:${err}`);
        });
        //返回结果
        return result
    }

    /* 
    [{
        sql: 'SELECT * FROM user WHERE id = ?或'value';'
        [可选  paramesters:['12','name']  ]
    }]
    */
    async transaction(sqlArr,config){
        config = config || {}

        let clear = false;
        config.model = config.tag ? this.modelManager.get(config.tag) : config.model;
        const cahceEnable = config.model && config.model.cache;//二级缓存是否开启
        //转化为需要的格式 {sql:string,paramsters:undefined,type:QueryType.SELECT}
        sqlArr.forEach((sql,index,arr) => {
            let sqlObj = arr[index];
            if(typeof sql == 'string')
                sqlObj = { sql:sql , paramsters: undefined, type: sql.substring(0,6).toUpperCase() }
            if(!sqlObj.type){
                sqlObj.type = sqlObj.sql.substring(0,6).toUpperCase()
            }
            if( !clear ){//是否清除缓存,
                if( sqlObj.type != QueryTypes.SELECT){
                    clear = true;
                }
                else{
                    let r;
                    //二级缓存
                    if(cahceEnable)
                        r = config.model.getCache(sql);
                    //一级缓存
                    if(!r && config.sessionCache)
                        r = config.sessionCache.get(sql);
                    sqlObj.result = r;
                }
            }
            arr[index] = sqlObj;
        });

        config.timeout = config.timeout || this.config.timeout ||4000
        const conn = await this.database.connectionManager.getConnection(config.type)
        const query = new this.database.Query(conn, this, config);
        return await query.Transaction(sqlArr).then((value)=>{
            if(clear){
                //处理二级缓存
                if(cahceEnable){
                    config.model.clearCache();
                }
                //处理一级缓存
                config.sessionCache && config.sessionCache.clear();
            }
            return value;
        }).catch((err)=>{
            throw new Error(`Transaction Error:${err}`);
        });
    }
}

module.exports.default = Haorm
module.exports = Haorm
module.exports.SqlOperation = Haorm
module.exports.Haorm = Haorm
module.exports.QueryTypes = QueryTypes