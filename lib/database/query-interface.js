const QueryTypes = require('../utils/query-types');
const { clone } = require('../utils/object-tool');

class QueryInterface{
    constructor(model){
        //model的数据
        this.tablename = model.tablename
        this.struct = model.struct
        this.generator = model.generator
        this.primarykey = model.primarykey
    }

    static init(model){
        //model的数据
        this.tablename = model.tablename
        this.struct = model.struct
        this.generator = model.generator
        this.primarykey = model.primarykey
        this.orm  = model.orm
        this.model = model;
        //this.tag = tag 标签
    }

    static async findList(/* columns, */conditions,configuration){
        //第一个参数为条件或者不存在时,返回所有列
        //if(columns == undefined )
        conditions = conditions || {}
        if(conditions.fields == undefined)
            return this.findAll(conditions);
        //参数正常
        // const isArray = Array.isArray(columns);
        // const type = typeof columns;
        // let paramStruct = {};
        // if(!isArray && type!= 'object' && type != 'string')//只要字符串或数组的数据
        //     throw new Error('columns type is not Array or String');
        // if(isArray){
        //     columns.forEach( e =>{
        //         if(this.struct.hasOwnProperty(e)){
        //             paramStruct[e] = this.struct[e]
        //         }
        //     });
        //     paramStruct[this.primarykey] = this.struct[this.primarykey];
        // }else if(type == 'object'){
        //     if(Array.isArray(columns.exclude)){
        //         let exclude = columns.exclude;
        //         for(let key of Object.keys(this.struct)){
        //             //如果排除了就不插入到数组
        //             if(exclude && exclude.indexOf(key) != -1){
        //                 continue;
        //             }
        //             paramStruct[key] = this.struct[key];
        //         }
        //         paramStruct[this.primarykey] = this.struct[this.primarykey];
        //     }else
        //         throw new Error("if columns is Array, exclude need be Array.");
        // }else{//为字符串,为*号选择所有model的结构，否则自定义字段
        //     paramStruct = columns == '*' ? this.struct : columns
        // }
        let str = this.generator.select(this.tablename,/* paramStruct */this.struct,conditions,this.primarykey);
        let config = {type:QueryTypes.SELECT,model:this.model};
        //表连接
        if(conditions && conditions['join']){
            config.hasJoin = true;
            let join = conditions['join'];
            config.join = [];
            if(!Array.isArray(join) && typeof join == 'object'){
                join = [join];
            }
            join.forEach((item,index)=>{
                config.join.push({
                    struct : item.model.struct
                })
            })
        }
        if(str == '') throw new Error('Not generate sql string!');//如果sql语句不存在
        //整合外界配置
        config = {...configuration,...config}
        if(config.commit == false) return str;//如果不提交就返回sql语句;
        return await this.orm.query(str,config)
    }

    static async findAll(conditions,config){
        conditions = conditions || {}
        if(typeof conditions == 'string') conditions = {define:conditions}
        conditions.fields = conditions.fields || '*';
        return await this.findList(conditions,config);
    }

    // params为需要查询字段对应结构的key.类型:数组
    static async findOne(coditionsParam,/* columns, */config){
        //如果没有条件转换为对象
        let conditions = coditionsParam || {} ;
        if(typeof coditionsParam == 'string') conditions = {define:coditionsParam}
        if(/* conditions == undefined ||  */typeof conditions != 'object')
            conditions = {}
        //限制只查找一个,要放到末尾 所以先删除limit
        delete conditions['limit']
        conditions.limit = 1
        //第一个参数不存在时,返回所有列
        return await this.findList(/* columns, */conditions,config);
    }

    static async findById(id,fields,config){
        //当前注释语句只有一次判断效率更高
        let conditions = Array.isArray(id)?{
            fields: fields,
            //如果第二个参数即id在第二个参数，则用第二参数，否则id在第一个参数
            where : [{ key:this.primarykey,symbol:'in',value: id || 'NULL' }]
        } : {
            fields: fields,
            //如果第二个参数即id在第二个参数，则用第二参数，否则id在第一个参数
            where : [{ key:this.primarykey,symbol:'=',value: id || 'NULL' }]
        }
        //第一个参数不存在时,返回所有列
        return await this.findList(/* columns, */conditions,config)
    }

    static async findAndCountAll(conditions,config){
        let conditionCount = clone(conditions,['limit','page','offset']);
        const [count, list] = await Promise.all([
            this.count(conditionCount,config),
            this.findList(conditions,config)
        ]);
        return { count:count,...list }
    }

    static async count(conditions,config){
        conditions = conditions || {};
        conditions.fields = [['count',{key:1,tag:'count'}]]
        const list = await this.findList(conditions,config);
        return list.results[0]['count'];
    }
    
    static async max(key,conditions,config){
        if(!key) throw new Error("Max key can't be undefined.");
        conditions = conditions || {};
        conditions.fields = [['max',{key:key,tag:'max'}]]
        const list = await this.findList(conditions,config);
        return list.results[0]['max'];
    }
    
    static async min(key,conditions,config){
        if(!key) throw new Error("Min key can't be undefined.");
        conditions = conditions || {};
        conditions.fields = [['min',{key:key,tag:'min'}]]
        const list = await this.findList(conditions,config);
        return list.results[0]['min'];
    }
    
    static async sum(key,conditions,config){
        if(!key) throw new Error("Sum key can't be undefined.");
        conditions = conditions || {};
        conditions.fields = [['sum',{key:key,tag:'sum'}]]
        const list = await this.findList(conditions,config);
        return list.results[0]['sum'];
    }

    static async insert(params,configuration){
        let sqlArr = [];
        try{
            //数组和对象都行
            if(typeof params != 'object'){
                throw new Error('paramseters type is error')
            }
            //是数组对象就添加多个sql语句
            // params.forEach(param => {
            //     let o = this.generator.insert(this.tablename,this.struct,param);
            //     o.type = QueryTypes.INSERT;
            //     sqlArr.push(o);
            // });
            let o = this.generator.insert(this.tablename,this.struct,params);
            if(o.sql == '') throw new Error('Not generate sql string!');
            o.type = QueryTypes.INSERT;
            sqlArr.push(o);
        }catch(err){
            throw new Error(`生成语句错误:${err}`);
        }
        let config = { type: QueryTypes.INSERT,model:this.model}
        //整合外界配置
        config = {...configuration,...config}
        if(config.commit == false) return sqlArr;//如果不提交就返回sql语句;
        //事务查询
        let r = await this.orm.transaction(sqlArr,config)
        return r[0];
    }

    /* 
     * 修改数据
        example:
            params:{
                id:'12',
                name:'test4'
            }
     */
    static async update(params,conditions,configuration){
        let sqlArr = [];
        try{
            //如果不是数组对象，就变成数组
            // if(!Array.isArray(params) && typeof params == 'object'){
            //     params = [params]
            // }else{
            //     throw new Error('paramseters type is error')
            // }
            //是数组对象就添加多个sql语句
            // params.forEach(param => {
            //     const sql = this.generator.update(this.tablename,this.struct,param,conditions)
            //     sql.type = QueryTypes.UPDATE;
            //     if(sql.sql != '')
            //         sqlArr.push( sql );
            // });
            //params需要为obj类型
            if(typeof params != 'object'){
                throw new Error('paramseters type is error. Need be object.')
            }
            const sql = this.generator.update(this.tablename,this.struct,params,conditions)
            //sql语句为空
            if(sql.sql == '') throw new Error('Not generate sql string!');
            //判断存不存在WHERE条件
            conditions = conditions || {}
            if(!conditions || !conditions.noWhere && sql.sql.indexOf(' WHERE ') == -1){
                throw new Error("UPDATE without 'WHERE',if you want to update witout 'WHERE'.Please add the 'noWhere' parameter to the configuration.");
            }
            sql.type = QueryTypes.UPDATE;
            sqlArr.push( sql );
        }catch(err){
            throw new Error(`生成语句错误:${err}`);
        }
        let config = { type: QueryTypes.UPDATE,model:this.model}
        //整合外界配置
        config = {...configuration,...config}
        if(config.commit == false) return sqlArr;//如果不提交就返回sql语句;
        //事务查询
        let r = await this.orm.transaction(sqlArr,config)
        return r[0];
    }

    static async saveOrUpdate(params,configuration){
        params = Array.isArray(params) ? params[0] : params;
        if(typeof params != 'object' || !params[this.primarykey])
            throw new Error('saveOrUpdate params need be object and params need exsit primary key!');
        let update = await this.update(params,undefined,configuration);
        if(update.affectedRows == 0)
            return await this.insert(params,configuration);
        return update;
    }

    static async delete(conditions,configuration){
        let sqlArr = [];
        try{
            const type = typeof conditions;
            if(type != 'object' && type != 'string')
                throw new Error('Delete type of paramseters is error.type need be object or string.');
            const sql = this.generator.delete(this.tablename,this.struct,conditions);
            //sql语句为空
            if(sql.sql == '') throw new Error('Not generate sql string!');
            //判断存不存在WHERE条件
            if(!conditions.noWhere && sql.sql.indexOf(' WHERE ') == -1){
                throw new Error("DELETE without 'WHERE',if you want to delete witout 'WHERE'.Please add the 'noWhere' parameter to the configuration.");
            }
            sql.type = QueryTypes.DELETE;
            sqlArr.push(sql);
        }catch(err){
            throw new Error(`生成语句错误:${err}`);
        }
        let config = { type: QueryTypes.DELETE,model:this.model}
        //整合外界配置
        config = {...configuration,...config}
        if(config.commit == false) return sqlArr;//如果不提交就返回sql语句;
        //事务查询
        return await this.orm.transaction(sqlArr,config)
    }
    
    static async deleteById(id,config){
        let conditions = Array.isArray(id) ? {
            where : [{ key:this.primarykey,symbol:'in',value: id || 'NULL' }]
        } : {
            where : [{ key:this.primarykey,symbol:'=',value: id || 'NULL' }]
        }
        return await this.delete(conditions,config)
    }

}

module.exports = QueryInterface;