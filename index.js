/* Process inline math */
/*
Like markdown-it-simplemath, this is a stripped down, simplified version of:
https://github.com/runarberg/markdown-it-math

It differs in that it takes (a subset of) LaTeX as input and relies on KaTeX
for rendering output.
*/

'use strict';

var katex = require('katex');

//return if we have valid delimiter, '$', is in the position.
function isValidDelim(state) {
  var lastChar, secondLastChar, nextChar, pos = state.pos;

  if(state.src[pos]!=='$'){
    return false; //the character $ must be in its position.
  }

  secondLastChar= pos > 1 ? state.src[pos-2] : ' '
  lastChar      = pos > 0 ? state.src[pos-1] : ' '
  nextChar      = pos + 1 < state.src.length ? state.src[pos+1] : ' '

  if(
    lastChar === '\\' //$ we found was escaped.
    || (lastChar === '$' && secondLastChar !== '\\') // $ we found was after $ but not escaped.
    || nextChar === '$' //$ we found was actually block delimiter $$.
  )
  {
    return false;
  }

  return true;
}

function math_inline(state, silent){
  var start, found = false, token;
  if(silent) { return false; }

  start = state.pos;
  if(state.src[start] !== '$'){ return false; }
  if(!isValidDelim(state)){
    state.pos += 1;
    state.pending += '$';
    return true;
  }
  state.pos+=1;

  while(state.pos < state.posMax){
    if(isValidDelim(state)){
      found = true;
      break;
    }
    state.md.inline.skipToken(state);
  }
  if(!found){
    // Parser failed to find closing delimiter, so it is not a valid math
    state.pos = start;
    return false;
  }

  //found the closing delimiter and state.pos is pointing it
  token = state.push('math_inline','math',0);
  token.content = state.src.slice(start+1,state.pos).trim();
  token.markup = '$';

  state.pos += 1;
  return true;
}

function math_block(state, start, end, silent){
  var firstLine, lastLine, next, lastPos, found = false, token,
      pos = state.bMarks[start] + state.tShift[start],
      max = state.eMarks[start]

  if(pos + 2 > max){ return false; }
  if(state.src.slice(pos,pos+2)!=='$$'){ return false; }

  pos += 2;
  firstLine = state.src.slice(pos,max);

  if(silent){ return true; }
  if(firstLine.trim().slice(-2)==='$$'){
    // Single line expression
    firstLine = firstLine.trim().slice(0, -2);
    found = true;
  }

  for(next = start; !found; ){

    next++;

    if(next >= end){ break; }

    pos = state.bMarks[next]+state.tShift[next];
    max = state.eMarks[next];

    if(pos < max && state.tShift[next] < state.blkIndent){
      // non-empty line with negative indent should stop the list:
      break;
    }

    if(state.src.slice(pos,max).trim().slice(-2)==='$$'){
      lastPos = state.src.slice(0,max).lastIndexOf('$$');
      lastLine = state.src.slice(pos,lastPos);
      found = true;
    }

  }

  state.line = next + 1;

  token = state.push('math_block', 'math', 0);
  token.block = true;
  token.content = (firstLine && firstLine.trim() ? firstLine + '\n' : '')
    + state.getLines(start + 1, next, state.tShift[start], true)
    + (lastLine && lastLine.trim() ? lastLine : '');
  token.map = [ start, state.line ];
  token.markup = '$$';
  return true;
}

module.exports = function math_plugin(md, options) {
  // Default options

  options = options || {};

  // set KaTeX as the renderer for markdown-it-simplemath
  var katexInline = function(latex){
    options.displayMode = false;
    try{
      return katex.renderToString(latex, options);
    }
    catch(error){
      if(options.throwOnError){ console.log(error); }
      return latex;
    }
  };

  var inlineRenderer = function(tokens, idx){
    return katexInline(tokens[idx].content);
  };

  var katexBlock = function(latex){
    options.displayMode = true;
    try{
      return katex.renderToString(latex, options);
    }
    catch(error){
      if(options.throwOnError){ console.log(error); }
      return latex;
    }
  }

  var blockRenderer = function(tokens, idx){
    return  katexBlock(tokens[idx].content) + '\n';
  }

  md.inline.ruler.before('escape', 'math_inline', math_inline);
  md.block.ruler.after('blockquote', 'math_block', math_block, {
    alt: [ 'paragraph', 'reference', 'blockquote', 'list' ]
  });
  md.renderer.rules.math_inline = inlineRenderer;
  md.renderer.rules.math_block = blockRenderer;
};
