import TagParser from './src/tagparser.mjs'

class Parser extends TagParser {
  onText (s) {
    console.log('text (%d)', s.length)
  }

  onCData (s) {
    console.log('CData (%d)', s.length)
  }

  onTag (s) {
    console.log('tag:%s', s.split(' ')[0])
  }
}

async function main () {
  const { stdin } = process
  stdin.setEncoding('utf8')
  const p = new Parser()
  for await (const s of stdin) {
    p.write(s)
  }
}

main()
