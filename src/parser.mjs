const rgxMain = (() => {
  const textElement = '(?<=^|>)' + '([^<]+)' + '(?=<)'
  const cdata = '<!\\[CDATA\\['
  const comment = '<!--'
  const script = '<script(?= |>)'
  const specialElement = '(' + cdata + '|' + script + '|' + comment + ')'
  const tagElement = '(?:<)' + '([^>]*)' + '(?:>)'
  return new RegExp(textElement + '|' + specialElement + '|' + tagElement, 'g')
})()

const specials = {
  '<![CDATA[': { rgx: /]]>/, start: 9, end: 3, emit: 'cdata' },
  '<!--': { rgx: /-->/, start: 4, end: 3 },
  '<script': { rgx: /<\/script>/, start: 7, end: 9 }
}

const CHUNK = 1024

const rgxTag = (() => {
  const maybeClose = '(\\/?)'
  const typeName = '(\\S+)'
  const elementType = `^${maybeClose}${typeName}`
  const attrName = '(\\S+)'
  const attrValueDQ = '"([^"]*)"'
  const attrValueSQ = "'([^']*)'"
  const attrValueNQ = '(\\S+)'
  const attrValue = `(?:${attrValueDQ}|${attrValueSQ}|${attrValueNQ})`
  const attr = `${attrName}\\s*=\\s*${attrValue}`
  const selfClose = '(\\/)\\s*$'
  return new RegExp(`${elementType}|${attr}|${selfClose}`, 'g')
})()

export default class Parser {
  constructor (handler) {
    this.buffer = ''
    this.special = false
    this.handler = handler
  }

  write (text) {
    this.buffer += text
    if (this.special) handleSpecial(this)
    else handle(this)
  }
}

function handle (p) {
  rgxMain.lastIndex = undefined
  let consumed = 0
  while (true) {
    const m = rgxMain.exec(p.buffer)
    if (!m) break
    const [, text, special, tag] = m
    if (text) {
      consumed = m.index + text.length
      p.handler({ text })
    } else if (tag) {
      consumed = m.index + tag.length + 2
      p.handler(parseTag(tag))
    } else if (special) {
      p.special = special
      const { start } = specials[special]
      consumed = m.index + start
      p.buffer = p.buffer.slice(consumed)
      return handleSpecial(p)
    }
  }
  p.buffer = p.buffer.slice(consumed)
}

function handleSpecial (p) {
  const { rgx, end, emit } = specials[p.special]
  const match = rgx.exec(p.buffer)
  if (match) {
    const data = p.buffer.slice(0, match.index)
    p.buffer = p.buffer.slice(match.index + end)
    if (emit && data.length) p.handler({ [emit]: data })
    p.special = false
    return handle(p)
  }
  if (p.buffer.length > CHUNK) {
    const data = p.buffer.slice(0, CHUNK)
    p.buffer = p.buffer.slice(CHUNK)
    if (emit) p.handler({ [emit]: data })
  }
}

function parseTag (tag) {
  if (tag.startsWith('!') || tag.startsWith('?')) return { meta: tag }
  const out = { type: '' }
  rgxTag.lastIndex = undefined
  while (true) {
    const m = rgxTag.exec(tag)
    if (!m) return out
    const [, close, type, name, dq, sq, nq, selfClose] = m
    if (type) {
      out.type = type
      if (close) {
        out.close = true
      } else {
        out.attrs = {}
      }
    } else if (name) {
      out.attrs[name] = dq || sq || nq
    } else if (selfClose) {
      out.selfClose = true
    }
  }
}
