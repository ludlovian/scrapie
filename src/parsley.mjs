import ClosingParser from './closing-parser.mjs'

export default class Parsley {
  constructor (data) {
    if (Array.isArray(data)) {
      this.elems = [...data]
    } else {
      this.elems = []
      const p = ClosingParser(this.elems.push.bind(this.elems))
      p.write(data)
    }
  }

  get tag () {
    return this.elems[0]
  }

  get content () {
    if (this.elems.length < 3) return null
    return new Parsley(this.elems.slice(1, -1))
  }

  get text () {
    return this.elems.find(e => !!e.text).text
  }

  get textAll () {
    return this.elems.filter(e => !!e.text).map(e => e.text)
  }

  find (condition) {
    condition = makeCondition(condition)
    const [start, end] = find(this.elems, condition)
    return start == null ? null : new Parsley(this.elems.slice(start, end))
  }

  findAll (condition) {
    condition = makeCondition(condition)
    let data = this.elems
    const result = []
    while (true) {
      const [start, end] = find(data, condition)
      if (start == null) return result
      result.push(new Parsley(data.slice(start, end)))
      data = data.slice(end)
    }
  }
}

function find (data, condition) {
  const n = data.length
  let found = e => !!e.type & !e.close && condition(e)
  let i
  let j

  for (i = 0; i < n; i++) {
    if (found(data[i])) break
  }
  if (i === n) return [null, null]

  const { type, depth } = data[i]
  found = e => e.type === type && e.close && e.depth === depth
  for (j = i + 1; j < n; j++) {
    if (found(data[j])) break
  }
  if (j < n) j++
  return [i, j]
}

function makeCondition (condition) {
  if (typeof condition === 'string') return ({ type }) => type === condition
  return condition
}
