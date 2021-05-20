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
    }
  }

  _onText (text) {
    this._callHooks({ text })
  }

  _callHooks (data) {
    const { depth } = this
    for (const hook of [...this._hooks]) {
      if (depth < hook.depth) {
        this._hooks.delete(hook)
        continue
      }
      hook.fn(data, this)
    }
  }

  hook (fn) {
    const { depth } = this
    this._hooks.add({ depth, fn })
  }

  whenTag (when, fn) {
    this.hook(({ tag }) => tag && when(tag, this) && fn(tag, this))
  }

  onText (fn) {
    this.hook(({ text }) => text && fn(text, this))
  }
}
