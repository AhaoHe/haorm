class BaseError extends Error {
    constructor(message ?: string) {
      super(message);
      this.name = 'OrmBaseError';
    }
}
  
module.exports = BaseError;
module.exports.default = BaseError;
export default BaseError;