const { select,wrapper,transaction } = require('./services/user')

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
selectTest();
wrapperTest();
transactionTest();