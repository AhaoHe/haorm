const QueryTypes = require('../utils/query-types');

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
        //this.tag = tag 标签
    }

    static async findList(columns,conditions,configuration){
        //第一个参数为条件或者不存在时,返回所有列
        if(columns == undefined )
            return this.findAll(conditions);
        //参数正常
        const isArray = Array.isArray(columns);
        const type = typeof columns;
        let paramStruct = {};
        if(!isArray && type != 'string')//只要字符串或数组的数据
            throw new Error('columns type is not Array or String');
        if(isArray){
            columns.forEach( e =>{
                if(this.struct.hasOwnProperty(e)){
                    paramStruct[e] = this.struct[e]
                }
            });
            if(columns.indexOf(this.primarykey) == -1)
                paramStruct[this.primarykey] = this.primarykey;
        }else{//为字符串,为*号选择所有model的结构，否则自定义字段
            paramStruct = columns == '*' ? this.struct : columns
        }
        let str = this.generator.select(this.tablename,paramStruct,conditions,this.primarykey);
        let config = {type:QueryTypes.SELECT,model:this};
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
        if(str == '') return undefined;//如果sql语句不存在
        //整合外界配置
        config = {...configuration,...config}
        if(config.commit == false) return str;//如果不提交就返回sql语句;
        return await this.orm.query(str,config)
    }

    static async findAll(conditions,config){
        return await this.findList('*',conditions,config);
    }

    // params为需要查询字段对应结构的key.类型:数组
    static async findOne(coditionsParam,columns,config){
        //如果没有条件转换为对象
        let conditions = coditionsParam || {} ;
        if(/* conditions == undefined ||  */typeof conditions != 'object')
            conditions = {}
        //限制只查找一个,要放到末尾 所以先删除limit
        delete conditions['limit']
        conditions.limit = 1
        //第一个参数不存在时,返回所有列
        return await this.findList(columns,conditions,config);
    }

    static async findById(id,columns,config){
        //当前注释语句只有一次判断效率更高
        let conditions = {
            //如果第二个参数即id在第二个参数，则用第二参数，否则id在第一个参数
            where : [{ key:this.primarykey,symbol:'=',value: id || 'NULL' }]
        }
        //第一个参数不存在时,返回所有列
        return await this.findList(columns,conditions,config)
    }

    static async count(params,conditions){
        
    }

    static async insert(params,configuration){
        let sqlArr = [];
        try{
            //如果不是数组对象，就变成数组
            if(typeof params == 'object'){
                if(!Array.isArray(params))
                    params = [params]
            }else{
                throw new Error('paramseters type is error')
            }
            //是数组对象就添加多个sql语句
            params.forEach(param => {
                let o = this.generator.insert(this.tablename,this.struct,param);
                o.type = QueryTypes.INSERT;
                sqlArr.push(o);
            });
        }catch(err){
            throw new Error(`生成语句错误:${err}`);
        }
        let config = { type: QueryTypes.INSERT,model:this}
        //整合外界配置
        config = {...configuration,...config}
        if(config.commit == false) return sqlArr;//如果不提交就返回sql语句;
        //事务查询
        return await this.orm.transaction(sqlArr,config)
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
            if(!Array.isArray(params) && typeof params == 'object'){
                params = [params]
            }else{
                throw new Error('paramseters type is error')
            }
            //是数组对象就添加多个sql语句
            params.forEach(param => {
                const sql = this.generator.update(this.tablename,this.struct,param,conditions)
                sql.type = QueryTypes.UPDATE;
                if(sql.sql != '')
                    sqlArr.push( sql );
            });
        }catch(err){
            throw new Error(`生成语句错误:${err}`);
        }
        let config = { type: QueryTypes.UPDATE,model:this}
        //整合外界配置
        config = {...configuration,...config}
        if(config.commit == false) return sqlArr;//如果不提交就返回sql语句;
        //事务查询
        return await this.orm.transaction(sqlArr,config)
    }

    static async delete(whereCondition,configuration){
        let sqlArr = [];
        try{
            const type = typeof whereCondition;
            if(type != 'object' && type != 'undefined' && type != 'string')
                throw new Error('type of paramseters is error');
            const sql = this.generator.delete(this.tablename,this.struct,{ where : whereCondition});
            sql.type = QueryTypes.DELETE;
            sqlArr.push(sql);
        }catch(err){
            throw new Error(`生成语句错误:${err}`);
        }
        let config = { type: QueryTypes.DELETE,model:this}
        //整合外界配置
        config = {...configuration,...config}
        if(config.commit == false) return sqlArr;//如果不提交就返回sql语句;
        //事务查询
        return await this.orm.transaction(sqlArr,config)
    }

}

module.exports = QueryInterface;