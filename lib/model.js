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
                if(this.primarykey) throw new Error('Only one primary key is supported！');
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

    static getInterface(){
        return this.interface;
    }

}

module.exports = Model