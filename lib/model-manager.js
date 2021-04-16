const SqlSession = require('./database/sql-session')
class ModelManager{
    constructor(orm){
        /* 
            models:[
                {
                    tag:'',//目前为表名
                    model: 真正的model
                }
            ]
        */
        //this.models = [];
        this.models = new Map();
        this.database = orm.database;
        this.orm = orm;

        /* 
            二级缓存,放入每个model中了
            tablename : { expiration: new Date().getTime(),result: [] }
        */
    }

    get(expr){
        if(typeof expr == 'string'){
            return this.models.get(expr);
        }
        return undefined
    }

    getInterface(expr){
        let model = this.get(expr);
        if(model != undefined)
            return model.getInterface();
    }

    openSession(expr,config){
        let model = this.get(expr);
        if(model != undefined){
            const session =  new SqlSession(this,model);
            //如果存在配置，就在session中采用此配置
            if(typeof config == 'object') session.config = { ...config,...session.config}
            return session;
        }
    }

    set(obj){
        let tag,model;
        if(arguments.length == 2){
            tag = arguments[0]
            model = arguments[1]
        }
        else{
            tag = obj.tag;
            model = obj.model;
        }
        if(tag != undefined && model != undefined){
            this.models.set(tag,model);
        }
    }

    remove(expr){
        this.models.delete(expr);
    }

    getCache(expr,sql){
        let o = this.get(expr);
        if(o && o.cache){
            return o.cache.get(sql);
        }
        
    }

    setCache(tag,sql,result){
        let o = this.get(tag);
        if(o && o.cache){
            o.cache.set(sql,result)
        }
    }

    clearCache(tag){
        let o = this.get(tag);
        if(o && o.cache){
            o.cache.clear();
        }
    }

}

module.exports = ModelManager;