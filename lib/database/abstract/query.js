//const { request } = require('http');
const QueryTypes = require('../../utils/query-types');
class AbstractQuery{
    // constructor(pool,orm,config){
    //     this.pool = pool
    //     this.model = config.model;
    //     this.config = config;
    // }
    
    constructor(conn,orm,config){
        this.conn = conn
        this.model = config.model;
        this.config = config;
    }

    //日志
    logQuery(){

    }

    //新增的id，可以通过子类重写
    getInsertIdField() {
        return 'insertId';
    }
    
    //是否是查询
    IsSelectQuery(){
        return this.config.type === QueryTypes.SELECT;
    }

    //是否是插入查询
    IsInsertQuery(){
        return this.config.type === QueryTypes.INSERT;
    }

    //是否是修改查询
    IsUpdateQuery(){
        return this.config.type === QueryTypes.UPDATE;
    }

    //是否是删除查询
    IsDeleteQuery(){
        return this.config.type === QueryTypes.DELETE;
    }

    handleSelect(results){
        let result = {};
        
        result.results = results;
        results.forEach((element,index,arr) => {
            for(const key of Object.keys(element)){
                let match = key.match(/^T([0-9]*)\.(.*)/);
                if(match){
                    if(!element.$join) element.$join = {}
                    let i = match[1] - 1;
                    let matchKey = match[2];
                    //不存在就创建一个
                    if(!element.$join[i]) element.$join[i] = {}
                    element.$join[i][matchKey] = element[key];
                    //从results中剔除
                    delete arr[index][key];
                }
            }
        });
        return result;
    }

    handleInsert(res){
        if(!Array.isArray(res)){
            return { results:[res[this.getInsertIdField()]], affectedRows:res["affectedRows"]};
        }
        let affectedRows = 0;
        let result = res.map((current,index) =>{
            if(current == undefined) return undefined;
            current = current.results;
            affectedRows += current["affectedRows"];
            return current[this.getInsertIdField()];
        });
        return { results:result, affectedRows:affectedRows};
    }

    handleAffectedRows(res){
        if(Array.isArray(res)){
            let rows = 0;
            res.forEach(e=>{
                if(e == undefined) return;
                e = e.results;
                rows += e["affectedRows"];
            });
            return {affectedRows: rows };
        }else{
            return {affectedRows: res["affectedRows"]}
        }
    }
}

module.exports.default = AbstractQuery;
module.exports = AbstractQuery;