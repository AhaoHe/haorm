class LoadBalance{
    /* 
        [{
            pool: 连接池,
            weight: 2,
            CurrentWeight: 3
        },{

        }]
    */
    constructor(type,databases){
        if(!Array.isArray(databases) || databases.length == 0)
            throw new Error("Config type need Array! Or lenth need > 0");

        this.databases = databases;
        let Balance;
        switch(type.toUpperCase()){
            case 'ROUNDROBIN'://轮询
                Balance = require("./algorithm/round-robin")
                break;
            case 'RANDOM'://随机
                Balance = require("./algorithm/random")
                break;
            case 'WEIGHTEDROUNDROBIN'://加权轮询
                Balance = require("./algorithm/weighted-round-robin")
                break;
            case 'WEIGHTEDRANDOM'://加权随机
                Balance = require("./algorithm/weighted-random")
                break;
            default:
                Balance = require("./algorithm/round-robin")
                break;
        }
        this.Balance = new Balance(this);
    }

    /* 
        [{
            pool: 连接池,
            weight: 2,
            CurrentWeight: 3,
            expiration : new Date()
        },{

        }]
    */
    get(index = 1){
        let database = this.Balance.get();
        //不存在就直接返回
        if(!database)
            return database;
        //过期时间 来判断是否需要该节点
        if(database.expiration == undefined || index > this.databases.length)
            return database;
        else if(typeof database.expiration == 'object' && database.expiration < new Date().getTime()){
            database.expiration = undefined;
            return database;
        }
        else{
            index++;
            return this.Balance.get(index);
        }
    }
}

module.exports = LoadBalance;