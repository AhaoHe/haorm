class RoundRobin{
    constructor(balance){
        this.databases = balance.databases;
        this.index = this.databases.length-1;
    }

    get(){
        let node = this._roundRobin();
        return node;
    }

    _roundRobin(){
        let node;
        let j = this.index;
        do  
        {  
            j = (j + 1) % this.databases.length;  
            this.index = j;
            node =  this.databases[j];;  
        } while (j != this.index);
        return node;
    }
    
}

module.exports = RoundRobin;