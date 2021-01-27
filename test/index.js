const { select,wrapper,transaction,update,insert } = require('./services/user')

let selectTest = async ()=>{
    try{
        let result = await select();
        return result;
    }catch(e){
        console.log(e)
    }
    return '';
}
let wrapperTest = async ()=>{
    try{
        let result = await wrapper();
        return result;
    }catch{

    }
    return '';
}
let transactionTest = async ()=>{
    try{
        let result = await transaction();
        return result;
    }catch{

    }
    return '';
}

let updateTest = async ()=>{
    try{
        let result = await update();
        return result;
    }catch{

    }
    return '';
}
let insertTest = async ()=>{
    try{
        let result = await insert();
        return result;
    }catch{

    }
    return '';
}
console.log(selectTest());
console.log(wrapperTest());
console.log(transactionTest());
console.log(updateTest());
console.log(insertTest());