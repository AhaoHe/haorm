class SqlSession{
    constructor(manager,model,commitSQL = true){
        this.database = manager.database;
        this.cache = new Map();
        this.model = model;
        this.orm = manager.orm;

        //model的数据
        this.tablename = model.tablename
        this.struct = model.struct
        this.generator = model.generator
        this.primarykey = model.primarykey
        this.interface = model.interface;

        //基础配置
        this.config = {
            commit : commitSQL,//是否开启了事务,是否需要提交查询
            sessionCache : this.cache,
            model : this.model
        };
    }

    changeModel(model){
        if(typeof model == 'object')
            this.model = model;
        else
            this.model = this.orm.modelManager.get(model);
        this.config.model = this.model;
    }
    
    beginTransaction(){
        this.config.commit = false;
        this.sqlArr = [];
    }

    async findList(/* columns, */conditions){
        let result = await this.interface.findList(/* columns, */conditions,this.config);
        if(this.config.commit)
            return result;
        else
            this.sqlArr.push(result);
    }

    async findAll(conditions){
        let result = await this.interface.findAll(conditions,this.config)
        if(this.config.commit)
            return result;
        else
            this.sqlArr.push(result);
    }

    // params为需要查询字段对应结构的key.类型:数组
    //columns可选，conditions必选
    async findOne(conditions/* ,columns */){
        let result = await this.interface.findOne(conditions/* ,columns */,this.config);
        if(this.config.commit)
            return result;
        else
            this.sqlArr.push(result);
    }

    async findById(id,fields){
        let result = await this.interface.findById(id,fields,this.config);
        if(this.config.commit)
            return result;
        else
            this.sqlArr.push(result);
    }

    async insert(params){
        // if(this.model.cache)
        //     this.model.cache.clear()//清空二级缓存
        // this.cache.clear() //清空缓存
        let result = await this.interface.insert(params,this.config)
        if(this.config.commit)
            return result;
        else{
            result.forEach(element => {
                this.sqlArr.push(element);
            });
        }
    }

    async update(params,conditions){
        // if(this.model.cache)
        //     this.model.cache.clear()//清空二级缓存
        // this.cache.clear() //清空缓存
        let result = await this.interface.update(params,conditions,this.config)
        if(this.config.commit)
            return result;
        else{
            result.forEach(element => {
                this.sqlArr.push(element);
            });
        }
    }

    async delete(whereCondition){
        // if(this.model.cache)
        //     this.model.cache.clear()//清空二级缓存
        // this.cache.clear() //清空缓存
        let result = await this.interface.delete(whereCondition,this.config)
        if(this.config.commit)
            return result;
        else{
            result.forEach(element => {
                this.sqlArr.push(element);
            });
        }
    }

    push(sql){
        if(!this.config.commit){
            let type = sql.substring(0,6).toUpperCase();
            if(type == 'UPDATE' || type == 'INSERT' || type == 'DELETE')
                this.cache.clear();
            this.sqlArr.push({sql:sql,type:type});
        }
    }

    async commit(config){
        if(this.config.commit)
            throw new Error('No beginning transaction!')
        config = config || {}
        config.type = config.type == 'READ' ? 'READ' : 'WRITE'
        this.config.commit = true;
        config = {...config,...this.config}
        /* const conn = this.database.connectionManager.getConnection(config.type)
        const query = new this.database.Query(conn, this.orm, config);
        this.config.commit = true;
        return await query.Transaction(this.sqlArr); */
        return await this.orm.transaction(this.sqlArr,config)
    }

    async query(sql,config){
        config = {...config,...this.config}
        config.type = config.type || sql.substring(0,6).toUpperCase();
        return await this.orm.query(sql,config)
    }

}

module.exports = SqlSession;