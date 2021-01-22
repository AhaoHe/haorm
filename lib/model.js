const QueryTypes = require('./utils/query-types');
const QueryInterface = require('./database/query-interface')

class Model {
    constructor(orm){
        this.orm = orm
        this.generator = orm.generator
        this.fields;//临时缓存需要的列
    }

    /* 
    const User =  {
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
                    ignore: ['SELECT']
                },
                mail : {
                    fieldName : 'u_mail',
                    value : 'string'
                }
            }
        }
    */
    static init(tabledata,orm){
        this.tablename = tabledata.tablename
        this.struct = tabledata.struct
        this.orm = orm
        this.generator = orm.generator
        //处理结构
        for(let [key,value] of Object.entries(this.struct)){
            //key不能以$开头
            if(key.startsWith('$'))
                throw new Error("Struct's key can't start with $");
            //获取主键
            if(value.primarykey == true){
                this.primarykey = key
                //break;
            }
        }
        //二级缓存
        if(tabledata.cache){
            this.cache = new Map();
        }
        //this.interface = new QueryInterface(this);
        this.interface = class extends QueryInterface{};
        this.interface.init(this);
        return this;
    }

    getAllColumns(exclude){
        //存在排除列时，必须为数组
        if(exclude && !Array.isArray(exclude))
            throw new Error('Exclude type need array!')
        let columns = [];
        for(let key of Object.keys(this.struct)){
            //如果排除了就不插入到数组
            if(exclude && exclude.indexOf(key) != -1){
                continue;
            }
            columns.push(key);
        }
        return columns;
    }

    getInterface(){
        return this.interface;
    }

}

module.exports = Model