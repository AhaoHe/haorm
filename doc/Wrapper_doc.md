**\- [使用方法](#使用方法)**

**\- [Wrapper的链式方法](#wrapper的链式方法)**

  \- [select(params)](#selectparams)

  \- [insert(params)](#insertparams)

  \- [update(params)](#updateparams)

  \- [delete()](#delete)

  \- [from()](#from)

  \- [where([params])](#whereparams)

  \- [and()](#and)

  \- [or()](#or)

  \- [equal(key,val)](#equalkeyval)

  \- [notEqual(key,value)](#notequalkeyvalue)

  \- [in(key,value)](#inkeyvalue)

  \- [notIn(key,value)](#notinkeyvalue)

  \- [isNull(key)](#isnullkey)

  \- [isNotNull(key)](#isnotnullkey)

  \- [excute([config])【异步函数】](#excuteconfig异步函数)

  \- [getSql()](#getsql)

  \- [reset()](#reset)

看心情维护了。可能会有很多BUG。

# 使用方法

1.导入haorm包

`const Haorm = require('haorm') `

2.生成Haom类

`const sqlOperation = new Haorm('mysql',MYSQL_CONFIG,{timeout:4000});`

具体参考[操作文档-模型管理器（重要）](./Documentation.md###模型管理器（重要）)

3.新建Wrapper类

`const wrapper = sqlOperation.newWrapper('user');`

或者传入第二个参数（wrapper范围的配置）具体参考[操作文档-其他-配置参数](./Documentation.md#配置参数)

`const wrapper = sqlOperation.newWrapper('user',{timeout:4000});`

其中`'user'`为注册模型时的标签。

4.使用wrapper

链式调用，生成sql语句。

```
//sql为返回的SQL语句
let sql = wrapper.select('*').from().where({id:{value:'1',symbol:'='}}).getSql();
//提交查询
return await wrapper.excute();
或者 await wrapper.excute({timeout:4000});
//重置wrapper
wrapper.reset();
```

excute方法参数可以为空或者config，具体参考[操作文档-其他-配置参数](./Documentation.md#配置参数)

# Wrapper的链式方法

很多都可以参考[操作文档](./Documentation.md)和[condition参数文档](./conditions_doc.md)

以下接口的参数用`[]`包住的，表示可选，即可以不传该参数。

## select(params)

生成select开头的sql

- Array或Object类型。

  - **<span id='fields-Array'>Array类型时：</span>**

    1.数组成员为模型自定义的字段名称（一般为string类型）。

    2.当成员也为Array类型时，如`['count',{key:'id',tag:'id',distinct:true}]`，表示使用SQL的统计函数。含4种统计函数。第一个数据为统计函数类型，第二个为具体操作。

    - 成员第一个数据(string类型)可以为`count`,`max`,`min`,`sum`。分别为数量、最大值、最小值、求和。

    - 成员第二个数据为Object对象，含`key`,`tag`,`distinct【可选】`这3个键值，其中`key`为需要统计的模型自定义的字段名称，`tag`为自定义的返回数据列的名称，`distinct`为是否去除重复列【可选键值】。

    **PS：**只有`count`统计函数的`key`可以为`1`或者`*`，其他的`key`必须有对应的列

    例子：

    ```
    {
    	fields:[
    		'id',
    		['count',{key:'*',tag:'count'}],
    		['count',{key:1,tag:'count1',distinct:true}],
    		['max',{key:id,tag:'max'}]
    	]
    }
    生成列==> id,COUNT(*) AS count,COUNT(1) AS count1,MAX(id) AS max
    ```

  - **Object类型时：**

    含2个键值，`include`和`exclude`，分别表示包含哪些列和不包含哪些列。**优先排除**

    `include`用于需要返回所有列，但额外需要使用统计函数的时候。值参考上面的[Array类型](#fields-Array)。

    `exclude`用于需要排除部分列，但其他列仍然需要的时候。值参考上面的[Array类型](#fields-Array)。

    例子：

    ```
    假如有id、name、mail这3个列
    {
    	fields:{
    		include:['count',{key:'id',tag:'count'}],
    		exclude:['mail']
    	}
    }
    生成列==> id,name,COUNT(id) AS count
    ```

## insert(params)

生成insert开头的sql

- params : object类型。插入的数据，使用键值对，键表示模型的列名称，值表示插入的值。如下：

  ```
  {
  	id:1,
  	name:'name'
  }
  ```


## update(params)

生成update开头的sql

- params : object类型。修改的数据，使用键值对，键表示模型的列名称，值表示更新的值。

  **PS：**如果存在id（主键）的键值，自动在条件中使用`WHERE id = 值`。如下：

  ```
  {
  	name:'name',
  	mail:'123@qq.com'
  } ==> UPDATE name,mail 
  或者
  {
  	id: 1,//主键
  	name:'name',
  	mail:'123@qq.com'
  } ==> UPDATE name,mail WHERE id = 1
  ```


## delete()

生成删除开头的sql

## from()

生成from，只在select语句中生效果，其他跳过。

## where([params])

生成where语句。

如果params不为空，参考[condition参数文档](./conditions_doc.md)的where篇

如果为string类型，使用自定义语句（需要自己开头写`where`）。

如果params为空，即不使用参数，只插入一个`where`

## and()

添加一个`and`连接

## or()

添加一个`or`连接

## equal(key,val)

添加一个条件筛选，某个列等于什么值。

**\- `key`:** 模型自定义列名称

**\- val:** 需要筛选相等的值

比如`wrapper.equal('id',1)` => `id='1'`

## notEqual(key,value)

添加一个条件筛选，某个列不等于什么值。

**\- `key`:** 模型自定义列名称

**\- val:** 需要筛选不相等的值

比如`wrapper.notEqual('id',1)` => `id!='1'`

## in(key,value)

添加一个条件筛选，某个列在哪些值的集合里面相等。

**\- `key`:** 模型自定义列名称

**\- val:** Array类型或String类型（string类型时，多个值用`,`逗号分隔）。需要筛选相等的值的集合

比如`wrapper.in('id',[1,2])` 或`wrapper.in('id','1,2')`=> `id IN ('1','2')`

## notIn(key,value)

添加一个条件筛选，某个列在哪些值的集合里面不相等。

**\- `key`:** 模型自定义列名称

**\- val:** Array类型或String类型（string类型时，多个值用`,`逗号分隔）。需要筛选不相等的值的集合

比如`wrapper.notIn('id',[1,2])` 或`wrapper.notIn('id','1,2')`=> `id NOT IN ('1','2')`

## isNull(key)

添加一个条件筛选，某个列为空。

**\- `key`:** 模型自定义列名称。

比如`wrapper.isNull('id')` => `id IS NULL`

## isNotNull(key)

添加一个条件筛选，某个列不为空。

**\- `key`:** 模型自定义列名称。

比如`wrapper.isNotNull('id')` => `id IS NOT NULL`

## excute([config])【异步函数】

提交数据库语句，config可以为空或配置对象Object（具体参考[操作文档-其他-配置参数](./Documentation.md)）

## getSql()

返回生成的数据库语句

## reset()

重置wrapper类，重新开始生成sql语句。