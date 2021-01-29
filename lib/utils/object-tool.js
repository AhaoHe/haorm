//判断对象是否存在key(单个)
function hasIn(object, key) {
    return object != null && key in Object(object)
}

//从对象拿取需要的数据
exports.pick =  function pick(obj,...keys){
    if(obj == null)
        return null;
    let index = -1;
    let result = {};
    while(++index <keys.length){
        const key = keys[index];
        if(hasIn(obj,key)){
            //对象存在该属性，则添加该属性
            Object.defineProperty(result, key, {
                value : obj[key],
                writable : true,
                enumerable : true,
                configurable : true
            });
        }
    }
    return result;
};

exports.clone = function clone(obj,exclude) {  
    var newObj = {};
    exclude = Array.isArray(exclude) ? exclude : undefined;
    for(var i in obj) { 
        if(exclude && exclude.indexOf(i) != -1) continue;
        if(obj[i]&&(typeof(obj[i]) == "object" || typeof(obj[i]) == "function")) {  
            newObj[i] = clone(obj[i]);  
        }  
        else {  
            newObj[i] = obj[i];  
        }  
    }  
    return newObj;  
};  