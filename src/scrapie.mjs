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
      hook.fn.call(this, data, hook.ctx)
    }
  }

  addHook (fn, ctx) {
    const item = { fn, ctx }
    this._hooks.add(item)
    return () => this._hooks.delete(item)
  }

  whenTag (when, fn, opts = {}) {
    const { once, depth = this.depth } = opts
    const ctx = { once, depth }
    ctx.remove = this.addHook(handle, ctx)

    function handle ({ tag }, ctx) {
      if (this.depth < ctx.depth) return ctx.remove()
      if (!tag || tag.close) return null
      if (!when(tag)) return null
      fn(tag)
      if (ctx.once) ctx.remove()
    }
  }

  onText (fn, opts = {}) {
    const { once, depth = this.depth } = opts
    const ctx = { once, depth }
    ctx.remove = this.addHook(handle, ctx)

    function handle ({ text }, ctx) {
      if (this.depth < ctx.depth) return ctx.remove()
      if (!text) return null
      fn(text)
      if (ctx.once) ctx.remove()
    }
  }
}
