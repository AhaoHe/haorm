// enum QueryTypes {
//     SELECT = 'SELECT',
//     INSERT = 'INSERT',
//     UPDATE = 'UPDATE',
//     DELETE = 'DELETE',
//     UPSERT = 'UPSERT',
//     READ = 'READ',
//     WRITE = 'WRITE',
//     NONE = 'NONE',//不映射为模型结果
// }

// module.exports = QueryTypes;
const QueryTypes = module.exports = { // eslint-disable-line
    SELECT : 'SELECT',
    INSERT : 'INSERT',
    UPDATE : 'UPDATE',
    DELETE : 'DELETE',
    UPSERT : 'UPSERT',
    READ : 'READ',
    WRITE : 'WRITE',
    NONE : 'NONE',//不映射为模型结果
};
  
