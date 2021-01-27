[toc]

# 使用教程

## 1.导入框架

`npm install haorm -S`

## 2.初始化框架

### 配置

单个数据库

```
const MYSQL_CONFIG = {
    host     : 'localhost', //数据库地址
    port     : '3306', //端口
    user     : 'root', //用户名
    password : '123456',//数据库密码
    database : 'test', //数据库名
    connectionLimit: 1000 //连接池数量
};
可以参考mysql2的配置
```

读写分离数据库（数据同步需要数据库层面的另外设置）

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
数据库连接配置可以参考mysql2的配置

其中LoadBalance为字符串，目前含：
 - ROUNDROBIN //轮询
 - RANDOM //随机
 - WEIGHTEDROUNDROBIN //加权轮询
 - WEIGHTEDRANDOM //加权随机
```

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

```
{
	timeout: 4000 //数据库请求最大时间（ms），默认4000ms
}
```

## 3.注册模型

### QueryTypes查询类型

需要导入haorm包，不使用QueryTypes直接用字符串也是可以的。

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
            value : 'string'
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

### 模型管理器

```
const Haorm = require('haorm')
const u = Harom.getModel('user');//参数为注册模型的标签
```

## 4.

