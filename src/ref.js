
// 存放监听者，即当数据变了要通知的东西。相当于存放Vue2里的watcher
let activeEffect

// Dep是create一个大的容器(subs)，subs代表着订阅者，它是个数组，
// 存放着每一个依赖某数据的watcher
class Dep {
    constructor() {
        this.subs = new Set()
    }
    depend() {
        if (activeEffect){
            this.subs.add(activeEffect)
        }
    }
    notify() {
        this.subs.forEach(effect=>effect())
    }
}

// 把数据 reactive化，即给它添加getter和settter
function ref(value) {
    const dep = new Dep()
    let _value = value
    let state = {
        get value() {
            console.log('get')
            dep.depend()
            return _value
        },
        set value(newValue) {
            console.log('set', newValue)
            _value = newValue
            dep.notify()
        }
    }
    return state
}

// 为依赖某数据的watcher，当某数据变化，会触发它
function effect(fn) {
    activeEffect = fn
    fn()
}

const state = ref(0)

// 这个函数的内部，依赖某数据的变化，
// 当某数据变化后，要通知这个effect做什么处理，这里就是简单的console.log出来
effect(()=>{
    console.log('effect', state.value)
})

// setInterval(()=>{
//     state.value++
// },1000)