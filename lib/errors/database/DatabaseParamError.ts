const BaseError = require('../BaseError')
//import BaseError from '../BaseError'
class DatabaseParamError extends BaseError{
    constructor(message: string){
        super(message);
        this.name = 'DatabaseParamError';
    }
}

module.exports = DatabaseParamError;
export default DatabaseParamError;
