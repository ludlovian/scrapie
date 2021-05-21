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
      this._callHooks({ tag })
      this.path.pop()
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
    const h = new Hook(this, fn)
    this._hooks.add(h)
    return h
  }
}

class Hook {
  constructor (scrapie, fn) {
    this.scrapie = scrapie
    this.depth = scrapie.depth
    if (typeof fn === 'string') {
      const t = fn
      fn = ({ type }) => type === t
    }
    this.fnWhen = fn
    return this
  }

  onTag (fn) {
    this.fnTag = fn
    return this
  }

  atEnd (fn) {
    this.fnEnd = fn
    return this
  }

  onText (fn) {
    this.fnText = fn
    return this
  }

  fn ({ tag }) {
    if (this.scrapie.depth < this.depth) return false
    if (!tag || tag.close) return undefined
    if (!this.fnWhen(tag)) return undefined
    const ctx = {}
    if (this.fnTag && this.fnTag(tag, ctx) === false) return false
    if (this.fnEnd) {
      this.scrapie.hook(({ tag }, depth) => {
        if (!tag) return
        const currDepth = this.scrapie.depth
        if (currDepth < depth) return false
        if (currDepth > depth) return undefined
        if (tag.close) this.fnEnd(ctx)
        return false
      }, this.scrapie.depth)
    }

    if (this.fnText) {
      this.scrapie.hook(({ text }, depth) => {
        if (!text) return
        if (this.scrapie.depth < depth) return false
        return this.fnText(text, ctx)
      }, this.scrapie.depth)
    }
  }
}
