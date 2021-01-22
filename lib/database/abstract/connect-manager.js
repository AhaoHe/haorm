const { pick } = require('../../utils/object-tool');
const LoadBalance = require('../../load-balance');
const QueryTypes = require('../../utils/query-types');

class ConnectionManager{
    constructor(database,orm){
        this.orm = orm;
        this.options = orm.options;
        this.poolCount = 0;
        this.init();
    }

    init(){
        //confirm config确认配置信息
        let isObj = typeof this.options == 'object';
        //默认设置故障点2分钟后再重连
        if(!this.options.Expiration)
            this.options.Expiration = 120000;//默认2分钟
        if(isObj && this.options.LoadBalance){
            if(this.options.read && Array.isArray(this.options.read)){
                this.balanceRead = this._CreatePoolsBalance(this.options.read,this.options.common);
            }
            if(this.options.write && Array.isArray(this.options.write)){
                this.balanceWrite= this._CreatePoolsBalance(this.options.write,this.options.common);
            }
        }else if(isObj && !isObj.LoadBalance){
            let configKeys = pick(this.options,'host', 'port', 'database', 'user', 'password');
            if(Object.keys(configKeys).length < 5)
                throw new Error('important configuration not find. At least need host,port,database,username,password');
            //连接数据库
            this.pool = this.createPool(this.options);
            this.poolCount += 1;
        }else{
            if(this.options == undefined)
                throw new Error('Options is undefined.');
            //字符串
        }
    }

    createPool(CONFIG){
        throw new Error('No implement SQL lib!');
    }

    _getConnection(pool,callback){
        throw new Error('No implement get connection!');
    }

    async getConnection(type){
        let connection
        let index = 0;
        do{
            let pool;
            let balance;
            if(this.pool)
                pool = this.pool;
            else if(type === 'WRITE'|| type === QueryTypes.UPDATE || type === QueryTypes.INSERT || type === QueryTypes.DELETE || type === undefined){
                balance = this.balanceWrite.get();
                this.poolCount = this.balanceWrite.databases.length
                pool = balance.pool;
            }
            else{
                balance = this.balanceRead.get();
                this.poolCount = this.balanceRead.databases.length
                pool = balance.pool;
            }
            //获取连接
            connection = await this._getConnection(pool).then(conn =>{
                return conn;
            }).catch(err => {
                //处理错误
                if(err){
                    //throw new Error(err)
                    //记录错误就行
                    console.log(err);
                }
                //设置过期时间
                if(balance){
                    balance.expiration = new Date().getTime()+ this.options.Expiration;
                }
                return undefined;
            });
            index++;
        }while(connection == undefined && index < this.poolCount)
        if(connection == undefined) throw new Error('There is no valid connection！');
        return connection;
    }

    async releaseConnection(conn){
        throw new Error('No implement release connection!');
    }

    //生成连接池的负载均衡
    _CreatePoolsBalance(configs,common){
        let databases = [];
        configs.forEach(config => {
            let o = {};
            if(common != undefined && typeof common == 'object'){
                for(let [key,val] of Object.entries(common)){
                    if(config[key] == undefined)
                        config[key] = val;
                }   
            }
            if(config.weight)
                o.weight = config.weight;
            delete config.weight;
            o.pool = this.createPool(config);
            databases.push(o);
        });
        return new LoadBalance(this.options.LoadBalance,databases/* 连接池的数组 */);
    }

}
module.exports = ConnectionManager;
module.exports.ConnectionManager = ConnectionManager;
module.exports.default = ConnectionManager;