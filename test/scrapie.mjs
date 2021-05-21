import { test } from 'uvu'
import * as assert from 'uvu/assert'

import Scrapie from '../src/scrapie.mjs'

test('basic conditional capture', () => {
  const s = new Scrapie()
  const doc = '<foo><bar>quux</bar>baz</foo>'
  const res = []
  s.when('foo').do(() => {
    s.when('bar')
      .do(() => {
        s.onText(t => res.push(t))
      })
      .atEnd(() => res.push('END'))
  })
  s.write(doc)

  assert.equal(res, ['quux', 'END'])
})

test('cope with non closing tags', () => {
  const s = new Scrapie()
  const doc = '<foo><foo bar="baz">get this<p>and this</foo>not this</foo>'
  const res = []
  s.when(({ type, attrs: { bar } }) => type === 'foo' && bar).do(() =>
    s.onText(txt => res.push(txt))
  )
  s.write(doc)

  assert.equal(res, ['get this', 'and this'])
})

test('self closing tags', () => {
  const s = new Scrapie()
  const doc = '<foo><bar baz="this" />not this</foo>'
  const res = []
  s.when('bar').do(({ attrs }) => {
    res.push(attrs.baz)
    s.onText(txt => res.push(txt))
  })
  s.write(doc)

  assert.equal(res, ['this'])
})

test('close non-opened', () => {
  const s = new Scrapie()
  const doc = '<foo></bar>get this</foo>'
  const res = []
  s.onText(txt => {
    res.push(txt)
    assert.is(s.depth, 0)
  })
  s.write(doc)

  assert.equal(res, ['get this'])
})

test('special tags', () => {
  const s = new Scrapie()
  const doc = '<foo><?bar baz?></foo>'
  const res = []
  s.onSpecial = s => res.push(s)
  s.write(doc)

  assert.equal(res, ['?bar baz?'])
})

test('return false to disable', () => {
  const s = new Scrapie()
  const doc =
    '<foo><bar id="this">and this<p>but not this</bar><bar id="nor this">this neither</bar></foo>'
  const res = []
  s.when('bar').do(({ attrs }) => {
    res.push(attrs.id)
    s.onText(txt => {
      res.push(txt)
      return false
    })
    return false
  })
  s.write(doc)

  assert.equal(res, ['this', 'and this'])
})

test.run()
