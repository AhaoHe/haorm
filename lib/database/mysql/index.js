const AbstractDatabase = require('../abstract');
const QueryGenerator = require('./query-generator');
const Query = require('./query');
const ConnectionManager = require('./connect-manager');

class MysqlDatabase extends AbstractDatabase {
    constructor(orm) {
        super();
        this.orm = orm;
        this.connectionManager = new ConnectionManager(this, orm);
        this.queryGenerator = new QueryGenerator(this);
        this.Query = Query
    }

}

MysqlDatabase.prototype.name = 'mysql';

module.exports.Query = Query;
module.exports = MysqlDatabase;
module.exports.default = MysqlDatabase;