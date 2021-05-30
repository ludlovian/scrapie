import Parser from './parser.mjs'

export default function ClosingParser (handler) {
  const parser = new Parser(ondata)
  const path = []
  const write = parser.write.bind(parser)
  let depth = 0

  return { write, path }

  function ondata (data) {
    data.depth = depth
    const { type, close, selfClose, ...rest } = data
    if (type && !close) {
      handler({ type, ...rest })
      if (selfClose) {
        handler({ type, close: true, depth })
      } else {
        path.push(type)
        depth++
      }
    } else if (type && close) {
      while (path.length && path[path.length - 1] !== type) {
        const type = path.pop()
        depth--
        handler({ type, close: true, depth })
      }
      if (depth) {
        path.pop()
        depth--
      }
      handler({ type, close, depth })
    } else {
      handler(data)
    }
  }
}
