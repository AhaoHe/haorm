import { Queue } from "../struct/Queue";

export default class FIFO{
    constructor(limit){
        this.queue = new Queue();
        this.limit = limit
    }

    get(key){
        return this.queue.get(key)
    }

    set(key, value){
        let popKey = undefined;
        // 缓存池中存在key,就修改值
        if (this.queue.changeValue(key,value)) {
            return;
        }
        // 队列超过限制
        if (this.queue.length === this.limit) {
            popKey = this.queue.pop(); // 出队列
        }
        // 入队
        this.queue.push(key,value);
        return popKey;
    }
}

export class FifoCache{
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
}