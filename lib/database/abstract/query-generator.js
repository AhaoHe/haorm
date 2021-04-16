const ParamsValidation = require('./helper/params-validation')
class QueryGenerator{
    constructor(){
        this.validation = ParamsValidation;
    }
}

module.exports = QueryGenerator;
module.exports.default = QueryGenerator;