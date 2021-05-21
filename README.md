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
- each tag closing, after the tag has been removed from the path
- each text element.

Self-closing tags result in only one call, but with `.selfClose = true`.

If a context was supplied when setting up the
hook, then it will be passed through unchanged as the second param.

if the function returns `false` then it will be removed.


Like It autoremove

### .when(condition)
A nicer wrapper around `.hook`. This creates a hook which will automatically
be removed when the parser's depth rises above the level it was at when
the hook was added. This allows you to do conditional hooks.

If the condition is simply a string, then it is assumed to be a test against
a tag's `type`. Else it should be a function taking the tag as an argument
and returning a Boolean.

The method returns a `Hook` object, which has the following methods.

#### .do(fn)

Sets the function to be called, passing the tag as a parameter, when the hook's condition is true.
Also returns the hook to allow chaining.

#### .atEnd(fn)

Sets a function to be called when the hook is removed.

Obviously a hook added before parsing starts (`depth === 0`) is never auto-removed, so
this will never be called.

### .onText(action, { once })
A simple wrapper around `.hook` to be called only for text elements.

Like `.when` it auto-removes once the parser's rises above the point at which
it was installed.

## Example

```
const s = new Scrapie()

s.when('table')
  .do(() => {
    s.when('tr')
      .do(() => {
        const row = []
        s.onText(t => {
          if (s.path.includes('td')) {
            row.push(t)
          }
        })
      })
      .atEnd({
        // row is finished
        postRow(row)
      })
  })

for await (const chunk of source) {
  s.write(chunk)
}
```
