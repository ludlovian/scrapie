import parseDoc from './parse-doc.mjs'
import parseTag from './parse-tag.mjs'

export default class Scrapie {
  constructor () {
    this.parents = []
    this._parser = parseDoc({
      onTag: s => this._onTag(s),
      onText: s => this._onText(s)
    })
    this.write = this._parser.write.bind(this._parser)
    this.close = this._parser.close.bind(this._parser)
    this._hooks = new Set()
  }

  get path () {
    return this.parents.map(({ type }) => type)
  }

  get depth () {
    return this.parents.length
  }

  _onTag (string) {
    const tag = parseTag(string)
    const { type, close, selfClose } = tag
    if (!type) {
      if (this.onSpecial) this.onSpecial(string)
      return
    }

    if (!close) {
      this.parents.push(tag)
      this._callHooks({ tag })
      if (selfClose) this.parents.pop()
    } else {
      while (this.depth && this.parents[this.depth - 1].type !== type) {
        this.parents.pop()
      }
      this._callHooks({ tag })
      this.parents.pop()
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
    const m = new Matcher(this, fn)
    this._hooks.add(m)
    return m
  }
}

class Matcher {
  constructor (scrapie, fn) {
    this.scrapie = scrapie
    this.depth = scrapie.depth
    if (typeof fn === 'string') fn = makeTypeSelector(fn)
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
    const { scrapie, fnWhen, fnTag, fnText, fnEnd } = this
    const depth = scrapie.depth
    if (depth < this.depth) return false
    if (!tag || tag.close) return undefined
    if (!fnWhen(tag)) return undefined
    const ctx = {}
    if (fnTag && fnTag(tag, ctx) === false) return false
    if (fnEnd) addAtEndHook(scrapie, fnEnd, ctx)
    if (fnText) addTextHook(scrapie, fnText, ctx)
  }
}

const makeTypeSelector = t => ({ type }) => type === t

function addAtEndHook (scrapie, fnEnd, ctx) {
  scrapie.hook(({ tag }, depth) => {
    if (!tag) return
    const currDepth = scrapie.depth
    if (currDepth < depth) return false
    if (currDepth > depth) return undefined
    if (tag.close) fnEnd(ctx)
    return false
  }, scrapie.depth)
}

function addTextHook (scrapie, fnText, ctx) {
  scrapie.hook(({ text }, depth) => {
    if (!text) return
    if (scrapie.depth < depth) return false
    return fnText(text, ctx)
  }, scrapie.depth)
}
