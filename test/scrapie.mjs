import { test } from 'uvu'
import * as assert from 'uvu/assert'

import Scrapie from '../src/scrapie.mjs'

test('basic conditional capture', () => {
  const s = new Scrapie()
  const doc = '<foo><bar>quux</bar>baz</foo>'
  const res = []
  s.whenTag(
    ({ type }) => type === 'foo',
    tag =>
      s.whenTag(
        ({ type }) => type === 'bar',
        () => s.onText(txt => res.push(txt))
      )
  )
  s.write(doc)

  assert.equal(res, ['quux'])
})

test('cope with non closing tags', () => {
  const s = new Scrapie()
  const doc = '<foo><foo bar="baz">get this<p>and this</foo>not this</foo>'
  const res = []
  s.whenTag(
    ({ type, attrs: { bar } }) => type === 'foo' && bar,
    () => s.onText(txt => res.push(txt))
  )
  s.write(doc)

  assert.equal(res, ['get this', 'and this'])
})

test('self closing tags', () => {
  const s = new Scrapie()
  const doc = '<foo><bar baz="this" />not this</foo>'
  const res = []
  s.whenTag(
    ({ type }) => type === 'bar',
    ({ attrs }) => {
      res.push(attrs.baz)
      s.onText(txt => res.push(txt))
    }
  )
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

test('once logic', () => {
  const s = new Scrapie()
  const doc =
    '<foo><bar id="this">and this<p>but not this</bar><bar id="nor this">this neither</bar></foo>'
  const res = []
  s.whenTag(
    ({ type }) => type === 'bar',
    ({ attrs }) => {
      res.push(attrs.id)
      s.onText(txt => res.push(txt), { once: true })
    },
    { once: true }
  )
  s.write(doc)

  assert.equal(res, ['this', 'and this'])
})

test.run()
