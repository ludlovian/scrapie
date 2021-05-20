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
  '<![CDATA[': { rgx: /]]>/, start: 9, end: 3, handler: 'onCData' },
  '<!--': { rgx: /-->/, start: 4, end: 3 },
  '<script': { rgx: /<\/script>/, start: 7, end: 9 }
}
const CHUNK = 1024

export default function parseDoc (hooks = {}) {
  return Object.assign(new Parser(), hooks)
}

class Parser {
  constructor () {
    this.buff = ''
    this.special = false
  }

  write (s) {
    this.buff += s
    if (this.special) {
      this.handleSpecial()
    } else {
      this.handle()
    }
  }

  close () {
    this.handle()
    this.buff = ''
  }

  handle () {
    rgxMain.lastIndex = undefined
    let consumed = 0
    while (true) {
      const m = rgxMain.exec(this.buff)
      if (!m) break
      const [, text, special, tag] = m
      if (text) {
        consumed = m.index + text.length
        this.onText(text)
      } else if (tag) {
        consumed = m.index + tag.length + 2
        this.onTag(tag)
      } else if (special) {
        this.special = special
        const { start } = specials[special]
        consumed = m.index + start
        this.buff = this.buff.slice(consumed)
        return this.handleSpecial()
      }
    }
    this.buff = this.buff.slice(consumed)
  }

  handleSpecial () {
    const { rgx, end, handler } = specials[this.special]
    const match = rgx.exec(this.buff)
    if (match) {
      const data = this.buff.slice(0, match.index)
      this.buff = this.buff.slice(match.index + end)
      if (handler && this[handler]) {
        if (data.length) this[handler](data)
      }
      this.special = false
      return this.handle()
    }
    if (this.buff.length > CHUNK) {
      const data = this.buff.slice(0, CHUNK)
      this.buff = this.buff.slice(CHUNK)
      if (handler && this[handler]) this[handler](data)
    }
  }
}

/* c8 ignore next */
function nothing () {}

Parser.prototype.onText = nothing
Parser.prototype.onTag = nothing
