const QueryInterface = require('./database/query-interface')
const LIRS = require("../lib/utils/cache/LIRS");
const { default: LRU } = require('./utils/cache/LRU');
const { default: FifoCache } = require('./utils/cache/FIFO');

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
        if(tabledata.cache && tabledata.cache.enable){
            let cacheszie = tabledata.cache.size || 100
            tabledata.cache.type = tabledata.cache.type || 'LIRS'
            switch(tabledata.cache.type.toUpperCase()){
                case 'LIRS':
                    let s_limit = Math.floor(cacheszie * 0.9)
                    let q_limit = cacheszie - s_limit;
                    this.cache = new LIRS(s_limit,q_limit);//new Map();
                    break;
                case 'LRU':
                    this.cache = new LRU(cacheszie);
                    break;
                case 'FIFO':
                    this.cache = new FifoCache(cacheszie);
                    break;
                default:
                    let s_limit_default = Math.floor(cacheszie * 0.9)
                    let q_limit_default = cacheszie - s_limit_default;
                    this.cache = new LIRS(s_limit_default,q_limit_default);
                    break;
            }
            
        }
        //this.interface = new QueryInterface(this);
        this.interface = class extends QueryInterface{};
        this.interface.init(this);
        return this;
    }

    static getInterface(){
        return this.interface;
    }

    static getCache(key){
        return this.cache.get(key);
    }

    static setCache(key,value){
        this.cache.set(key,value);
    }

    static clearCache(){
        this.cache.clear();
    }

}

module.exports = Model