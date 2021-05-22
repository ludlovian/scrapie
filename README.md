# scrapie
Ultra-light html &amp; xml parser


## Why?

For myself.

But also, most scrapers & parsers do far more than I need. Why learn a
while new DSL in either XSLT paths or JQuery commands when a few
lines of JS will do it?

It is super simple, very tolerant and docile. Like a sheep.

### How does it work

HTML or XML data is split into `text` and `tag` elements as it is streamed in.

CDATA, script elements and comments are all identified and ignored. As are prologs and other wierdies.



## Scrapie

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
The is maintained during parsing as the list of tags that get you back to the top.

E.g. `['html', 'body', 'table', 'tr', 'td', 'a']`

And `.depth` is simply the path length.

The parser intelligently copes with tags that neither have a mathcing close, nor are markerd
as self closing. Usually these are things like `<p>`, `<br>` or `<img>`. When it encounters the
next closing tag, it pops off enough elements from the path stack to make it match.

### hook(fn, ctx)
The guts of it.

The supplied function is called on every tag or text with `{ tag, text }` on:

- each open tag, where the tag has the form `{ type, attrs, selfClose }`
- each close tag, where the tag has the form `{ type, close }`
- each text element, where text is just a string.

If a context was supplied when setting up the
hook, then it will be passed through unchanged as the second param.

If the function returns `false` then it will be removed.

### .when(condition)
A nicer wrapper around `.hook`. This returns a `Matcher` object - *see below*.



## Matcher

A matcher is aware of the current depth of the parser when it was created, and
only exists whilst the parser stays at that depth or lower. This allows you to
create matchers duing a parse, say when encountering a certain `<div>` element,
which only scan the document inside that element.

A matcher is created with a matching function, with signature `(tag) => true/false`.
It examines every opening tag (whilst it exists) to see if that matches.

It can also be created with a simple string, like `'div'` which is a shortcut for
a function matching a tag's `type`.

#### .onTag(fn)

Sets the function to be called when entering a tag that meets the condition.

The function receives `(tag, ctx)`. If it returns false, then the matcher itself
will be uninstalled.

The second argument provided is a context - initially an empty object. The same object
is provided to all the callbacks.

#### .atEnd(fn)

Sets a function to be called when the tag is closed.
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
