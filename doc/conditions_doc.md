**\- [Condition参数](#condition参数)**

  \- [1.distinct - 去重](#1distinct---去重)

  \- [2.fields - 需要返回的列信息](#2fields---需要返回的列信息)

  \- [3.where - 条件判断、筛选](#3where---条件判断筛选)

  \- [4.order - 排序](#4order---排序)

  \- [5.limit - 限制操作数量或分页](#5limit----限制操作数量或分页)

  \- [6.offset - 偏移量](#6offset---偏移量)

  \- [7.group - 分组](#7group---分组)

  \- [8.having - 查询后的条件判断、筛选](#8having---查询后的条件判断筛选)

  \- [9.join - 表连接](#9join---表连接)

  \- [10.define - 自定义条件](#10.define - 自定义条件)

**\- [其他](#其他)**

  \- [on - 表连接 - 条件判断、筛选](#on---表连接---条件判断筛选)

  \- [symbol - 符号](#symbol---符号)

**\- [总览](#总览)**

# Condition参数

**Condition为String类型自定义条件并查询所有列，Condition为Object类型时参考如下**

## 1.distinct - 去重

- boolean类型。

  是否去除重复列。默认false，true表示使用，false不使用。

## 2.fields - 需要返回的列信息

- Array或Object或String类型。

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

  - **String类型时：**

    自定义字符串，自定义列。

## 3.where - 条件判断、筛选

- Array或Object类型。

  - **<span id="where-array">Array类型时</span>：**用于快速生成WHERE，只能使用`AND`。

    成员数据为Object类型，含`key`、`symbol`、`value`这3个键值。

    - **`key` :** 模型自定义列名称
    - **`symbol` :** string字符串类型，Where里的符号，直接参考sql里的，`IN`、`LIKE`等这些都可以之间填写。可以参考[symbol - 符号](##symbol - 符号)。
    - **`value` :** 需要等于的值。如果symbol使用`IN`可以为Array类型或逗号`,`间隔的字符串。使用`LIKE`可以使用`%`表示模糊查询，一切都跟SQL异曲同工。

    例子：

    ```
    {
    	where:[
            {key:'id' ,symbol:'=' , value:'1'},
            {key:'name' ,symbol:'NOT LIKE' , value:'%test'}
            {key:'id' ,symbol:'not in',value:[1,2]或者'1,2'}
    	]
    }
    生成where==> WHERE `id` = '1' AND name NOT LIKE '%test' AND id NOT IN (1,2)
    ```

  - **Object类型：**用于使用特殊连接的时候。比如需要OR、OR与AND一起使用的时候。

    键值可以为`模型自定义列名称`、`$and`、`$or`。

    - **`模型自定义列名称` :** 键值为列名称，值为Object对象——包含`symbol `、`value`两个键值。可以参考[Array类型时](#where-array)
    - **`$and` :** 值为Array类型，数组每个成员数据为Object对象，里面的内容与WHERE的Object类型雷同，是**嵌套递归**的。使用`AND`连接。
    - **`$or` ：** 值为Array类型，数组每个成员数据为Object对象，里面的内容与WHERE的Object类型雷同，是**嵌套递归**的。使用`OR`连接。

    例子：

    ```
    {
    	where:{
            id:{value:'1',symbol:'>'},
            $and:[{
                    id:{value:'1',symbol:'>'},
                    name:{value:'name',symbol:'!='}
                },{
                    id:{value:'1',symbol:'>'}
                    $or:[{
                            id: {value:'1',symbol:'>'}
                        },{
                            id: {value:'1',symbol:'>'}
                        }
                    ]
                }
            ]
        }
    }
    生成where==> WHERE id > '1' AND ((id >1 AND nmae != 'name') AND (id >1 AND (id >1 OR id >1))
    ```


## 4.order - 排序

- Object或Array或String类型

  - **Object类型：**一共2个键值，`order`和`params`。

    - **`order` :** string字符串类型。可以使用`ASC`和`DESC`，分别表示升序和降序。

    - **`params` :** Array类型。数组的成员数据为string字符串或者Array数组类型。

      1.param的成员数据为字符串时表示自定义的模型列名称。

      2.param的成员数据为数组时，成员数据长度为2，第一个表示自定义的模型列名称，第二个表示第几个表（算上join的表，按照顺序排列）。

  - **Array类型：**

    数组的成员数据为string字符串或者Array数组类型。

    字符串时表示自定义的模型列名称。数组时可以有2个成员，第一个表示自定义的模型列名称，第二个表示第几个表（算上join的表，按照顺序排列，**从0开始**）。

  - **String类型：**表示自定义的模型列名称。默认采用第一张表。

  例子：

  ```
  {
  	order:'id'
  } 
  生成==> ORDER BY `id`
  
  {
  	order: {
  		order:'ASC',
  		params: ['id',['id',1]]
  	}
  	或 (等价于)
  	oder: ['id',['id',1]]
  }
  生成 ==> ORDER BY 第一张表.id,第2张表.id
  ```

## 5.limit -  限制操作数量或分页

- Number或Array类型。

  - **Array类型时：**

    数组长度为2。第一个数据为offset偏移量，第二个为limit限制数。

  - **Number类型时：**

    表示限制操作的数量

  例子：

  ```
  {
  	limit: 2
  }
  生成 ==> LIMIT 2
  
  {
  	limit: [0,2]
  }
  生成 ==> LIMIT 0,2  (类似于 OFFSET 0 LIMIT 2 )
  ```

## 6.offset - 偏移量

- Number类型

  表示跳过多少条数据

  例子：

  ```
  {
  	offset:1
  }
  生成==> OFFSET 1
  ```

## 7.group - 分组

- Array或String类型

    - **Array类型：**

      数组的成员数据为string字符串或者Array数组类型。

      字符串时表示自定义的模型列名称。数组时可以有2个成员，第一个表示自定义的模型列名称，第二个表示第几个表（算上join的表，按照顺序排列，**从0开始**）。

    - **String类型：**表示自定义的模型列名称。默认采用第一张表。

  例子：

  ```
  {
  	group:'id'
  }
  生成==> GROUP BY `id`
  
  {
  	group:['id',['id',1]]
  }
  生成 ==> GROUP BY 第一张表.id,第2张表.id
  ```

## 8.having - 查询后的条件判断、筛选

值等同于[where](##3.where - 条件判断、筛选)，参考[where](##3.where - 条件判断、筛选)即可。

## 9.join - 表连接

- Array类型

  数组的成员数据的类型为Object。有如下几个参数：

  **\- `link`**【可选】【默认`left`】

  String类型。含`left`、`right`、`union`、`inner`这4个参数。

  **\- `fields`**【若`conditions`中含fields则可选】【优先于`conditions`里的fields】

  Object类型。可以参考[fields](##2.fields - 需要返回的列信息)。

  **\- `conditions`**

  参数可以参考（等同于）conditions自身，相当于递归。

  **\- `on`**【using和on二选一】【优先on】

  Array或Object类型。由于较为复杂，请移步[on的介绍段落](##on - 表连接 - 条件判断、筛选)。（其实和[where](##3.where - 条件判断、筛选)也非常相似）

  **\- `using`**【using和on二选一】【优先on】

  String或Array类型。String或Array成员数据（String类型）均表示为模型自定义列名称。

  （SQL上等同于 ON A.id = B.id）

  **\- `ignore`**【可选】【默认false】

  Boolean类型。是否返回join里面的结果。

- 例子：

  ```
  {
  	join:[{
          link : 'left'
          model : model(其他模型json)或 {struct:模型结构, tablename:'user'}(自定义)
          fields:['id','name'](选择的字段对应的模型结构key)
          conditions:{
              where:{
                  id : { value : 1 , 'symbol' : '='},
                  name : { value : 'name' , 'symbol' : '='}
              },
          },
          'on': {
              'id'(JOIN模型的字段) : { key : 'id'(原始模型的字段) , 'symbol' : '=' , index: 0 (哪个模型，默认0最外层，<=0表示最外层，1表示第几个join)},
              'name' : { value : 'name' , 'symbol' : '='}
          },
          using:['id']或'id', (using和on不能共存，优先on)
          ignore:true //忽略输出列
      }],
  }
  ```

## 10.define - 自定义条件

- String类型

  自定义，随意的条件，接在表后面。用于需要自定义条件，同时需要返回指定列的时候。

# 其他

## on - 表连接 - 条件判断、筛选

Array或Object类型。

- Array数组时：成员数据为Object类型。有`key`、`targetKey`、`symbol`、`value`、`index`这5个键值。

  只能`AND`连接。其中`targetKey`和`value`二选一，`targetKey`优先。

  **\- `key`**

  连接表中的模型自定义列名称，比如`SELECT FROM A LEFT JOIN B `，连接表就是B。

  **\- `symbol`**

  判断符号(如`=`、`IN`这些)。可参考[symbol - 符号](##symbol - 符号)，与[where](##3.where - 条件判断、筛选)的一致。

  **\- `targetKey`**【targetKey和value二选一】【优先targetKey】

  被连接表模型的自定义列名称。比如`SELECT FROM A LEFT JOIN B `，被连接表就是A。

  **\- `value`**【targetKey和value二选一】【优先targetKey】

  **\- `index`**

  第几个表，算上join里面的表，按照顺序排序(只算第一层可访问的表)。（默认第一张即模型的表，**从0开始，0代表第一张**）

- Object类型时：键为`key`表示join连接表中的模型自定义列名称，值为Object类型——有`targetKey`、`symbol`、`value`、`index`这4个键，分别为被连接的表的型自定义列名称、判断符号(如`=`、`IN`这些)、任意值、。其中`targetKey`和`value`二选一，`targetKey`优先。

  键为`key`，值为对象，含`targetKey`、`symbol`、`value`、`index`这4个键。用途均可以参考Array类型时。

  区别：`key`是可以为`$and`和`$or`来做复杂判断的。具体可以参考[where](##3.where - 条件判断、筛选)的`$and`和`$or`。

例子：

```
Array类型：
{
	on: [
		{key:'id',symbol:'!=',targetKey:'id',index:1},
		{key:'name',symbol:'!=',value:'n'},
		{key:'id',symbol:'=',value:'1'},
	]
}
生成==> ON 连接表.id != 第二张表.id AND 连接表.name = 'n' AND 连接表.id = '1'
```

或（等价于）

```
Object类型：
{
	on: {
		id:{symbol:'!=',targetKey:'id',index:1},
		name:{symbol:'=',value:'n'}
		$and:[{
			id:{symbol:'=',value:'1'}
		}]
	}
}
生成==> ON 第二张表.id != 连接表.id AND name = 'n' AND id = '1'
```

## symbol - 符号

目前暂无自定义的符号。

但是条件判断时，用到`symbol`参数时，与SQL的写法一致

# 总览

```
{
    distinct:true,
    fields:{
        include:[
            ['count',{key:'id',tag:'id',distinct:true}]
        ],
        exclude:['id','name']
    }或['id','name',['count',{key:'id',tag:'id',distinct:true}]]
    join:[{
        link : 'left'
        model : model(其他模型json)或 {struct:模型结构, tablename:'user'}(自定义)
        fields:['id','name'](选择的字段对应的模型结构key)
        conditions:{
            where:{
                id : { value : 1 , 'symbol' : '='},
                name : { value : 'name' , 'symbol' : '='}
            },
        },
        'on': {
            'id'(JOIN模型的字段) : { key : 'id'(原始模型的字段) , 'symbol' : '=' , index: 0 (哪个模型，默认0最外层，<=0表示最外层，1表示第几个join)},
            'name' : { value : 'name' , 'symbol' : '='}
        },
        using:['id']或'id', (using和on不能共存，优先on)
        ignore:true //忽略输出列
    }],
    where:{
        id:{value:'1',symbol:'>'},
        $and:[{
                id:{value:'1',symbol:'>'},
                name:{value:'name',symbol:'!='}
            },{
                id:{value:'1',symbol:'>'}
                $or:[{
                        id: {value:'1',symbol:'>'}
                    },{
                        id: {value:'1',symbol:'>'}
                    }
                ]
            }
        ]
    } => WHERE id > '1' AND ((id >1 AND nmae != 'name') AND (id >1 AND (id >1 OR id >1))
    //where或者结构如[ 
        {key:'id' ,symbol:'=' , value:'1'},(逗号为AND)
        {key:'id' ,symbol:'=' , value:'1'} 
    ] => id = 1 AND id = 1 AND id = 1
    order : {
        order: 'ASC' 或 'DESC'
        params: ['id','name']
    }
    limit: 10 或 [2,10]
    offset: 2,
    group:['id',['name',1]] (如果为数组中为数组则第二个数表示哪个模型，默认0最外层，<=0表示最外层，1表示第几个join)
    having:{同where，参考where}
}
```

