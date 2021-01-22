const BaseError = require('./BaseError')

class ConfigError extends BaseError{
    constructor(message: string){
        super(message);
        this.name = 'OrmConfigError';
    }
}

export default ConfigError;
module.exports = ConfigError;