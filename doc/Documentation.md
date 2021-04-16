**\- [基础教程](#基础教程)**

  \- [1.导入框架](#1导入框架)

  \- [2.初始化框架](#2初始化框架)

​    \- [配置](#配置)

​    \- [导入依赖](#导入依赖)

​    \- [创建启动类](#创建启动类)

  \- [3.注册模型](#3注册模型)

​    \- [QueryTypes查询类型](#querytypes查询类型)

​    \- [初始化实体类](#初始化实体类)

​    \- [模型管理器（重要）](#模型管理器（重要）)

​    \- [验证 & 约束](#验证--约束)

  \- [4.数据库操作（基础）](#4数据库操作（基础）)

​    \- [查询](#查询)

​    \- [插入/更新](#插入更新)

​    \- [删除](#删除)

  \- [5.表关联查询（进阶）](#5表关联查询（进阶）)

  \- [6.自定义查询](#6自定义查询)

**\- [其他](#其他)**

  \- [1.Wrapper查询](#1wrapper查询)

  \- [2.事务](#2事务)

  \- [3.配置参数](#3配置参数)

  \- [4.依赖项](#4依赖项)

  \- [5.关于](#5关于)

# 基础教程

## 1.导入框架

`npm install haorm -S`

## 2.初始化框架

### 配置

**数据库连接配置可以参考mysql2的配置**

- 单个数据库

```
const MYSQL_CONFIG = {
    host     : 'localhost', //数据库地址
    port     : '3306', //端口
    user     : 'root', //用户名
    password : '123456',//数据库密码
    database : 'test', //数据库名
    connectionLimit: 1000 //连接池数量
};
```

- 读写分离数据库（数据同步需要数据库层面的另外设置）

```
const MYSQL_CONFIG = {
    LoadBalance: 'Default', //负载均衡策略（具体在下面）
    Expiration: 120 * 1000, //单点故障（ms）
    read:[{ //读库列表（从）
        host     : 'localhost', //数据库地址
        port     : '3306', //端口
        user     : 'root', //数据库用户名
        password : '123456', //数据库密码
        database : 'test' //数据库库名
        weight   : 2, //权重（负载均衡策略为加权时）默认1
    },{
        host     : 'localhost',
        port     : '3306',
        user     : 'root', 
        password : '123456',
        database : 'test',
        weight   : 4,
        connectionLimit: 4000 //连接池最大连接数量
    }],
    write:[{ //写库列表（主）
        host     : 'localhost',
        port     : '3306',
        user     : 'root',
        password : '123456',
        database : 'test'
    },{
        host     : 'localhost',
        port     : '3306',
        user     : 'root',
        password : '123456',
        database : 'test',
        weight   : 4,
        connectionLimit: 4000
    }],
    common:{ //所有数据库配置通用设置,单个设置优先
        connectionLimit: 2000
    }
}
```

- 其中LoadBalance为字符串，目前含：

  + ROUNDROBIN //轮询

  + RANDOM //随机

  + WEIGHTEDROUNDROBIN //加权轮询

  + WEIGHTEDRANDOM //加权随机

### 导入依赖

`const { Haorm } = require('haorm')`

或`const Haorm = require('haorm')`

### 创建启动类

```
const haorm= new Haorm('mysql',MYSQL_CONFIG,{timeout:4000});
```

Haorm构造器含三个参数：
1.第一个参数——指定数据库类型【必填】。
	字符串，目前仅含mysql
2.第二个参数——数据库连接配置【必填】。
	\- 参考[数据库配置](#配置)
3.第三个参数——其他全局配置【选填】。

​	\- 可以才能考[配置参数](##3.配置参数)

```
{
	timeout: 4000 //数据库请求最大时间（ms），默认4000ms
}
```

## 3.注册模型

### QueryTypes查询类型

**需要导入haorm包**，不使用QueryTypes直接用字符串也是可以的。

读(READ)写(WRITE)或者增(INSERT)删(DELETE)改(UPDATE)查(SELECT)可以用来**选择和判断使用主从库**。

- SELECT : 'SELECT',
- INSERT : 'INSERT',
- UPDATE : 'UPDATE',
- DELETE : 'DELETE',
- UPSERT : 'UPSERT',
- READ : 'READ',
- WRITE : 'WRITE',

### 初始化实体类

使用Haorm类中的define方法注册模型（参考如下代码）

define方法含2个参数：
1.第一个参数——标签，用于从模型管理器中获取模型【必填】。
	自定义字符串。唯一标签、不可重复。
2.第二个参数——数据库连接配置【必填】。
	\- 参考如下代码的注释

```
const { Haorm,QueryTypes } = require('haorm')
const haorm= new Haorm('mysql',MYSQL_CONFIG,{timeout:4000});
const user = haorm.define('user'/*标签，用于模型管理*/,{
    tablename:'b_user',//表名
    struct : {
    //数据库结构，key为自定义名称（开头不能为$）
        id : {
            fieldName : 'id',//表字段名称
            value : 'number',//暂时没用
            primarykey: true //是否是主键
        },
        name : {
            fieldName : 'u_login',
            value : 'string',
            validate:{//【可选】验证，参考验证 & 约束的章节
            	not:'ttt',
            	//自定义方法
            	notTTT(val){
            		if(val == 'ttt'){
            			throw new Error('validate error!');
            		}
            	}
            }
        },
        password : {
            fieldName : 'u_passwd',
            value : 'string',
            ignore:[QueryTypes.UPDATE] //忽略的操作，例子为修改时忽略该字段
        },
        mail : {
            fieldName : 'u_mail',
            value : 'string'
        }
    },
    cache: true //该模型是否使用二级缓存
})
```

### 模型管理器（重要）

- 先导入haorm框架包

  ```
  const Haorm = require('haorm')
  ```

- 获取模型

  示例中user为标签

  ```
  //'user'为标签
  const userModel = Harom.getModel('user'); //参数为注册模型的标签
  ```
  
- 获取接口

  1.基础查询接口，不存在缓存，**不建议使用**
  
  ```
  const interface = userModel.getInterface(); //基础查询接口，不存在缓存，不建议使用
  ```
  
  2.session里包含了查询接口，同时使用session则自动开启了一级缓存
  
  ```
  const session = Harom.openSession('user'); //session里包含了查询接口，同时使用session则自动开启了一级缓存
  或者
  const session = Harom.openSession('user',{timeout:1000}); //第二个参数表示session的全局配置
  ```
  
  可以更换session里的模型（更换其他表查询）
  
  ```
  session.changeModel('group'); //'group'为注册模型时的标签
  或者
  const groupModel = Harom.getModel('group');
  session.changeModel(groupModel); //直接使用模型更换
  ```
  
  开启事务（具体参考[其他-事务](##2.事务)章节）
  
  ```
  session.beginTransaction();
  session.push(sql/*自定义sql语句*/)或者session.insert({name:'abc'});
  cosnt result = session.commit();//结果按照顺序排列
  ```

### 验证 & 约束

在[创建模型](#初始化实体类)的时候，使用`validate`参数即可使用。

```
mail:{
	fieldName : 'u_mail',
  validate:{
    is: /^[a-z]+$/i,          // 匹配这个 RegExp
    is: ["^[a-z]+$",'i'],     // 与上面相同,但是以字符串构造 RegExp
    not: /^[a-z]+$/i,         // 不匹配 RegExp
    not: ["^[a-z]+$",'i'],    // 与上面相同,但是以字符串构造 RegExp
    isInt: true,              // 检查有效的整数
    isFloat: true,            // 检查有效的浮点数
    isLowercase: true,        // 检查小写
    isUppercase: true,        // 检查大写
    notNull: true,            // 不允许为空
    isNull: true,             // 只允许为空
    notEmpty: true,           // 不允许空字符串
    contains: 'foo',          // 强制特定子字符串
    notIn: ['foo', 'bar'],    // 检查值不是这些之一
    isIn: ['foo', 'bar'],     // 检查值是其中之一
    notContains: 'bar',       // 不允许特定的子字符串
    len: [2,10],              // 仅允许长度在2到10之间的值,第二个小于0时表示最大长度无限。
    isDate: true,             // 只允许日期字符串
    max: 23,                  // 仅允许值 <= 23
    min: 23,                  // 仅允许值 >= 23

    // 自定义验证器的示例:
    nottt(val){
      if(val == 'ttt'){
          throw new Error('test is success!');
      }
    }

    DivideBy2(value) {
      if (parseInt(value) % 2 !== 0) {
        throw new Error('can't divide by two!');
      }
    }

  }
}
```

## 4.数据库操作（基础）

以下接口的参数用`[]`包住的，表示可选，即可以不传该参数。

**PS：所有方法均为异步，所以一定要使用async-await**

### 查询

- **findList([conditions,config])** ：基础查询

  - conditions : 【可选】Object或String类型。条件。不选择默认返回所有列。参考：[conditions参数文档](./conditions_doc.md)
  - config : 【可选】object类型。局部配置（优先级最高）。

- **findAll([conditions,config])** ：查询所有（经过项目迭代，已经**等同于findList**了）
  
  - conditions : 【可选】Object或String类型。条件。不选择默认返回所有列。参考：[conditions参数文档](./conditions_doc.md)
  - config : 【可选】object类型。局部配置（优先级最高）。
  
- **findOne([conditions,config])** ：仅查询一条/只获取第一条（底层使用了`limit 1`语句）
  
  - conditions : 【可选】Object或String类型。条件。参考：[conditions参数文档](./conditions_doc.md)
  - config : 【可选】object类型。局部配置（优先级最高）。
  
- **findById(id,[fields,config])** ：根据id查询（底层采用`WHERE id = 'id'`的sql语句）
  - id : string或number类型。查询的主键条件的值。
  
    当id为Array时，表示主键条件符合等于多个值

  - fields : 【可选】object或者array类型。需要查询的列。不选则返回所有列。
  
  - config : 【可选】object类型。局部配置（优先级最高）。
  
- **findAndCountAll([conditions,config])** : 查询结果和不带`limit`和`offset`的条件结果数量（结合了 `findAll` 和 `count` 的便捷方法）

  - conditions : 【可选】Object或String类型。条件。不选择默认返回所有列。参考：[conditions参数文档](./conditions_doc.md)
  - config : 【可选】object类型。局部配置（优先级最高）。

- **count([conditions,config])** ：获取查询的数量。
  
  - conditions : 【可选】object类型。条件。参考：[conditions参数文档](./conditions_doc.md)
  - config : 【可选】object类型。局部配置（优先级最高）。
  
- **max(key,[conditions,config])** ：获取某列的最大值。
  
  - key : string类型。模型的列名称。
  - conditions : 【可选】object类型。条件。参考：[conditions参数文档](./conditions_doc.md)
  - config : 【可选】object类型。局部配置（优先级最高）。
  
- **min(key,[conditions,config])** ：获取某列的最小值。
  
  - key : string类型。模型的列名称。
  - conditions : 【可选】object类型。条件。参考：[conditions参数文档](./conditions_doc.md)
  - config : 【可选】object类型。局部配置（优先级最高）。
  
- **sum(key,[conditions,config])** ：获取某列的求和。
  
  - key : string类型。模型的列名称。
  - conditions : 【可选】object类型。条件。参考：[conditions参数文档](./conditions_doc.md)
  - config : 【可选】object类型。局部配置（优先级最高）。

**\- 返回值：**

  ```
  findXXX之类的方法：
  {
  	results:[
  		{每行的结果(key键为自定义的列名)}
  		{每行的结果,$join:[{},{}]}//如果有表连接，则会出现$join的键key，为数组Array格式，表示第几个表连接。
  	]
  }
  
  count、sum、max、min等统计函数的方法
  直接返回统计结果，比如 100 (Number类型)。
  ```

### 插入/更新

- **insert(params,[config])** ：插入数据

  - params : object类型。插入的数据，使用键值对，键表示模型的列名称，值表示插入的值。如下：

    ```
    {
    	id:1,
    	name:'name'
    }
    ```

  - config : 【可选】object类型。局部配置（优先级最高）。

- **update(params,conditions,[config])** : 更新数据

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

  - conditions : 【可选，如果params存在主键】object类型。条件参考：[conditions参数文档](./conditions_doc.md)（仅使用where和limit条件）。

    ```
    update更新有一个特殊的配置参数noWhere。默认为false。为ture时，才可以不带WHERE;
    {
    	noWhere: true //默认为false。为ture时，才可以不带WHERE。
    }
    ```

  - config : 【可选】object类型。局部配置（优先级最高）。

- **saveOrUpdate(params,[config])** : 更新或插入（更新无效后插入数据）

  - params : object类型。修改的数据，使用键值对，键表示模型的列名称，值表示更新/插入的值。

    **PS：必须包含主键（id）**,如下：

    ```
    {
    	id: 1,
    	name: 'TEST'
    }
    ```

  - config : 【可选】object类型。局部配置（优先级最高）。

**\- 返回值：**

  ```
  插入insert(params)的方法：
  {
  	results:[10,11], //插入后自动递增生成的主键，根据params的顺序排列。
  	affectedRows: 2, //影响的行数
  }
  
  更新的方法
  {
  	affectedRows: 2, //影响的行数
  }
  ```

### 删除

- **delete(conditions,[config])** : 删除数据

  - conditions: object类型。条件参考：[conditions参数文档](./conditions_doc.md)（仅使用where和limit条件）。

    ```
    delete删除有一个特殊的参数noWhere。默认为false。为ture时，才可以不带WHERE;
    {
    	noWhere: true //默认为false。为ture时，才可以不带WHERE。
    }
    ```

    conditions例子如下：

    ```
    {
    	where:{
            id: 1, //默认使用=
            name:{value:'name',symbol:'!='} //需要其他符号判断，可以使用这种格式
        }
    }
    或者
    [{key:'id',value:1,symbol:'='},{key:'name',value:'name',symbol:'!='}]
    ==> DELET WHERE id = 1 AND name != 'name'
    ```

  - config : 【可选】object类型。局部配置（优先级最高）。

- **deleteById(id,config)** : 根据(id)主键删除数据

  - id : string或number或Array类型。查询的主键条件的值。

    当id为Array时，表示主键条件符合等于多个值

  - config : 【可选】object类型。局部配置（优先级最高）。

\- 返回值

```
  删除的方法
  {
  	affectedRows: 2, //影响的行数
  }
```

## 5.表关联查询（进阶）

参考：[conditions参数文档-join表连接](./conditions_doc.md)

## 6.自定义查询

1.使用基础查询接口（不使用缓存）【**不推荐**】

```
const result = Harom.query(sql,config);
```

- sql : string或array类型。

- config : 【可选】object类型。局部配置（优先级最高）。此时**建议使用type参数**，可以参考[QueryType](###QueryTypes查询类型)

  ```
  {
  	//设置你查询的sql语句的类型,QueryType需要导入haorm框架包
  	type:'SELECT'或者 QueryType.SELECT 
  	model: 需要查询的model //如果没有，就不使用二级缓存
  }
  ```

2.使用openSession()的查询接口（使用缓存）【**推荐**】

- 导入haorm包，`const Haorm = require('haorm') `

- 生成Haom类，`const sqlOperation = new Haorm('mysql',MYSQL_CONFIG,{timeout:4000});`

- 开启session，`let session = sqlOperation.openSession('user');`

- 使用自定义查询，`let result = session.query(sql,config)`

  - sql : string或array类型。

  - config : 【可选】object类型。局部配置（优先级最高）。此时**建议使用type参数**，可以参考[QueryType](###QueryTypes查询类型)

    ```
    {
    	//设置你查询的sql语句的类型,QueryType需要导入haorm框架包
    	type:'SELECT'或者 QueryType.SELECT
    	//model默认已经添加上了
    }
    ```

# 其他

## 1.Wrapper查询

虽然已经实现部分功能，但**未来版本不再维护**。仅个人练手而实现。

参考：[Wrapper文档](./Wrapper_doc.md)

## 2.事务

导入haorm包`const Haorm = require('haorm') `

生成Haom类`const sqlOperation = new Haorm('mysql',MYSQL_CONFIG,{timeout:4000});`

开启session，同时开启事务

```
let session = sqlOperation.openSession('user');
session.beginTransaction();
```

进行查询（期间不输出结果），比如

```
let resultT = await session.update({id:1,name:'name'});
resultT = await session.insert({name:'name2'});
//resultT is undefined
```

最后提交事务，commit()方法参数可以为空或者config（参考[3.配置参数](##3.配置参数)）

```
let result = session.commit();
或者let result = await session.commit({timeout:4000});
```

此时，result结果输出，为Array数组类型，按照查询的顺序排列。比如例子中第一个为更新结果、第二个为插入结果。

## 3.配置参数

- 参数

  **\- timeout :** number类型。连接请求超时时间，单位ms。默认4000ms。

  **\- type :** string类型。查询类型，参考[QueryType](###QueryTypes查询类型)。READ和WRITE等可以用于选择主从数据库。**不建议使用**，不填写使用默认即可。

  **\- model:** 模型类，关乎二级缓存。如果使用session默认会添加对应的model模型。如果使用原始接口但没添加model，则不使用缓存。

- 结构如下：

  ```
  {
  	timeout: 4000
  }
  ```

## 4.依赖项

"mysql2": "^2.2.5",
"sqlstring": "^2.3.2"

## 5.关于

邮箱（ahaohe@foxmail.com）

