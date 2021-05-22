import { test } from 'uvu'
import * as assert from 'uvu/assert'

import Scrapie from '../src/scrapie.mjs'

test('basic conditional capture', () => {
  const s = new Scrapie()
  const doc = '<foo><bar>quux</bar>baz</foo>'
  const res = []
  s.when('foo').onTag(() => {
    s.when('bar')
      .onTag((tag, ctx) => {
        ctx.res = []
        assert.equal(s.path, ['foo', 'bar'])
      })
      .onText((t, ctx) => ctx.res.push(t))
      .atEnd(ctx => res.push(...ctx.res, 'END'))
  })
  s.write(doc)

  assert.equal(res, ['quux', 'END'])
})

test('cope with non closing tags', () => {
  const s = new Scrapie()
  const doc = '<foo><foo bar="baz">get this<p>and this</foo>not this</foo>'
  const res = []
  s.when(({ type, attrs: { bar } }) => type === 'foo' && bar).onText(txt =>
    res.push(txt)
  )
  s.write(doc)

  assert.equal(res, ['get this', 'and this'])
})

test('self closing tags', () => {
  const s = new Scrapie()
  const doc = '<foo><bar baz="this" />not this</foo>'
  const res = []
  s.when('bar')
    .onTag(({ attrs }) => res.push(attrs.baz))
    .onText(txt => res.push(txt))
    .atEnd(assert.unreachable)

  s.write(doc)

  assert.equal(res, ['this'])
})

test('close non-opened', () => {
  const s = new Scrapie()
  const doc = '<html><foo></bar><baz>get this</baz></foo></html>'
  const res = []
  s.when('html').onTag(() => {
    s.when('foo').onText(assert.unreachable)
    s.when('baz').onText(assert.unreachable)
  })

  s.hook(({ text }) => {
    if (!text) return
    res.push(text)
    assert.is(s.depth, 1)
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
  s.when('bar').onTag(({ attrs }) => {
    res.push(attrs.id)
    return false
  })
  s.when('foo').onText(txt => {
    res.push(txt)
    return false
  })

  s.write(doc)

  assert.equal(res, ['this', 'and this'])
})

test('deep nesting', () => {
  const doc = '<html><foo><bar>one<bar>two</bar>three</bar>four</foo></html>'
  const s = new Scrapie()
  const res = []

  s.when('foo').onTag(() => {
    s.when('bar')
      .onText(t => res.push(t))
      .atEnd(() => res.push('exit'))
  })

  s.write(doc)

  assert.equal(res, ['one', 'two', 'two', 'exit', 'three', 'exit'])
})

test.run()
