class ParamsValidation{
    constructor(){
        
    }

    //struct里的一个值，val是传入的值
    static verify(fields,val){
        let validate = fields.validate;
        for(let key in validate){
            //自定义
            if (typeof validate[key] == 'function')
                validate[key](val);
            //直接可以用的判断
            let msg = '';
            let args = validate[key];
            if(!Array.isArray(validate[key]) && typeof validate[key] == 'object' && !(validate[key] instanceof RegExp)){
                msg = validate[key].msg;
                args = validate[key].args;
            }
            if(args){
                switch(key){
                    case 'notNull':
                        msg = msg == '' ? `${fields.fieldName} can't be NULL or undefined!` : msg;
                        this._notNull(msg,val);
                        break;
                    case 'notEmpty':
                        msg = msg == '' ? `${fields.fieldName} can't be Empty!` : msg;
                        this._notEmpty(msg,val);
                        break;
                    case 'is':
                        msg = msg == '' ? `${fields.fieldName} is not match ${val}!` : msg;
                        this._is(msg,val,args);
                        break;
                    case 'not':
                        msg = msg == '' ? `${fields.fieldName} can't match ${val}!` : msg;
                        this._not(msg,val,args);
                        break;
                    case 'max':
                        msg = msg == '' ? `${fields.fieldName} must be number and less than ${args}!` : msg;
                        this._max(msg,val,args);
                        break;
                    case 'min':
                        msg = msg == '' ? `${fields.fieldName} must be number and greater than ${args}!` : msg;
                        this._min(msg,val,args);
                        break;
                    case 'len':
                        msg = msg == '' ? `${fields.fieldName}'s length is not in the inter [${args[0]},${args[1]}]!` : msg;
                        this._len(msg,val,args);
                        break;
                    case 'isDate':
                        msg = msg == '' ? `${fields.fieldName}'s type is not Date!` : msg;
                        this._isDate(msg,val);
                        break;
                    case 'isInt':
                        msg = msg == '' ? `${fields.fieldName}'s type is not int!` : msg;
                        this._isInt(msg,val);
                        break;
                    case 'isFloat':
                        msg = msg == '' ? `${fields.fieldName}'s type is not float!` : msg;
                        this._isFloat(msg,val);
                        break;
                    case 'isIn':
                        msg = msg == '' ? `${fields.fieldName} is not one of ['isIn'] and 'isIn' need be array!` : msg;
                        this._isIn(msg,val,args);
                        break;
                    case 'notIn':
                        msg = msg == '' ? `${fields.fieldName} is not one of [${args.join(',')}]!` : msg;
                        this._notIn(msg,val,args);
                        break;
                    case 'contains':
                        msg = msg == '' ? `${fields.fieldName} does not contain ${val} and 'contains' need be string!` : msg;
                        this._contains(msg,val,args);
                        break;
                    case 'notContains':
                        msg = msg == '' ? `${fields.fieldName} contains ${val}!` : msg;
                        this._notContains(msg,val,args);
                        break;
                    case 'isLowercase':
                        msg = msg == '' ? `${fields.fieldName} is not Lowercase(value:'${val}')!` : msg;
                        this._isLowercase(msg,val);
                        break;
                    case 'isUppercase':
                        msg = msg == '' ? `${fields.fieldName} is not Uppercase(value:'${val}')!` : msg;
                        this._isUppercase(msg,val);
                        break;
                }
            }
        }
    }

    static _notNull(msg,val){
        if(val == undefined || val == null)
            throw new Error(msg);
    }
    
    static _notEmpty(msg,val){
        if(val == '')
            throw new Error(msg);
    }

    static _is(msg,val,regExp){
        let reg;
        if(Array.isArray(regExp)){
            reg = new RegExp(regExp[0],regExp[1])
        }
        else{
            reg = new RegExp(regExp)
        }
        if(!reg.test(val)){
            throw new Error(msg);
        }
    }

    static _not(msg,val,regExp){
        let reg;
        if(Array.isArray(regExp)){
            reg = new RegExp(regExp[0],regExp[1])
        }
        else{
            reg = new RegExp(regExp)
        }
        if(reg.test(val)){
            throw new Error(msg);
        }
    }

    static _max(msg,val,num){
        if(typeof val != 'number' || typeof num != 'number' || val > num){
            throw new Error(msg);
        }
    }

    static _min(msg,val,num){
        if(typeof val != 'number' || typeof num != 'number' || val < num){
            throw new Error(msg);
        }
    }

    static _len(msg,val,len){
        if(!Array.isArray(len)){
            throw new Error(`'len' need be array!`);
        }
        const isType = Array.isArray(val) || typeof val == 'string';
        let length =  0;
        if(isType){
            length = val.length;
            if(len[1] < 0)  len[1] = length;
        }
        if(!isType || len[0] > length || length > len[1] ){
            throw new Error(msg);
        }
    }

    static _isDate(msg,val){
        if(!isNaN(val) || isNaN(Date.parse(val))){
        　　throw new Error(msg);
        }
    }
    
    static _isInt(msg,val){
        if(typeof val === 'string' && !isNaN(val)){//纯数字字符串
            val = Number(val);
        }
        if(typeof val !== 'number' || val % 1 !== 0)
            throw new Error(msg);
    }

    static _isFloat(msg,val){
        if(typeof val === 'string' && !isNaN(val)){//纯数字字符串
            val = Number(val);
        }
        if(typeof val !== 'number' || val % 1 === 0/* val === parseInt(val) */){
            throw new Error(msg);
        }
    }

    static _isIn(msg,val,inVal){
        if(!Array.isArray(inVal) || !inVal.includes(val)){
            throw new Error(msg);
        }
    }

    static _notIn(msg,val,inVal){
        if(Array.isArray(inVal) && inVal.includes(val)){
            throw new Error(msg);
        }
    }

    static _contains(msg,val,str){
        if(typeof str != 'string' || !str.includes(val)){
            throw new Error(msg);
        }
    }

    static _notContains(msg,val,str){
        if(typeof str == 'string' && str.includes(val)){
            throw new Error(msg);
        }
    }

    static _isLowercase(msg,val){
        if(typeof val == 'string' && val.toLocaleLowerCase() != val){
            throw new Error(msg);
        }
    }

    static _isUppercase(msg,val){
        if(typeof val == 'string' && val.toLocaleUpperCase() != val){
            throw new Error(msg);
        }
    }

}

module.exports.default = ParamsValidation;
module.exports = ParamsValidation;