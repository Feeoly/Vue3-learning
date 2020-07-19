//存储effect
const effectStack = []

let targetMap = new WeakMap()
// target1: {
//     key1: [effect11, effect12],
//     key2: [effect21, effect22, effect23],
// }
// target2: {
//     key1: [effect11, effect12],
//     key2: [effect21, effect22, effect23],
// }
function track(target, key) {
    const effect = effectStack[effectStack.length - 1]
    console.log('effectStack', effectStack)
    if (effect) {
        let depMap = targetMap.get(target)
        if (!depMap) {
            depMap = new Map()
            targetMap.set(target, depMap)
        }
        let dep = depMap.get(key)
        if (!dep) {
            dep = new Set()
            depMap.set(key, dep)
        }
        // 添加双向依赖
        dep.add(effect)
        effect.deps.push(dep)
    }

}

function trigger(target, key, info) {
    let depMap = targetMap.get(target)
    if(!depMap){
        return 
    }
    const effects = new Set()
    const computedRunners = new Set()
    if (key) {
        let deps = depMap.get(key)
        deps.forEach(effect => {
            if(effect.computed){
                computedRunners.add(effect)
            }else{
                effects.add(effect)
            }
        });
    }
    computedRunners.forEach(computed=>computed())
    effects.forEach(effect=>effect())
}

// 执行effect,在这时才去触发proxy
function run(effect, fn, args){
    if (effectStack.indexOf(effect) === -1) {
        try {
            effectStack.push(effect)
            console.log('run1', effectStack)
            return fn(...args)
        } finally {
            effectStack.pop()
            console.log('run2', effectStack)
        }
    }
}

// 调用执行effect后，修饰effect
function createReactiveEffect(fn, options) {
    const effect = function effect(...args) {
        return run(effect, fn, args)
    }
    effect.deps = [] // 为了后续清理? 以及缓存
    effect.computed = options.computed
    effect.lazy = options.lazy
    return effect
}

/**
 * 
 * @param {*} fn 
 * @param {*} options {lazy:false,computed:false}
 * lazy第一次要不要执行effect， computed是不是computed方法
 */
function effect(fn, options={}) {
    // 返回一个effect
    let e = createReactiveEffect(fn,options)
    if(!options.lazy){
        // lazy决定是不是首次就执行effect
        e()
    }
    return e
}

const baseHandler = {
    get (target, key) {
        const res = target[key]
        console.log('get', target, key)
        track(target, key)
        return res
    },
    set(target, key, val) {
        const info = {oldValue:target[key], newValue:val}
        target[key] = val
        trigger(target, key, info)
        console.log('set', target, key, val)
    }
}

// 响应式
function reactive(target) {
    const observed = new Proxy(target, baseHandler)
    return observed
}

// computed
// 它是一种特殊的effect
function computed(fn) {
    const runner = effect(fn, {computed: true, lazy: true})
    console.log(runner)
    return {
        effect: runner,
        get value() {
            console.log('get-computed')
            return runner() // this.effect()
        }
    }
}

let obj = {
    name:'大圣',
    age:18
}
let state = reactive(obj)

let double = computed(() => state.age*2)

effect(()=>{
    console.log('数据变了',  state.age, double.value)
})

console.log('----------')
setTimeout(()=>{
    state.age=20
}, 1000)
