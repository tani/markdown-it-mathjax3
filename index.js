/* Process inline math */
/*
Like markdown-it-simplemath, this is a stripped down, simplified version of:
https://github.com/runarberg/markdown-it-math

It differs in that it takes (a subset of) LaTeX as input and relies on KaTeX
for rendering output.
*/

'use strict';

var katex = require('katex');


function scanDelims(state, start, delimLength) {
  var pos = start, lastChar, nextChar, count, can_open, can_close,
      isLastWhiteSpace, isLastPunctChar,
      isNextWhiteSpace, isNextPunctChar,
      left_flanking = true,
      right_flanking = true,
      max = state.posMax,
      isWhiteSpace = state.md.utils.isWhiteSpace,
      isPunctChar = state.md.utils.isPunctChar,
      isMdAsciiPunct = state.md.utils.isMdAsciiPunct;

  // treat beginning of the line as a whitespace
  lastChar = start > 0 ? state.src.charCodeAt(start - 1) : 0x20;

  if (pos >= max) {
    can_open = false;
  }

  pos += delimLength;

  count = pos - start;

  // treat end of the line as a whitespace
  nextChar = pos < max ? state.src.charCodeAt(pos) : 0x20;

  isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
  isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));

  isLastWhiteSpace = isWhiteSpace(lastChar);
  isNextWhiteSpace = isWhiteSpace(nextChar);

  if (isNextWhiteSpace) {
    left_flanking = false;
  } else if (isNextPunctChar) {
    if (!(isLastWhiteSpace || isLastPunctChar)) {
      left_flanking = false;
    }
  }

  if (isLastWhiteSpace) {
    right_flanking = false;
  } else if (isLastPunctChar) {
    if (!(isNextWhiteSpace || isNextPunctChar)) {
      right_flanking = false;
    }
  }

  can_open = left_flanking;
  can_close = right_flanking;

  return {
    can_open: can_open,
    can_close: can_close,
    delims: count
  };
}


function makeMath_inline(open, close) {
  return function math_inline(state, silent) {
    var startCount,
        found,
        res,
        token,
        closeDelim,
        max = state.posMax,
        start = state.pos,
        openDelim = state.src.slice(start, start + open.length);

    if (openDelim !== open) { return false; }
    if (silent) { return false; }    // Don’t run any pairs in validation mode

    res = scanDelims(state, start, openDelim.length);
    startCount = res.delims;

    if (!res.can_open) {
      state.pos += startCount;
      // Earlier we checked !silent, but this implementation does not need it
      state.pending += state.src.slice(start, state.pos);
      return true;
    }

    state.pos = start + open.length;

    while (state.pos < max) {
      closeDelim = state.src.slice(state.pos, state.pos + close.length);
      if (closeDelim === close) {
        res = scanDelims(state, state.pos, close.length);
        if (res.can_close) {
          found = true;
          break;
        }
      }

      state.md.inline.skipToken(state);
    }

    if (!found) {
      // Parser failed to find ending tag, so it is not a valid math
      state.pos = start;
      return false;
    }

    // Found!
    state.posMax = state.pos;
    state.pos = start + close.length;

    // Earlier we checked !silent, but this implementation does not need it
    token = state.push('math_inline', 'math', 0);
    token.content = state.src.slice(state.pos, state.posMax);
    token.markup = open;

    state.pos = state.posMax + close.length;
    state.posMax = max;

    return true;
  };
}

function makeMath_block(open, close) {
  return function math_block(state, startLine, endLine, silent) {
    var openDelim, len, params, nextLine, token, firstLine, lastLine, lastLinePos,
        haveEndMarker = false,
        pos = state.bMarks[startLine] + state.tShift[startLine],
        max = state.eMarks[startLine];

    if (pos + open.length > max) { return false; }

    openDelim = state.src.slice(pos, pos + open.length);

    if (openDelim !== open) { return false; }

    pos += open.length;
    firstLine = state.src.slice(pos, max);

    // Since start is found, we can report success here in validation mode
    if (silent) { return true; }

    if (firstLine.trim().slice(-close.length) === close) {
      // Single line expression
      firstLine = firstLine.trim().slice(0, -close.length);
      haveEndMarker = true;
    }

    // search end of block
    nextLine = startLine;

    for (;;) {
      if (haveEndMarker) { break; }

      nextLine++;

      if (nextLine >= endLine) {
        // unclosed block should be autoclosed by end of document.
        // also block seems to be autoclosed by end of parent
        break;
      }

      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (pos < max && state.tShift[nextLine] < state.blkIndent) {
        // non-empty line with negative indent should stop the list:
        break;
      }

      if (state.src.slice(pos, max).trim().slice(-close.length) !== close) {
        continue;
      }

      if (state.tShift[nextLine] - state.blkIndent >= 4) {
        // closing block math should be indented less then 4 spaces
        continue;
      }

      lastLinePos = state.src.slice(0, max).lastIndexOf(close);
      lastLine = state.src.slice(pos, lastLinePos);

      pos += lastLine.length + close.length;

      // make sure tail has spaces only
      pos = state.skipSpaces(pos);

      if (pos < max) { continue; }

      // found!
      haveEndMarker = true;
    }

    // If math block has heading spaces, they should be removed from its inner block
    len = state.tShift[startLine];

    state.line = nextLine + (haveEndMarker ? 1 : 0);

    token = state.push('math_block', 'math', 0);
    token.block = true;
    token.content = (firstLine && firstLine.trim() ? firstLine + '\n' : '') +
      state.getLines(startLine + 1, nextLine, len, true) +
      (lastLine && lastLine.trim() ? lastLine : '');
    token.info = params;
    token.map = [ startLine, state.line ];
    token.markup = open;

    return true;
  };
}


module.exports = function math_plugin(md, options) {
  // Default options

  var inlineOpen = '$',
      inlineClose = '$',
      blockOpen = '$$',
      blockClose = '$$';

  options = options || {};

  // set KaTeX as the renderer for markdown-it-simplemath
  var katexInline = function(latex){
    options.displayMode = false;
    return katex.renderToString(latex, options);
  };

  var inlineRenderer = function(tokens, idx){
    return katexInline(tokens[idx].content);
  };

  var katexBlock = function(latex){
    options.displayMode = true;
    return katex.renderToString(latex, options);
  }

  var blockRenderer = function(tokens, idx){
    return  katexBlock(tokens[idx].content) + '\n';
  }

  var math_inline = makeMath_inline(inlineOpen, inlineClose);
  var math_block = makeMath_block(blockOpen, blockClose);

  md.inline.ruler.before('escape', 'math_inline', math_inline);
  md.block.ruler.after('blockquote', 'math_block', math_block, {
    alt: [ 'paragraph', 'reference', 'blockquote', 'list' ]
  });
  md.renderer.rules.math_inline = inlineRenderer;
  md.renderer.rules.math_block = blockRenderer;
};
