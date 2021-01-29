
const QueryTypes = require('./utils/query-types');
const SqlSession = require('./database/sql-session');
class Wrapper {
    constructor(tag,orm,config){
        const model = orm.modelManager.get(tag);
        this.model = model;
        this.struct = model.struct
        this.tablename = model.tablename
        this.generator = model.generator;

        this.SqlSession = new SqlSession(orm.modelManager,model);

        this.sqlStr = [];
        this.config = config ? { model:model,...config} : { model:model };
    }

    select(params){
        if(this.config.type == undefined) this.config.type = QueryTypes.SELECT;
        let columns = '';
        const type =  typeof params;
        if( type == 'object')
           columns = this.generator.columns_new(this.struct,params)
        else if(type == 'string')
            columns = params;
        else
            throw new Error('select paramseters is error');
        this.sqlStr.push(`SELECT ${columns}`)
        return this
    }

    insert(params){
        if(this.config.type == undefined) this.config.type = QueryTypes.INSERT;
        this.sqlStr.push(this.generator.insert(this.tablename,this.struct,params).sql)
        return this
    }

    update(params){
        if(this.config.type == undefined) this.config.type = QueryTypes.UPDATE;
        let updateStr = this.generator.update(this.tablename,this.struct,params).sql;
        this.sqlStr.push(updateStr)
        return this
    }

    delete(){
        if(this.config.type == undefined) this.config.type = QueryTypes.DELETE;
        this.sqlStr.push(`DELETE FROM ${this.tablename}`);
        return this;
    }

    from(){
        if(this.sqlStr.length == 0) throw new Error("Can't use at the beginning.");
        //如果不是SELECT则不起作用
        if(this.config.type != QueryTypes.SELECT) return this;
        this.sqlStr.push(`FROM ${this.tablename}`);
        return this;
    }

    where(params){
        //如果是INSERT则不起作用
        if(this.config.type == QueryTypes.INSERT) return this;
        if(this.sqlStr.length == 0) throw new Error("Can't use at the beginning");
        if(arguments.length == 0)
        this.sqlStr.push('WHERE');
        else
            this.sqlStr.push(this.generator.condition_one(this.struct,params,'where'))
        return this;
    }

    and(){
        this.sqlStr.push('AND');
        return this;
    }

    or(){
        this.sqlStr.push('OR');
        return this;
    }

    equal(key,value){
        this.sqlStr.push(this.generator.condition_symbol(this.struct,key,'=',value));
        return this;
    }

    notEqual(key,value){
        this.sqlStr.push(this.generator.condition_symbol(this.struct,key,'!=',value));
        return this;
    }

    in(key,value){
        this.sqlStr.push(this.generator.condition_symbol(this.struct,key,'in',value));
        return this;
    }

    notIn(key,value){
        this.sqlStr.push(this.generator.condition_symbol(this.struct,key,'not in',value));
        return this;
    }

    isNull(key){
        if(this.struct[key] && this.struct[key].fieldName)
            this.sqlStr.push(`${this.struct[key].fieldName} IS NULL`);
        return this;
    }

    isNotNull(key){
        if(this.struct[key] && this.struct[key].fieldName)
            this.sqlStr.push(`${this.struct[key].fieldName} IS NOT NULL`);
        return this;
    }

    async excute(config){
        config = config || {}
        if(typeof config != 'object')
            throw new Error('config need object.');
        const sql = this.sqlStr.join(' ') + ';'
        this.sqlStr.length = 0 //清空数组
        this.config.type = undefined; //初始化sql类型
        //let type = arguments.length > 0 ? arguments[0] : 'query'
        //如果sql为空，返回undefined
        if(sql == '') return undefined;
        // type 为 1 则事务查询，为0则普通查询。select使用普通，其他则用事务
        let type = this.config.type == QueryTypes.SELECT ? 0 : 1
        //存在配置，将配置放置到默认配置里（默认配置优先）
        if(config != undefined) this.config = {config,...this.config}
        //默认4s超时
        this.config.timeout = this.config.timeout || 4000;
        this.config.model = this.model;
        if(0){//普通查询
            return await this.SqlSession.query(sql,config);
        }else{
            this.SqlSession.beginTransaction();
            this.SqlSession.push(sql);
            return await this.SqlSession.commit(config);
        }
    }

    getSql(){
        //返回sql语句
        const sql = this.sqlStr.join(' ') + ';';
        return sql;
    }

    reset(){
        this.sqlStr.length = 0 //清空数组
        this.config.type = undefined; //初始化sql类型
    }

}

module.exports = Wrapper