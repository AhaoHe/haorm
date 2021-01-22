class WeightedRoundRobin{
    constructor(balance){
        this.databases = balance.databases;
        //直接在启动时算好总权重，省去每次调用计算总权重
        this.total = 0;
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
            //有效权重初始化为0
            e.CurrentWeight = 0;
        });
    }

    //平滑加权轮询（参考nginx的算法）
    get(){
        let best = undefined;
        this.databases.forEach(node => {
            if(node == undefined )
                continue;

            node.CurrentWeight += node.Weight	//每个节点，用它们的当前值加上它们自己的权重
    
            //每选择当前值最大的节点为选中节点
            if(best == undefined || node.CurrentWeight > best.CurrentWeight) {
                best = node
            }
        });
    
        if(best == undefined){
            return undefined;
        }
        
        //选中节点的当前值减去所有节点的权重总和
        best.CurrentWeight -= this.total
        return best;
    }

}

module.exports = WeightedRoundRobin;