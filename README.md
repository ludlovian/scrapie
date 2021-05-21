# scrapie
Ultra-light html &amp; xml parser

## Why?

For myself.

But also, most scrapers & parsers do far more than I need. Why learn a
while new DSL in either XSLT paths or JQuery commands when a few
lines of JS will do it?

It is super simple, very tolerant and docile. Like a sheep.

## How does it work

HTML or XML data is split into `text` and `tag` elements as it is streamed in.

Tags are then parsed to see if we can understand them - i.e. with a type
and attributes.

CDATA, bare &lt;script&gt; tags and comments are all identified and ignored.

## API

### Scrapie

There are no options. Just create one.
```
import Scrapie from 'scrapie'

const s = new Scrapie()
```

### .write(text)
Push data in as you get it.

### .close
You don't need to call it, but you can if it gives a sense of closure.

### .path / .depth
The path is the array of tags that get you back to the top.

E.g. `['html', 'body', 'table', 'tr', 'td', 'a']`

And `.depth` is simply the path length.

### hook(fn, ctx)
The guts of it.

The supplied function is called with `{ tag, text }` on:

- each tag opening, after the tag has been added to the path
- each tag closing, just before removing from the path
- each text element.

Self-closing tags result in only one call, but with `.selfClose = true`.

If a context was supplied when setting up the
hook, then it will be passed through unchanged as the second param.

If the function returns `false` then it will be removed.


### .when(condition)
A nicer wrapper around `.hook`. This creates a hook which will automatically
be removed when the parser's depth rises above the level it was at when
the hook was added. This allows you to do conditional hooks.

If the condition is simply a string, then it is assumed to be a test against
a tag's `type`. Else it should be a function `(tag, ctx) => Boolean`.

The second arg is a context is set as an empty object, and also passed through
to the other callbacks.

The method returns a `Hook` object, which has the following methods, each of
which return the same object to allow chaining.

#### .onTag(fn)

Sets the function to be called when entering a tag that meets the condition.

The function receives `(tag, ctx)`. If it returns false, then the whole
conditional hook will be uninstalled.

#### .atEnd(fn)

Sets a function to be called when the tag is closed..
The function recieves `(ctx)`. Self-closing tags do not result in a call.

#### .onText(fn)

Sets a function to be called for any text (at any level) appearing
inside the selected tag. The function receives `(text, ctx)` and if it
returns `false` then no further calls will be made whilst in this tag.

## Example

```
const s = new Scrapie()

s.when('table')
  .onTag(() => {
    s.when('tr')
      .onTag((tag, ctx) => {
        ctx.row = []
      })
      .onText((t, ctx) => {
        if (s.path.includes('td')) {
            ctx.row.push(t)
        }
      })
      .atEnd(ctx => {
        postRow(ctx.row)
      })
  })

for await (const chunk of source) {
  s.write(chunk)
}
```
