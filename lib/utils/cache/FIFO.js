class FifoCache{
    constructor(limit){
        this.limit = limit || 100
        this.map = {}
        this.keys = []
    }
    set(key,value){
        let map = this.map
        let keys = this.keys
        let shiftKey = undefined;
        //缓存池中不存在key
        if (!Object.prototype.hasOwnProperty.call(map,key)) {
            if (keys.length === this.limit) {
                shiftKey = keys.shift();
                delete map[shiftKey]//先进先出，删除队列第一个元素
            }
            keys.push(key)
        }
        map[key] = value//无论存在与否都对map中的key赋值
        return shiftKey
    }
    get(key){
        return this.map[key]
    }

    clear(){
        this.map = {}
        this.keys = []
    }
}
module.exports.default = FifoCache