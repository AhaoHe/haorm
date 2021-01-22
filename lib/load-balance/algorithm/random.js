class Random{
    constructor(balance){
        this.databases = balance.databases
    }
    get(){
        let index = Math.floor(Math.random()*this.databases.length);
        return this.databases[index]
    }
}

module.exports = Random;