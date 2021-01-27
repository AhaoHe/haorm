const AbstractQueryGenerator = require('../abstract/query-generator')
const SqlString = require('../../sql-string')
const QueryTypes = require('../../utils/query-types');
const { count } = require('../query-interface');
//const ormError = require('../../errors/index.ts')

//sql语句生成
class MysqlQueryGenerator extends AbstractQueryGenerator{
    constructor(databaseIndex){
        super();
        this.escape = (val) => SqlString.escape(val);//防止sql注入
        this.escapeId = (val) => SqlString.escapeId(val);//防止sql注入
    }

    _label(num){
        return num < 0 ? '' : `T${num}` 
    }

    _label_table(num){
        return num < 0 ? '' : `${this._label(num)}.`
    }

    _label_key(key,num){
        return num <= 0 ? key : `T${num}.${key}` 
    }

    //忽略的结构
    _ignoreField(struct,type){
        let o = {}
        for(let [key,value] of Object.entries(struct)){
            if(value.ignore){
                if(Array.isArray(value.ignore) && value.ignore.indexOf(type) != -1)
                    continue;
            }
            o[key] = value;
        }
        return o;
    }

    getFieldsFromStruct(arr,struct){
        let obj = {}
        const isArr = Array.isArray(arr);
        if(isArr){
            arr.forEach(e =>{
                if(typeof e == 'string' && struct.hasOwnProperty(e))
                    obj[e] = struct[e]
            })
        }else if(typeof arr == 'object'){
            const isExcludeArr = Array.isArray(arr.exclude);
            for(let key of Object.keys(arr)){
                if(isExcludeArr && arr.exclude.indexOf(key) != -1){
                    continue;
                }
                obj[key] = struct[key];
            }
        }else{
            throw new Error('getFieldsFromStruct type need Array or object!');
        }
        return obj;
    }

    /* --对外接口。必须*
        struct:为模型结构，也可以拆出需要的结构
        例子：
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
                value : 'string'
            },
            mail : {
                fieldName : 'u_mail',
                value : 'string'
            }
        }
    */
    //如果分页，struct变成主键。先查询出主键索引后，INNER表连接查询的结果，再USING(主键)
    /* 
    SELECT *
    FROM b_user A
    INNER JOIN (SELECT id FROM b_user ORDER BY id LIMIT 0, 5) B
    USING (id);

    page: [页数,一页几条]
    */
    select(tablename,struct,conditions,primaryKey = undefined,num = -1){
        //有page就生成page
        conditions = this._page_condition(tablename,struct,conditions,primaryKey)
        //带join就开启别名
        if(typeof conditions == 'object' && conditions.join)
            num++;
        //正常查询
        // let columns = typeof struct == 'string' ? struct : (()=>{
        //                                                         struct = this._ignoreField(struct,QueryTypes.SELECT);
        //                                                         return this.columns(struct,num)
        //                                                    })();//要么自定义结果，要么使用model的结构
        let structTmp = this._ignoreField(struct,QueryTypes.SELECT);
        conditions.fields = conditions.fields == '*' ? Object.keys(structTmp) : conditions.fields;
        let columns = typeof conditions.fields == 'string' ? conditions.fields : (()=>{
                                                                return this.columns_new(structTmp,conditions.fields,num)
                                                            })();//要么自定义结果，要么使用model的结构
        let conditionStr = this.condition(struct,conditions,num)
        conditionStr = conditionStr == '' ? '' : ` ${conditionStr}`
        let from = this.from(tablename,num);
        //count
        // if(conditions && conditions.count){
        //     let countStr = this._count(struct,conditions.count,num);
        //     if(countStr != '')
        //         columns = `${columns},${countStr}`
        // }
        //如果join了且join没有忽略列，则需要把join的列也select
        columns = this._join_columns(columns,conditions,num);
        
        //如果没有条件就不加空格
        let distinct = conditions && conditions.distinct ? 'DISTINCT ': '';
        let sqlStr = `SELECT ${distinct}${columns} ${from}${conditionStr}`
        return sqlStr;
    }

    /* 
        {
            id:'2',
            name:'name'
        }
    */
    //param为要获取的列,key和模型的key对应，不是跟数据库的字段对应
    /* --对外接口。必须*
        structFields:{
            id:{ fieldName : 'gid' }
        }
        params:{
            id:'1'
        }
    */
    insert(tablename,struct,params){
        if(typeof params != 'object')
            throw Error('insert params is error');
        struct = this._ignoreField(struct,QueryTypes.INSERT);
        let valStr = this.values(struct,params);
        if(valStr == '')
            return { sql:'', parameters: null };
        let str = `INSERT INTO ${tablename}${valStr}`;
        return { sql:str, parameters: null };
    }

    /* --对外接口。必须*
        example:
            params:
            {
                id:'1' //存在主键且不存在条件就根据主键修改数据
                name:''
            }
    */
    update(tablename,struct,params,conditions){
        if(typeof params != 'object')
            throw Error('update params is error');
        let structTmp = this._ignoreField(struct,QueryTypes.UPDATE);
        let updateSet = [];//修改的值
        let conditionStr = this.condition_one(struct,conditions,'where');
        //如果没有条件就不加空格
        conditionStr = conditionStr == '' ? '' : ` ${conditionStr}`
        for(let [key,value] of Object.entries(params)){
            if(!struct.hasOwnProperty(key))
                continue;
            if(struct[key].primarykey){
                //获取主键，如果不存在条件且存在主键，则条件改为主键 = 值
                conditionStr = conditionStr == '' ? ` WHERE ${struct[key].fieldName} = ${this.escape(value)}` : conditionStr;
                continue;
            }
            if(structTmp[key] && value){
                updateSet.push(`${this.escapeId(structTmp[key].fieldName)} = ${this.escape(value)}`)
            }
        }
        
        let updateSQL = updateSet.length == 0 ? '' : `UPDATE ${tablename} SET ${updateSet.join(',')}${conditionStr}`
        return { sql:updateSQL, parameters: null };
    }

    /*--对外接口。必须* 
    
    */
    delete(tablename,struct,conditions){
        let conditionStr = `${this.condition_one(struct,conditions,'where')}`;
        conditionStr = conditionStr == '' ? '' : ` ${conditionStr}`
        let delStr = `DELETE FROM ${tablename}${conditionStr}`
        return { sql:delStr, parameters: null };
    }

    // num 是这次查询的第几张表
    /* --对外接口。必须*
        会生成 T1.gid AS id1,T1.gname AS name1
        1是num
        params为模型struct挑选出来的字段
    */
    columns(params,num = -1,isJoin = false){
        if(typeof params != 'object')
            throw Error('columns params is error');
            //throw new ormError.DatabaseParamError('select params is error');
        let sql = [];
        for(let [key,value] of Object.entries(params)){
            if(value){
                // let column = label == '' ? `${value.fieldName} AS ${key}` :`${label}.${value.fieldName} AS ${key}_${num}`;
                let fieldName = isJoin ? key : value.fieldName;
                let column = `${this._label_table(num)}${this.escapeId(fieldName)} AS '${this._label_key(key,num)}'`
                sql.push(column);
            }
        }
        return sql.join(',');
    }

    columns_new(struct,fields,num = -1,isJoin = false){
        let sql = [];
        const isArr = Array.isArray(fields);
        if(isArr){
            fields.forEach(item =>{
                // if(Array.isArray(item) && item.length == 2){
                //     switch(item[0].toLocaleLowerCase()){
                //         case 'count':
                //             sql.push(
                //                 this._statistics(struct,item[1],num)
                //             );
                //             break;
                //         case 'max':
                //             break;
                //         case 'min':
                //             break;
                //         case 'sum':
                //             break;
                //     }
                //     return;
                // }
                //如果存在COUNT等统计列则加入统计列
                let str = this._statistics(struct,item,num);
                if(str && str != '') sql.push(str);
                //其他用户选择的表列
                if(typeof item == 'string' && struct.hasOwnProperty(item)){
                    let fieldName = isJoin ? item : struct[item].fieldName;
                    let column = `${this._label_table(num)}${this.escapeId(fieldName)} AS '${this._label_key(item,num)}'`
                    sql.push(column);
                }
            })
        }else if(typeof fields == 'object'){
            const isIncludeArr = Array.isArray(fields.include);
            const isExcludeArr = Array.isArray(fields.exclude);
            //先排除再把包括的加入进去
            for(let [key,value] of Object.entries(struct)){
                if(value){
                    //排除就跳过
                    if(isExcludeArr && fields.exclude.indexOf(key) != -1) continue;
                    //如果include存在就剔除，以免重复
                    if(isIncludeArr){
                        let index = fields.include.indexOf(key);
                        if( index != -1) fields.include[index] = undefined;
                    }
                    // let column = label == '' ? `${value.fieldName} AS ${key}` :`${label}.${value.fieldName} AS ${key}_${num}`;
                    let fieldName = isJoin ? key : value.fieldName;
                    let column = `${this._label_table(num)}${this.escapeId(fieldName)} AS '${this._label_key(key,num)}'`
                    sql.push(column);
                }
            }
            if(isIncludeArr){
                let columns = this.columns_new(struct,fields.include,num = -1,isJoin = false)
                sql.push(columns);
            }
        }
        return sql.join(',');
    }

    _statistics(struct,item,num = -1){
        if(Array.isArray(item) && item.length == 2){
            let prefix = 'COUNT';
            switch(item[0].toLocaleLowerCase()){
                case 'count':
                    prefix = 'COUNT';
                    break;
                case 'max':
                    prefix = 'MAX';
                    break;
                case 'min':
                    prefix = 'MIN';
                    break;
                case 'sum':
                    prefix = 'SUM';
                    break;
            }
            let str = [];
            let tb = this._label_table(num);
            let statistics = item[1];
            statistics = Array.isArray(statistics) ? statistics : [statistics]
            statistics.forEach(item => {
                let distinct = item.distinct ? 'DISTINCT ' : ''
                let tag = item.tag && item.tag != '' ? ` AS ${this.escape(item.tag)}` : '';
                if(item.key == 1 || item.key == '*' || item.key == `${tb}*`){
                    str.push(`${prefix}(${distinct}${item.key})${tag}`)
                    return;
                }
                if(struct.hasOwnProperty(item.key))
                    str.push(`${prefix}(${distinct}${tb}${this.escapeId(struct[item.key].fieldName)})${tag}`)
            })
            return str.join(',')
        }
        
    }

    _page_condition(tablename,struct,conditions,primaryKey = undefined){
        if(typeof conditions == 'object' && Array.isArray(conditions['page']) /* && conditions.hasOwnProperty('page') */){
            if(/* Array.isArray(conditions['page']) && */ conditions['page'].length == 2 && primaryKey != undefined){
                let page = conditions['page'][0];
                let count = conditions['page'][1];
                //删除多余数据
                if(conditions.limit)
                    delete conditions.limit;
                if(conditions.offset)
                    delete conditions.offset;
                //分页结构
                conditions.limit = [page * count, count];
                delete conditions.page;
                conditions = {
                    fields: conditions.fields,
                    join:[{
                        link : 'inner',
                        model : {tablename:tablename,struct:struct},
                        fields: [primaryKey],
                        conditions: conditions,
                        using: primaryKey,
                        ignore:true //忽略输出列
                    }]
                }
                //需要别名
                //num++;
            }else{
                throw new Error("Page paramster is error! PS:JOIN condition can't use page")
            }
        }
        return conditions;
    }

    _join_columns(columns,conditions,num = -1){
        if(conditions && conditions.join){
            conditions.join.forEach(item =>{
                if(!item.ignore){
                    //取出join需要选择的结构
                    let joinStruct = item.model.struct;
                    // let joinStruct = {};
                    // let tmpStruct = item.model.struct;
                    // item.fields.forEach(item => {
                    //     if(tmpStruct.hasOwnProperty(item))
                    //         joinStruct[item] = tmpStruct[item]
                    // })
                    let fields = item.fields || item.conditions.fields;
                    let joinColumns = this.columns_new(joinStruct, fields, ++num,true);
                    if(joinColumns != '')
                        columns = `${columns},${joinColumns}`
                    //count
                    // if(item.conditions && item.conditions.count){
                    //     let countStr = this._count(item.model.struct,item.conditions.count,num);
                    //     if(countStr != '')
                    //         columns = `${columns},${countStr}`
                    // }
                }
            })
        }
        return columns;
    }

    /*--对外接口。必须* 
    */
    from(tablename,num = -1){
        let label = ` ${this._label(num)}`;
        let sql = `FROM ${tablename}${label == ' ' ? '' : label}`
        return sql;
    }

    /*--对外接口。必须* 
        id = '1',name='a'
    */
    set(struct,params){
        let setStr = [];
        for(let [key,value] of Object.entries(params)){
            if(struct[key] && struct[key].fieldName !== undefined)
                setStr.push(`${this.escapeId(struct[key].fieldName)} = ${this.escape(value)}`)
        }
        return `SET ${setStr.join(',')}`;
    }

    /*--对外接口。必须* 
    */
    values(struct,params){
        let columns = [];//添加的列
        let valStr = [];//所有数据添加的值
        if(!Array.isArray(params))
            params = [params]
        params.forEach( (p,index) => {
            let values = [];//一条数据添加的值
            for(let [key,value] of Object.entries(p)){
                if(!struct.hasOwnProperty(key))//结构存在key
                    continue;
                if(struct[key].primarykey)//字段不是主键
                    continue;
                if(index == 0){//列只要获取一次就行
                    columns.push(this.escapeId(struct[key].fieldName));
                }
                values.push(this.escape(value))
            }
            valStr.push(values.join(','));
        });
        if(columns.length == 0 || valStr.length == 0)
            return '';
        // (name,mail) VALUES ('a','m'),('b','n')
        return `(${columns.join(',')}) VALUES (${valStr.join('),(')})`;
    }

    //如果是object的条件参数，只选取oneName条件
    /*--对外接口。必须*
     * 只选择oneName一种条件 
     */
    condition_one(struct,conditions,oneName){
        let conditionTemp;
        if(typeof condtions == 'object' && conditions.hasOwnProperty(oneName)){
            conditionTemp = {}
            conditionTemp[oneName] = conditions[oneName]
        }else{
            conditionTemp = conditions
        }
        let conditionStr = `${this.condition(struct,conditionTemp,-1)}`;
        return conditionStr;
    }

    /* 按顺序执行
        {
            distinct:true,
            fields:{
                include:[
                    ['count',{key:'id',tag:'id',distinct:true}]
                ],
                exclude:['id','name']
            }或['id','name',['count',{key:'id',tag:'id',distinct:true}]]
            count:[
                {key:'id',tag:'id',distinct:true},
                {key:'id',tag:'id2'},
            ]
            join:[{
                link : 'left'
                model : model(其他模型json)或 {struct:模型结构, tablename:'user'}(自定义)
                fields:['id','name'](选择的字段对应的模型结构key)
                conditions:{
                    where:{
                        id : { value : 1 , 'symbol' : '='},
                        name : { value : 'name' , 'symbol' : '='}
                    },
                },
                'on': {
                    'id'(JOIN模型的字段) : { key : 'id'(原始模型的字段) , 'symbol' : '=' , index: 0 (哪个模型，默认0最外层，<=0表示最外层，1表示第几个join)},
                    'name' : { value : 'name' , 'symbol' : '='}
                },
                using:['id']或'id', (using和on不能共存，优先on)
                ignore:true //忽略输出列
            }],
            where:{
                id:{value:'1',symbol:'>'},
                $and:[{
                        id:{value:'1',symbol:'>'},
                        name:{value:'name',symbol:'!='}
                    },{
                        id:{value:'1',symbol:'>'}
                        $or:[{
                                id: {value:'1',symbol:'>'}
                            },{
                                id: {value:'1',symbol:'>'}
                            }
                        ]
                    }
                ]
            } => WHERE id > '1' AND ((id >1 AND nmae != 'name') AND (id >1 AND (id >1 OR id >1))
            //where或者结构如[ 
                {key:'id' ,symbol:'=' , value:'1'},(逗号为AND)
                {key:'id' ,symbol:'=' , value:'1'} 
            ] => id = 1 AND id = 1 AND id = 1
            order : {
                order: 'ASC' 或 'DESC'
                params: ['id','name']
            }
            limit: 10 或 [2,10]
            offset: 2,
            group:['id',['name',1]] (如果为数组中为数组则第二个数表示哪个模型，默认0最外层，<=0表示最外层，1表示第几个join)
        }
    */
    /* --对外接口。必须*
        fields: 字段列表 model.fields
        condition : 条件。参考上面例子
        num : 这次生成相关的第几张表,当选择join时,num必须选择>0的整数
    */
    condition(struct,conditions,num = -1){
        //获取条件
        let conditionStr = '';
        switch(typeof conditions){
            case 'object':
                conditionStr = this._condition_object(struct,conditions,num)
                break;
            case 'string':
                conditionStr = conditions
                break;
            case 'undefined':
                conditionStr = ''
                break;    
            default:
                throw new Error('type of conditions is error');
        }
        return conditionStr
    }

    _condition_object(struct,conditions,num = -1){
        let conditionStr = [];
        for(let [key,condition] of Object.entries(conditions)){
            switch(key.toLocaleLowerCase()){
                case 'where':
                    //value是json中where字段的值
                    conditionStr.push(
                            this._where(struct, condition , num)
                        );
                    break;
                case 'join':
                    if(Array.isArray(condition)){
                        condition.forEach(e=>{
                            conditionStr.push(
                                this._join(struct , e , num)
                            );
                            num++;
                        })
                        num -= condition.length
                    }
                    break;
                case 'order':
                    conditionStr.push(
                        this._order(condition,num)
                    );
                    break;
                case 'limit':
                    conditionStr.push(
                        this._limit(condition)
                    );
                    break;
                case 'offset':
                    conditionStr.push(
                        this._offset(condition)
                    );
                    break;
                case 'group':
                    conditionStr.push(
                        this._group(struct,condition,num)
                    );
                    break;
                case 'having':
                    conditionStr.push(
                        this._having(struct,condition,num)
                    );
                    break;
                default:
                    break;
            }
        }
        return conditionStr.join(' ');
    }

    _where(struct,condition ,num = -1 ){
        if(typeof condition == 'string')
            return condition;
        let conditionStr = this._where_conditions(struct,condition,num);
        let str = `WHERE ${conditionStr.join(' AND ')}`;
        return str;
    }
    
    /* 
        {
            id : { value : 1 , 'symbol' : '='},
            name : { value : name , 'symbol' : '='},
            $or : [{
                name: { value : 'orName' , 'symbol' : '='},
            },(OR连接){
                name: { value : 'orName' , 'symbol' : '='},
            }]
        }
    */
    _where_conditions(struct,condition ,num){
        if(condition == undefined)
            return [];
        let label = this._label_table(num);
        let conditionStr = [];
        let index = 0;//条件数量
        if(Array.isArray(condition)){
            //[ {key:'id' ,symbol:'=' , value:'1'} ]
            for(let obj of condition){
                //判断是否存在该字段的对象映射
                let key  = obj.key;
                let symbol = obj.symbol;
                let value = obj.value;
                //获取条件
                conditionStr.push(
                    `${label}${this.condition_symbol(struct,key,symbol,value)}`
                );
                index++;
            }
        }
        else{
            //key是对象映射的字段，value是该字段的数据{'value' : 数据（需要防止SQL注入） , 'symbol' : 判断符号 }
            let keyLength = Object.keys(condition).length;
            for(let [key,value] of Object.entries(condition)){
                if(key == '$and'){
                    if(!Array.isArray(value))
                        throw new Error('$and type need Array');
                    let andConditions = [];
                    value.forEach(item=>{
                        let str = this._where_conditions(struct,item,num);
                        let andLength = str.length;
                        let andStr = str.join(' AND ')
                        andConditions.push(andLength == 1 ? andStr :`(${andStr})`);
                    })
                    let andCondition = andConditions.join(' AND ')
                    conditionStr.push(andConditions.length == 1 || keyLength == 1 ? andCondition : `(${andCondition})`)
                    index++
                    continue;
                }
                else if(key == '$or'){
                    if(!Array.isArray(value))
                        throw new Error('$and type need Array');
                    let orConditions = [];
                    value.forEach(item=>{
                        let str = this._where_conditions(struct,item,num);
                        let orLength = str.length;
                        let orStr = str.join(' AND ')
                        orConditions.push(orLength == 1 ? orStr :`(${orStr})`);
                    })
                    let orCondition = orConditions.join(' OR ')
                    conditionStr.push(orConditions.length == 1 ? orCondition : `(${orCondition})`)
                    index++
                    continue;
                }else{
                    //判断是否存在该字段的对象映射
                    
                    if(struct.hasOwnProperty(key) && struct[key].fieldName){
                        //conditionStr.push(`${label}${this.escapeId(struct[key].fieldName)} ${value.symbol} ${this.escape(value.value)}`);//防止sql注入
                        conditionStr.push(
                            `${label}${this.condition_symbol(struct,key,value.symbol,value.value)}`
                        );
                        index++
                    }
                }
            }
        }
        if(index == 0)//如果不存在条件就返回空
            return []
        return conditionStr;
    }

    _join(struct , condition , num = -1){
        let str;
        let originalNum  = 0;//num;
        num++ //连接表的num
        if(typeof condition.link == 'string'){
            switch(condition.link.toLowerCase()){
                case 'left': 
                    str = 'LEFT JOIN ('
                    break;
                case 'right': 
                    str = 'RIGHT JOIN ('
                    break;
                case 'union': 
                    str = 'UNION ('
                    break;
                case 'inner':
                    str = 'INNER JOIN('
                    break;
                default:
                    return '';
            }
        }
        let targetStruct = condition.model.struct //连接表的模型结构
        let targetTablename = condition.model.tablename //连接表的表名
        let targetPrimaryKey = condition.model.primaryKey //连接表的主键
        let targetCondition = condition.conditions || {} //连接表的查询条件
        targetCondition.fields = condition.fields || targetCondition.fields //fields优先使用conditions外面的
        let targetParams = this.getFieldsFromStruct(targetCondition.fields,targetStruct) //连接表需要查询的字段参数结构（struct里面取）
        
        str += this.select(targetTablename,targetStruct,targetCondition,targetPrimaryKey)
        let label = this._label(num)
        str += `)${label} `
        if(condition.on)
            str += this._on(condition.on,struct,targetParams,originalNum,num); //condition.on为ON后面的条件
        else{
            if(condition.using)
                str += this._using(condition.using);
        }
        return str
    }

    /* 
        originalStruct:原始模型结构
        targetParams:JOIN的模型需要查询的结构

        'on': {
            'id'(JOIN模型的字段) : { targetKey : 'id'(原始模型的字段) , 'symbol' : '='},
            'name' : { value : 'name' , 'symbol' : '='}
        }
    */
   _on(conditionOn , originalStruct,targetParams,originalNum , targetNum){
        if(typeof conditionOn == 'string')
            return `ON ${conditionOn}`;
        let conditionStr = this._on_condtions(conditionOn , originalStruct,targetParams,originalNum , targetNum)
        if(conditionStr == '')
            throw new Error('ON is not found');
        let str = `ON ${conditionStr.join(' AND ')}`;
        return str;
    }

    _on_condtions(conditionOn , originalStruct,targetParams,originalNum , targetNum){
        let conditionStr = []
        let index = 0;
        for(let [key,value] of Object.entries(conditionOn)){
            if(key == '$and'){
                if(!Array.isArray(value))
                        throw new Error('$and type need Array');
                let andConditions = [];
                value.forEach(item=>{
                    let str = this._on_condtions(item,originalStruct,targetParams,originalNum , targetNum);
                    let andLength = str.length;
                    let andStr = str.join(' AND ')
                    andConditions.push(andLength == 1 ? andStr :`(${andStr})`);
                })
                let andCondition = andConditions.join(' AND ')
                conditionStr.push(andConditions.length == 1 || keyLength == 1 ? andCondition : `(${andCondition})`)
                index++
                continue;
            }
            if(key == '$or'){
                if(!Array.isArray(value))
                    throw new Error('$and type need Array');
                let orConditions = [];
                value.forEach(item=>{
                    let str = this._on_condtions(item,originalStruct,targetParams,originalNum , targetNum);
                    let orLength = str.length;
                    let orStr = str.join(' AND ')
                    orConditions.push(orLength == 1 ? orStr :`(${orStr})`);
                })
                let orCondition = orConditions.join(' OR ')
                conditionStr.push(orConditions.length == 1 ? orCondition : `(${orCondition})`)
                index++
                continue;
            }
            //判断join的模型，在查询中是否添加了该字段
            if(!targetParams.hasOwnProperty(key))
                continue;
            //如果存在index，就选择该模型进行on
            if(typeof value.index == 'number'){
                if(value.index < 0) value.index = 0;
                originalNum = value.index;
            }
            //真正处理的逻辑
            let tempStr = '';
            //let targetStr = targetLabel == '' ? this.escapeId(key) : `${targetLabel}.${this.escapeId(key)}`
            let targetKey = `${this._label_table(targetNum)}${this.escapeId(key)}`;
            if(value.hasOwnProperty('targetKey') && originalStruct.hasOwnProperty(value.targetKey)){//判断源模型结构是否包含on条件参数的targetKey
                // let originalStr = originalLabel == '' ? originalStruct[value.targetKey].fieldName
                //                                     : `${originalLabel}.${originalStruct[value.targetKey].fieldName}${originalNum}`;
                let originalKey = originalStruct[value.targetKey].fieldName;
                originalKey = `${this._label_table(originalNum)}${this.escapeId(originalKey)}`;
                tempStr = this.condition_symbol(undefined,originalKey,conditionOn[key].symbol,targetKey)
                //example: T1.id1 或 id1
                if(tempStr != ''){
                    conditionStr.push(tempStr)
                    continue;
                }
            }else if(value.hasOwnProperty('value')){//条件是等于值
                tempStr = this.condition_symbol(undefined,targetKey,conditionOn[key].symbol,this.escape(value.value))
                if(tempStr != '')
                    conditionStr.push(tempStr)
                continue;
            }
        }
        return conditionStr;
    }

    _using(select){
        if(typeof select == 'string')
            return `USING(${select})`;
        if(Array.isArray(select))
            return `USING(${select.join(',')})`;
        return undefined;
    }

    /* 
        limit : 1 或 [offset,limit]
    */
    _limit(limit){
        let str = '';
        if(Array.isArray(limit) && limit.length == 2 && typeof limit[0] == 'number' && typeof limit[1] == 'number'){
            str = `LIMIT ${limit[0]},${limit[1]}`
        }else if(typeof limit == 'number'){
            str = `LIMIT ${limit}`
        }
        return str;
    }

    _offset(offset){
        if(typeof offset == 'number'){
            return `OFFSET ${offset}`
        }
        return '';
    }

    _order(struct,condition,num){
        let str = '';
        const isArr = Array.isArray(condition);
        if(!isArr || typeof condition.params != 'string')
            throw new Error('Order params type need string or array!');
        let params = isArr ? condition.params : [condition.params]
        let paramsVal = [];
        for(let key of params){
            if(struct[key] && struct[key].fieldName != undefined ){
                //存在结构里则用结构
                paramsVal.push(this._label_key(key,num))
            }else{
                //否则自定义
                paramsVal.push(key)
            }
        }
        if(condition.order == 'DESC')
            str = `ORDER BY ${paramsVal.join(',')} DESC`;
        else
            str = `ORDER BY ${paramsVal.join(',')} ASC`;
        return str;
    }

    _group(struct,condition,num){
        num = 0;//默认选最外层表的字段
        let str = '';
        const isArr = Array.isArray(condition);
        if(!isArr && typeof condition != 'string')
            throw new Error('Group params type need string or array!');
        let params = isArr ? condition : [condition]
        let paramsVal = [];
        for(let key of params){
            if(Array.isArray(key) && key.length == 2){
                paramsVal.push(
                    `\`${this._label_key(key[0],key[1])}\``
                )
                continue;
            }
            if(struct[key] && struct[key].fieldName != undefined ){
                //存在结构里则用结构
                paramsVal.push(
                    `\`${this._label_key(key,num)}\``
                )
            }else{
                //否则自定义
                paramsVal.push(`\`${key}\``)
            }
        }
        str = `GROUP BY ${paramsVal.join(',')}`;
        return str;
    }

    _having(struct,condition,num){
        if(typeof condition == 'string')
            return condition;
        let conditionStr = this._where_conditions(struct,condition,num);
        let str = `HAVING ${conditionStr.join(' AND ')}`;
        return str;
    }

    /* --对外接口。必须*
    
    */
    condition_symbol(struct,key,symbol,value){
        let str = '';
        switch(symbol.toLocaleLowerCase()){
            case '=' :
                str = this._symbol(struct,key,'=',value);
                break;
            case '!=':
                str = this._symbol(struct,key,'!=',value);
                break;
            case 'in':
                str = this._brackets(struct,key,'IN',value);
                break;
            case 'notin':
                str = this._brackets(struct,key,'NOT IN',value);
                break;
            default:
                str = this._symbol(struct,key,symbol,value);
                break;
        }
        return str;
    }

    //symbol为符号的字符串格式，值直接用
    _symbol(struct,key,symbol,value){
        if(typeof value == 'object'){//值为子查询
            this.select(value.tablename,value.struct,value.conditions)
        }
        if(struct && struct[key] && struct[key].fieldName)
            return `${this.escapeId(struct[key].fieldName)} ${symbol} ${this.escape(value)}`;
        else if(!struct){
            return `${key} ${symbol} ${value}`;
        }
        return '';
    }

    //symbol为符号的字符串格式，值用括号括起来
    _brackets(struct,key,symbol,value){
        if(typeof value == 'object'){//值为子查询
            this.select(value.tablename,value.struct,value.conditions)
        }
        if(struct[key] && struct[key].fieldName)
            return `${this.escapeId(struct[key].fieldName)} ${symbol} (${isKey ? value : this.escape(value)})`;
        return '';
    }

}

module.exports = MysqlQueryGenerator;
module.exports.QueryGenerator = MysqlQueryGenerator;
module.exports.default = MysqlQueryGenerator;