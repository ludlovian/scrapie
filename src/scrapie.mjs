import parseDoc from './parse-doc.mjs'
import parseTag from './parse-tag.mjs'

export default class Scrapie {
  constructor () {
    this.path = []
    this._parser = parseDoc({
      onTag: s => this._onTag(s),
      onText: s => this._onText(s)
    })
    this.write = this._parser.write.bind(this._parser)
    this.close = this._parser.close.bind(this._parser)
    this._hooks = new Set()
  }

  get depth () {
    return this.path.length
  }

  _onTag (string) {
    const tag = parseTag(string)
    const { type, close, selfClose } = tag
    if (!type) {
      if (this.onSpecial) this.onSpecial(string)
      return
    }

    if (!close) {
      this.path.push(type)
      this._callHooks({ tag })
      if (selfClose) this.path.pop()
    } else {
      while (this.depth && this.path[this.depth - 1] !== type) {
        this.path.pop()
      }
      this.path.pop()
      this._callHooks({ tag })
    }
  }

  _onText (text) {
    this._callHooks({ text })
  }

  _callHooks (data) {
    for (const hook of [...this._hooks]) {
      if (hook.fn(data, hook.ctx) === false) this._hooks.delete(hook)
    }
  }

  hook (fn, ctx) {
    this._hooks.add({ fn, ctx })
  }

  when (fn) {
    const h = new Hook(this)
    this._hooks.add(h)
    return h.when(fn)
  }

  onText (fn) {
    this.hook(({ text }, depth) => {
      if (this.depth < depth) return false
      if (!text) return
      return fn(text)
    }, this.depth)
  }
}

class Hook {
  constructor (scrapie) {
    this.scrapie = scrapie
    this.depth = scrapie.depth
  }

  when (fn) {
    if (typeof fn === 'string') {
      const t = fn
      fn = ({ type }) => type === t
    }
    this.whenFn = fn
    return this
  }

  do (fn) {
    this.doFn = fn
    return this
  }

  atEnd (fn) {
    this.endFn = fn
    return this
  }

  fn ({ tag }) {
    if (this.scrapie.depth < this.depth) return this._onEnd()
    if (!tag || tag.close) return undefined
    if (!this.whenFn(tag)) return undefined
    if (this.doFn && this.doFn(tag) === false) return this._onEnd()
  }

  _onEnd () {
    if (this.endFn) this.endFn()
    return false
  }
}
