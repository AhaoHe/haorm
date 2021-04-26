const LIRS = require("../../lib/utils/cache/LIRS");

lirs = new LIRS(90,10);

try{
    console.time("测试 缓存 速度: ")
    for(let i = 0;i<10000000;i++){
        let key = Math.ceil(Math.random()*10) * Math.ceil(Math.random()*10) * Math.ceil(Math.random()*10) 
        lirs.set(key,''); 
    }
    console.timeEnd("测试 缓存 速度: ")
    console.log(lirs.s_size)
    console.log(lirs.q_size)
}catch(e){
    console.log(e)
    console.log(lirs.map)
}
console.log(lirs.map)