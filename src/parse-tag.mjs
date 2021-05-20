const rgx = /^(\/?)(\S+)|(\S+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))|(\/)\s*$/g
/*           <---tag---> <--------------attr---------------------> <------>
 *                       <--->       <-------------------------->   selfClose
 *                      name             <-dq-->   <-sq-->  <--->
 *                                                           nq
 */

export default function parseTag (s) {
  if (s.startsWith('!') || s.startsWith('?')) return { text: s }
  const out = { type: '' }
  rgx.lastIndex = undefined
  while (true) {
    const m = rgx.exec(s)
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
