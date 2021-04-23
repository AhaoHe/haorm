const LIRS_Type = {
    LIR = 101,
    HIR = 102,
    NHIR = 103,
}

class iterator{
    /**
     * 当只有一个数据时，prev为''表示为顶部
     * 当只有一个数据时，next为''表示在尾部
     */
    prev = undefined
    next = undefined

    // isTop(){
    //     return this.prev == undefined
    // }

    // isEnd(){
    //     return this.next == undefined
    // }

    /**
     * @returns 是否在队列或栈中
     */
    isInIterator(){
        return this.next != undefined || this.prev != undefined
    }

    clear(){
        this.next = undefined
        this.prev = undefined
    }

}

class LIRS_Node{
    constructor(key,value){
        this.key = key
        this.value = value
        this.s = new iterator();
        this.q = new iterator()
    }

    s = undefined //new iterator();
    q = undefined //new iterator();
    value = undefined
    key = undefined

    lirs_type = LIRS_Type.LIR

    setType(LIRS_Type){
        this.lirs_type = LIRS_Type
    }

    getType(){
        return this.lirs_type
    }
}

export class LIRS {
    constructor(LIR_limit,Queue_limit){
        this.lir_limit = LIR_limit | 100
        this.q_limit = Queue_limit | 50
        this.map = {}

        this.s_head = this.s_tail = undefined
        this.q_head = this.q_tail = undefined

        this.cache_size = 0 //map的大小
        this.s_size = 0
        this.q_size = 0
    }

    /*************************
     * public
     *************************/

    get(key, ifReturnNode = false){
        let node = this.map[key]
        //不存在节点
        if(!node) return ifReturnNode ? node : undefined
        switch(node.getType()){
            case LIRS_Type.LIR:
                if(node.s.isInIterator()){
                    console.log("LIRS算法缓存BUG,类型为LIR的节点必定存在S栈中,但未在S栈中找到:",node)
                }
                //移动到顶端
                this.#MoveTop(node,true)
                //节点类型设置为LIR
                //node.setType(LIRS_Type.LIR)
                //如果移动的是底部节点或底部节点不是LIR类型，则需要剪枝，使s队列底部必为LIR类型，保证R值
                break;
            case LIRS_Type.HIR:
                if(node.q.isInIterator()){
                    console.log("LIRS算法缓存BUG,类型为HIR的节点必定存在Q队列中,但未在Q队列中找到:",node)
                }
                //如果节点在s，移动到s顶端，并从Q队列中删除
                if(node.s.isInIterator()){
                    this.#MoveTop(node,true)
                    //节点类型设置为LIR
                    node.setType(LIRS_Type.LIR)
                    //从q队列中删除
                    this.#Pop(node,false)
                    //栈底移到Q队列顶部
                    //this.#Bottom();
                }
                //不在s中，设置为HIR，分别放到s和q的顶端
                else{
                    //因为不存在s中，直接推入
                    this.#Push(node,true)
                    //节点类型设置为HIR
                    //node.setType(LIRS_Type.HIR)
                    this.#MoveTop(node,false);
                }
                break;
            //NHIR只可能出现在S中
            case LIRS_Type.NHIR:
                //如果是S的栈顶
                if(node === this.s_head){
                    //节点类型设置为LIR
                    node.setType(LIRS_Type.LIR)
                }else{
                    //移动到顶端
                    this.#MoveTop(node,true)
                    //节点类型设置为LIR
                    node.setType(LIRS_Type.LIR)
                    //栈底移到Q队列顶部
                    this.#Bottom();
                    //如果超出Q队列长度，Q队列出队
                    this.FreeOne();
                }
                break;
            default:
                console.log("LIRS算法缓存BUG,存在未知节点类型：",node)
                break;
        }
        //剪枝，使s队列底部必为LIR类型，保证R值
        this.Pruning();
        return ifReturnNode ? node : node.value
    }

    set(key,value){
        //如果已经存在key,直接找到
        if (this.map.hasOwnProperty(key)) { // find it
            let node = this.get(key,true);
            node.value = value
            return true;
        }

        //新建一个节点
        let newNode = new LIRS_Node(key,value);
        //放到S栈中
        this.#Push(newNode, true);
        this.cache_size ++;

        //如果LIR满了，就放到q队列中并设为HIR
        if(this.cache_size > this.lir_limit){
            newNode.setType(LIRS_Type.HIR);
            this.#Push(newNode, false);
        }

        //放到map中
        this.map[key] = newNode

        return true;
    }

    /**
     * S栈剪枝
     */
    Pruning(){
        //S栈剪枝
        // if(this.s_tail.getType() != LIRS_Type.LIR ){
        //     while(this.s_size > 1){
        //         //获取栈底的上一个节点，新栈底
        //         let new_tailNode = this.s_tail.s.prev
        //         //删除栈底的连接，设置新的栈底
        //         this.s_tail.s.clear()
        //         this.s_size--;
        //         new_tailNode.s.next = undefined
        //         this.s_tail = new_tailNode
        //         //如果新栈底是LIR，则跳出循环
        //         if(new_tailNode.getType() == LIRS_Type.LIR){
        //             break;
        //         }
        //     }
        // }
        while(this.s_size > 0 && this.s_tail.getType() != LIRS_Type.LIR){
            //如果移除NHIR的节点，说明Q中也不存在，可以在map中移除了
            let node = this.s_tail
            this.#Pop(node,true)
            if(node.getType() == LIRS_Type.NHIR){
                delete this.map[node.key]
                delete node
                this.cache_size --;
            }
        }
    }

    //Q队列移除底部一个节点
    FreeOne(){
        if(this.q_size > this.q_limit){
            let node = this.q_tail
            this.#Pop(node,false);
            //存在S栈中，只移除Q队列，把类型改为NHIR
            if(node.s.isInIterator()){
                node.setType(LIRS_Type.NHIR);
            }
            //在Q和S中都被淘汰
            else{
                delete this.map[node.key]
                delete node
            }
        }
    }

    /***************************
     * private
     ***************************/

    /**
     * 移入栈顶
     * @param {LIRS_Node} node 
     * @param {boolean} toS 是:推入S栈顶，否:推入Q队顶
     */
    #Push(node,toS){
        if(toS){
            //原头部节点prev连接新的节点
            let headNode = this.s_head
            headNode.s.prev = node
            //新节点next连接原头节点
            node.s.prev = '' //prev为''表示在顶部
            node.s.next = headNode
            //新节点设为头部
            this.s_head = node
            //s栈节点数+1
            this.s_size ++;
        }else{
            //原头部节点prev连接新的节点
            let headNode = this.q_head
            headNode.q.prev = node
            //新节点next连接原头节点
            node.q.prev = '' //prev为''表示在顶部
            node.q.next = headNode
            //新节点设为头部
            this.q_head = node
            //q队列节点数+1
            this.q_size ++;
        }

        //if(this.map.hasOwnProperty())

    }
    
    /**
     * 移出栈
     * @param {LIRS_Node} node
     * @param {boolean} fromS 是:从S栈中移除，否:从Q队列中移除
     */
    #Pop(node,fromS){
        if(fromS){
            //如果不在s中直接返回
            if(!node.s.isInIterator()) {return;}
            //先删除节点
            let preNode = node.s.prev
            let nextNode = node.s.next
            //判断是否是头部
            if(this.s_head === node){
                this.s_head = nextNode
                this.s_head.s.prev = ''
            }
            //判断是否是尾部数据
            else if(this.s_tail === node){
                this.s_tail = preNode
                this.s_tail.s.next = ''
            }else{
                preNode.s.next = nextNode
                nextNode.s.prev = preNode
            }
            //s栈节点数-1
            node.s.clear()
            this.s_size --;
        }else{
            //如果不在q中直接返回
            if(!node.q.isInIterator()) {return;}
            //先删除节点
            let preNode = node.q.prev
            let nextNode = node.q.next
            //判断是否是头部
            if(this.q_head === node){
                this.q_head = nextNode
                this.q_head.q.prev = ''
            }
            //判断是否是尾部数据
            else if(this.q_tail === node){
                this.q_tail = preNode
                this.q_tail.q.next = ''
            }else{
                preNode.q.next = nextNode
                nextNode.q.prev = preNode
            }
            //q队列节点数-1
            node.q.clear()
            this.q_size --;
        }
    }

    /**
     * 节点移到栈顶
     * @param {LIRS_Node} node 
     * @param {boolean} fromS 
     */
    #MoveTop(node,fromS = true){
        //如果已经是头节点了，就不需要再操作了
        let isHead = fromS ? this.s_head === node : this.q_head === node
        if(isHead) return;
        //先推出栈，再加入栈顶
        this.#Pop(node,fromS)
        this.#Push(node,fromS)
    }

    /**
     * lir类型的node从s栈底放入q队列顶，并改为hir类型
     */
    #Bottom(){
        let s_bottom = this.s_tail
        if(s_bottom.getType() == LIRS_Type.LIR){
            s_bottom.setType(LIRS_Type.HIR)
            this.#Pop(s_bottom,true);
            //在队列中
            if(s_bottom.q.isInIterator()){
                this.#Pop(s_bottom,false);
            }
            //推入q队列顶部
            this.#Push(s_bottom,false)
        }
    }

}