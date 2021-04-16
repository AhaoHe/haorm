const { select,wrapper,transaction,update,insert,deleteFun } = require('./services/user')

let selectTest = async ()=>{
    try{
        console.time("测试 select 速度: ")
        //let time = new Date().getTime();
        for(let i = 0;i<100;i++)
            await select();
        //console.log("测试 select 速度: "+ (new Date().getTime() - time)) 
        console.timeEnd("测试 select 速度: ")
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
for(let i = 0;i<1;i++)
    selectTest();
// console.log(wrapperTest());
// console.log(transactionTest());
//console.log(updateTest());
// console.log(insertTest());
// console.log(deleteTest());