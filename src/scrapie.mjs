import BalanceParser from './balancer.mjs'

export default class Scrapie {
  constructor (isChild) {
    if (!this.isChild) {
      const parser = new BalanceParser(this._ondata.bind(this))
      this.write = parser.write.bind(parser)
    }
    this._hooks = {}
  }

  onText (callback) {
    return this.on('data', ({ text }) => text && callback(text, this))
  }

  onEnter (callback) {
    return this.on('enter', callback)
  }

  on (event, callback) {
    if (event === 'text') return this.onText(callback)
    const list = this._hooks[event]
    if (list) list.push(callback)
    else this._hooks[event] = [callback]
    return this
  }

  _emit (event, data) {
    const list = this._hooks[event]
    if (!list) return undefined
    for (let i = 0; i < list.length; i++) {
      list[i](data, this)
    }
  }

  _ondata (data) {
    this._emit('data', data)
  }

  when (fn, callback) {
    if (typeof fn === 'string') fn = makeCondition(fn)
    const s = new SubScrapie(this, fn)
    if (callback) s.onEnter(callback)
    return s
  }
}

class SubScrapie extends Scrapie {
  constructor (parent, condition) {
    super(true)
    parent.on('data', this._ondata.bind(this))
    this.write = parent.write
    this._active = false
    this._condition = condition
  }

  _ondata (data) {
    if (this._active) {
      if (data.depth < this._activeDepth) {
        this._emit('exit', data)
        this._active = false
      } else {
        this._emit('data', data)
      }
    } else {
      if (this._condition(data)) {
        this._emit('enter', data)
        this._active = true
        this._activeDepth = data.depth + 1
      }
    }
  }
}

function makeCondition (string) {
  if (string.includes('.')) {
    const [t, cls] = string.split('.')
    return ({ type, attrs }) =>
      type === t && attrs && attrs.class && attrs.class.includes(cls)
  }
  const t = string
  return ({ type }) => type === t
}
