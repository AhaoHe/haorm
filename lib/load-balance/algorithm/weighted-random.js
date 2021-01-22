class WeightedRandom{
    constructor(balance){
        this.databases = balance.databases;
        this.total = 0;;
        //添加默认权重,不存在权重默认1
        databases.forEach(e=>{
            if(!e.weight)
                e.weight = ++total;
            else if(e.weight && e.weight > 0){
                e.weight = e.weight + total;
            }
            else{
                throw new Error('Weight need > 0')
            }
        });
    }
    
    //如有4个元素A、B、C、D，权重分别为1、2、3、4，随机结果中A:B:C:D的比例要为1:2:3:4。
　　//总体思路：累加每个元素的权重A(1)-B(3)-C(6)-D(10)，则4个元素的的权重管辖区间分别为[0,1)、[1,3)、[3,6)、[6,10)。然后随机出一个[0,10)之间的随机数。落在哪个区间，则该区间之后的元素即为按权重命中的元素。
    //三种实现：1.二叉树，二分法左边小，右边大，节点是元素和权重
    //          2.数组，二分法
    //          3.B+树。叶子结点存放元素，非叶子结点用于索引。非叶子结点有两个属性，分别保存左右子树的累加权重。
    //三种实现均有二分法的思路。
    get(){
        let index = Math.floor(Math.random()*this.total);
        return find(index,this.databases.length - 1);
    }

    //二分法查找
    find(randomIndex,totalIndex){
        if(totalIndex == 0)
            return this.databases[0];
        let left = 0; 
        let right = totalIndex;
        let database;
        while(left <= right){
            let index = (left + right) / 2;
            database = this.databases[index];
            if(database.weight <= randomIndex && randomIndex < this.databases[index+1].weight)
                return this.databases[index + 1];
            if(database.weight < randomIndex)
                left = index + 1;
            else
                right = index;
        }
        return database;
    }
}

module.exports = WeightedRandom;