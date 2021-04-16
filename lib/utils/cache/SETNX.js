class SETNX{//SET IF NOT EXIST
    constructor(model,config){
        this.cache = model.cache;
        this.mutex = new Map();
        this.mutexExpiration = config ? config.mutexExpiration : undefined;
        this.mutexExpiration = this.mutexExpiration || 3 * 60 //默认3分钟过期
    }

    get(sql) {
        let value = this.cache.get(key);
        if (value == undefined) { //代表缓存值过期
            //设置3min的超时，防止del操作失败的时候，下次缓存过期一直不能load db
            if (this.setnx(sql, 1, this.mutexExpiration)) {  //代表设置成功（加锁）
                value = db.get(sql);//从数据库获取数据
                this.cache.set(sql, value);//数据放入缓存。
                this.del(sql);//删除锁
            } else {  //这个时候代表同时候的其他线程已经load db并回设到缓存了，这时候重试获取缓存值即可
                    sleep(50).then(()=>{
                        get(key);  //重试
                    });
            }
        } else {
            return value;      
        }
    }

    /* 
        expire_secs：单位s
    */
    setnx(key,val,expire_secs){
        let time = new Date();
        let current = time.getTime();
        let mutxVal = this.mutex.get(key);
        if(!mutxVal || mutxVal.time < current){
            time.setSeconds(time.getSeconds() + expire_secs);
            this.mutex.set(key,{
                val: val,
                time:time.getTime()
            })
            return true;
        }
        return false;
    }

    del(key){
        this.mutex.delete(key);
    }

    sleep (time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

}