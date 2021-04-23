export class Queue{
    constructor(){
        this.map = {}
        this.keys = []
    }

    get length(){
        return this.keys.length
    }

    get(key){
        return this.map[key]
    }

    hasKey(key){
        return Object.prototype.hasOwnProperty.call(this.map,key)
    }

    /****************
    * description 入队列
    *****************/
    push(key,value){
        let map = this.map
        let keys = this.keys

        keys.push(key)
        map[key] = value//无论存在与否都对map中的key赋值
    }
    
    /****************
    * description 如果存在key，不入队列,仅修改值，否则啥也不干
    *****************/
    changeValue(key,value){
        if(this.hasKey(key)){
            map[key] = value//无论存在与否都对map中的key赋值
            return true;
        }
        return false;
    }

    /****************
    * description 出队列
    * returns 出队列的key
    *****************/
    pop(){
        shiftKey = keys.shift(); //先进先出，删除队列第一个元素
        delete map[shiftKey] //删除数据
        return shiftKey
    }
    
}