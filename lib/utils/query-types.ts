enum QueryTypes {
    SELECT = 'SELECT',
    INSERT = 'INSERT',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    UPSERT = 'UPSERT',
    READ = 'READ',
    WRITE = 'WRITE',
    NONE = 'NONE',//不映射为模型结果
}

module.exports = QueryTypes;

