const { sqlOperation } = require('../config')
const userModel = require('../models/user')
const groupModel = require('../models/group')
const { Wrapper } = require('../../lib')
module.exports = {
  select: async function() {
    let user = sqlOperation.openSession('user');
    let a = await user.findAll({
      where:{
        id:{value:'1',symbol:'>'},
        $and:[{
          id:{value:'1',symbol:'>'},
          name:{value:'name',symbol:'!='}
        },{
          id:{value:'1',symbol:'>'},
        }]
      }
    });
    let b = await user.findById(1);
    let c = await user.findAll({page:[0,5]});
    let d = await user.findAll({
      count:[{key:'id',tag:'count'}],
      join:[{
          link : 'left',
          model : sqlOperation.getModel('user'),
          select:['id','name'],
          conditions:{
              join:[{
                  link : 'left',
                  model : sqlOperation.getModel('user'),
                  select:['id','name'],
                  conditions:{
                      where:{
                          id : { value : 1 , symbol : '='}
                      },
                  },
                  using : ['id']/* {
                      'id' : { key : 'id' , symbol : '='}
                  } */
              }],
              where:{
                  id : { value : 1 , symbol : '='}
              },
          },
          on : {
              'id' : { targetKey : 'id' , symbol : '='},
              'name' : { value : 'a' , symbol : '!='},
          }
        },{
          link : 'left',
          model : sqlOperation.getModel('group'),
          select:['id','name'],
          on : {
              'id' : { targetKey : 'id' , symbol : '='}
          }
      }],
      group:[['id',0]]
    });
    let e = await user.findOne({where:[ {key:'id' ,symbol:'=' , value:'30'} ]},['id','password']);
    
    let group = sqlOperation.openSession('group');
    let f = await group.findAll();
    
    return {a,b,c,d,e,f}
  },

  wrapper:async function() {
    const wrapper = sqlOperation.newWrapper('user');
    let sql = wrapper.select('*').from().where({id:{value:'1',symbol:'='}}).getSql();
    return await wrapper.excute();
  },

  transaction:async function(){
    let user = sqlOperation.openSession('user');
    user.beginTransaction();
    let a1 = await user.findOne({where:[ {key:'id' ,symbol:'=' , value:'30'} ]},['id','password']);
    let result1 = await user.update({id:30,password:'test4'})
    let b = await user.findOne({where:[ {key:'id' ,symbol:'=' , value:'30'} ]},['id','password']);
    //提交
    let c = await user.commit({type:'READ'});
    let d = await user.findOne({where:[ {key:'id' ,symbol:'=' , value:30} ]},['id','password']);
    return {c,d}
  }

}