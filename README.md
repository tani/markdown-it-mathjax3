# markdown-it-mathjax3

Add Math to your Markdown

This is a fork of [markdown-it-katex](http://waylonflinn.github.io/markdown-it-katex/) to support MathJax v3 and SVG rendering.

## Usage

Install markdown-it

```
npm install markdown-it
```

Install the plugin

```
npm install markdown-it-mathjax3
```

Use it in your javascript

```javascript
var md = require('markdown-it')(),
    mathjax3 = require('markdown-it-mathjax3');

md.use(mathjax3);

// double backslash is required for javascript strings, but not html input
var result = md.render('# Math Rulez! \n  $\\sqrt{3x-1}+(1+x)^2$');
```

## Examples

### Inline

Surround your LaTeX with a single `$` on each side for inline rendering.
```
$\sqrt{3x-1}+(1+x)^2$
```

### Block

Use two (`$$`) for block rendering. This mode uses bigger symbols and centers
the result.

```
$$\begin{array}{c}

\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &
= \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\

\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\

\nabla \cdot \vec{\mathbf{B}} & = 0

\end{array}$$
```

## Syntax

Math parsing in markdown is designed to agree with the conventions set by pandoc:

    Anything between two $ characters will be treated as TeX math. The opening $ must
    have a non-space character immediately to its right, while the closing $ must
    have a non-space character immediately to its left, and must not be followed
    immediately by a digit. Thus, $20,000 and $30,000 won’t parse as math. If for some
    reason you need to enclose text in literal $ characters, backslash-escape them and
    they won’t be treated as math delimiters.
