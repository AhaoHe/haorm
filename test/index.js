const { select,wrapper,transaction,update,insert,deleteFun } = require('./services/user')

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
    }catch(err){
        console.log(err)
    }
    return '';
}
let transactionTest = async ()=>{
    try{
        let result = await transaction();
        return result;
    }catch(err){
        console.log(err)
    }
    return '';
}

let updateTest = async ()=>{
    try{
        let result = await update();
        return result;
    }catch(err){
        console.log(err)
    }
    return '';
}
let insertTest = async ()=>{
    try{
        let result = await insert();
        return result;
    }catch(err){
        console.log(err)
    }
    return '';
}
let deleteTest = async ()=>{
    try{
        let result = await deleteFun();
        return result;
    }catch(err){
        console.log(err)
    }
    return '';
}
console.log(selectTest());
// console.log(wrapperTest());
// console.log(transactionTest());
console.log(updateTest());
// console.log(insertTest());
// console.log(deleteTest());