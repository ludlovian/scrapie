import closingParser from './closing-parser.mjs'

const customInspect = Symbol.for('nodejs.util.inspect.custom')

export default class Parsley {
  //
  // A Parsley is the representation of an XML object from
  // open tag to closing tag
  //
  // It is simply represented with the following attributes:
  //    type      - the name of the tag
  //    attrs     - the collection of attrbutes
  //    children  - the array of children
  //
  //    Text is represented as a string child

  constructor (data) {
    if (typeof data === 'string') return parseXml(this, data)
    Object.assign(this, data)
  }

  get xml () {
    const a = Object.entries(this.attrs)
      .map(([k, v]) => ` ${k}="${encode(v)}"`)
      .join('')
    const c = this.children.map(p =>
      typeof p === 'string' ? encode(p) : p.xml
    )
    const t = this.type

    if (c.length) return `<${t}${a}>${c.join('')}</${t}>`
    else return `<${t}${a} />`
  }

  /* c8 ignore next */
  [customInspect] (depth, opts) {
    /* c8 ignore next */
    if (depth < 0) return opts.stylize('[Parsley]', 'special')
    /* c8 ignore next */
    return opts.stylize(`Parsley${this.xml}`, 'special')
    /* c8 ignore next */
  }

  get child () {
    return this.children[0]
  }

  get text () {
    return find(this, p => typeof p === 'string', false)
  }

  get textAll () {
    return find(this, p => typeof p === 'string', true)
  }

  find (fn) {
    return find(this, makeCondition(fn), false)
  }

  findAll (fn) {
    return find(this, makeCondition(fn), true)
  }
}

function find (p, cond, all) {
  if (cond(p)) return all ? [p] : p
  if (!(p instanceof Parsley)) return null
  let ret = []
  for (const child of p.children) {
    const found = find(child, cond, all)
    if (found) {
      if (!all) return found
      ret = ret.concat(found)
    }
  }
  return ret.length ? ret : null
}

function makeCondition (cond) {
  return typeof cond === 'string'
    ? p => p instanceof Parsley && p.type === cond
    : p => p instanceof Parsley && cond(p)
}

function parseXml (p, xml) {
  let curr // the current element
  const stack = [] // the stack of elements above us

  closingParser(handle).write(xml)

  return curr

  function handle ({ type, attrs, close, text }) {
    if (type && !close) {
      const elem = new Parsley({ type, attrs, children: [] })
      if (curr) {
        curr.children.push(elem)
        stack.push(curr)
      }
      curr = elem
    } else if (close) {
      if (stack.length) curr = stack.pop()
    } else if (text) {
      curr.children.push(decode(text))
    }
  }
}

const encodes = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  "'": '&apos;',
  '"': '&quot;'
}

const decodes = Object.fromEntries(
  Object.entries(encodes).map(([a, b]) => [b, a])
)

function encode (s) {
  return s.replace(/[<>&'"]/g, c => encodes[c])
}

function decode (s) {
  return s.replace(/&(?:lt|gt|amp|apos|quot);/g, c => decodes[c])
}
