function makeRgxMain () {
  const textElement = '(?<=^|>)' + '([^<]+)' + '(?=<)'
  const cdata = '<!\\[CDATA\\['
  const comment = '<!--'
  const script = '<script(?= |>)'
  const specialElement = '(' + cdata + '|' + script + '|' + comment + ')'
  const tagElement = '(?:<)' + '([^>]*)' + '(?:>)'
  return new RegExp(textElement + '|' + specialElement + '|' + tagElement, 'g')
}

function makeRgxTag () {
  const maybeClose = '(\\/?)'
  const typeName = '(\\S+)'
  const elementType = `^${maybeClose}${typeName}`
  const attrName = '(\\S+)'
  const attrValueDQ = '"([^"]*)"'
  const attrValueSQ = "'([^']*)'"
  const attrValueNQ = '([^\\s/]+)'
  const attrValue = `(?:${attrValueDQ}|${attrValueSQ}|${attrValueNQ})`
  const attr = `${attrName}\\s*=\\s*${attrValue}`
  const selfClose = '(\\/)\\s*$'
  return new RegExp(`${elementType}|${attr}|${selfClose}`, 'g')
}

const specials = {
  '<![CDATA[': { rgx: /]]>/, start: 9, end: 3, emit: 'cdata' },
  '<!--': { rgx: /-->/, start: 4, end: 3 },
  '<script': { rgx: /<\/script>/, start: 7, end: 9 }
}

const CHUNK = 1024

export default class Parser {
  constructor (handler) {
    this._buffer = ''
    this._special = false
    this._emit = handler
    this._rgxMain = makeRgxMain()
    this._rgxTag = makeRgxTag()
  }

  write (text) {
    this._buffer += text
    if (this._special) this._handleSpecial()
    else this._handle()
  }

  _handle () {
    this._rgxMain.lastIndex = undefined
    let consumed = 0
    while (true) {
      const m = this._rgxMain.exec(this._buffer)
      if (!m) break
      const [, text, special, tag] = m
      if (text) {
        consumed = m.index + text.length
        this._emit({ text })
      } else if (tag) {
        consumed = m.index + tag.length + 2
        this._emit(this._parseTag(tag))
      } else if (special) {
        this._special = special
        const { start } = specials[special]
        consumed = m.index + start
        this._buffer = this._buffer.slice(consumed)
        return this._handleSpecial()
      }
    }
    this._buffer = this._buffer.slice(consumed)
  }

  _handleSpecial () {
    const { rgx, end, emit } = specials[this._special]
    const match = rgx.exec(this._buffer)
    if (match) {
      const data = this._buffer.slice(0, match.index)
      this._buffer = this._buffer.slice(match.index + end)
      if (emit && data.length) this._emit({ [emit]: data })
      this._special = false
      return this._handle()
    }
    if (this._buffer.length > CHUNK) {
      const data = this._buffer.slice(0, CHUNK)
      this._buffer = this._buffer.slice(CHUNK)
      if (emit) this._emit({ [emit]: data })
    }
  }

  _parseTag (tag) {
    if (tag.startsWith('!') || tag.startsWith('?')) return { meta: tag }
    const out = { type: '' }
    this._rgxTag.lastIndex = undefined
    while (true) {
      const m = this._rgxTag.exec(tag)
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
}
