import { test } from 'uvu'
import * as assert from 'uvu/assert'

import Scrapie from '../src/scrapie.mjs'

test('basic conditional capture', () => {
  const scrapie = new Scrapie()
  const doc = '<foo><bar>quux</bar>baz</foo>'
  const res = []
  scrapie.whenTag(
    ({ type }) => type === 'foo',
    (tag, s) =>
      s.whenTag(
        ({ type }) => type === 'bar',
        (tag, s) => s.onText(txt => res.push(txt))
      )
  )
  scrapie.write(doc)

  assert.equal(res, ['quux'])
})

test('cope with non closing tags', () => {
  const scrapie = new Scrapie()
  const doc = '<foo><foo bar="baz">get this<p>and this</foo>not this</foo>'
  const res = []
  scrapie.whenTag(
    ({ type, attrs: { bar } }) => type === 'foo' && bar,
    (tag, s) => s.onText(txt => res.push(txt))
  )
  scrapie.write(doc)

  assert.equal(res, ['get this', 'and this'])
})

test('self closing tags', () => {
  const scrapie = new Scrapie()
  const doc = '<foo><bar baz="this" />not this</foo>'
  const res = []
  scrapie.whenTag(
    ({ type }) => type === 'bar',
    ({ attrs }, s) => {
      res.push(attrs.baz)
      s.onText(txt => res.push(txt))
    }
  )
  scrapie.write(doc)

  assert.equal(res, ['this'])
})

test('close non-opened', () => {
  const scrapie = new Scrapie()
  const doc = '<foo></bar>get this</foo>'
  const res = []
  scrapie.onText((txt, s) => {
    res.push(txt)
    assert.is(s.depth, 0)
  })
  scrapie.write(doc)

  assert.equal(res, ['get this'])
})

test('special tags', () => {
  const scrapie = new Scrapie()
  const doc = '<foo><?bar baz?></foo>'
  const res = []
  scrapie.onSpecial = s => res.push(s)
  scrapie.write(doc)

  assert.equal(res, ['?bar baz?'])
})

test.run()
