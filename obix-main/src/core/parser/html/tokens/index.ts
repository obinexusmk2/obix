import { BaseToken, StartTagToken, EndTagToken, TextToken, CommentToken, DoctypeToken, CDATAToken, EOFToken } from './HTMLTokenType.js';

// Export core token types
export { 
    HTMLTokenType,
    TokenType,
    BaseToken,
    StartTagToken,
    EndTagToken,
    TextToken,
    CommentToken,
    ConditionalCommentToken,
    DoctypeToken,
    CDATAToken,
    EOFToken,
    type HTMLToken as IHTMLTOken
  } from './HTMLTokenType';
  
  // Export token implementation
  export { 
    HTMLToken,
    TokenMetadata,
    TokenState
  } from './HTMLToken';

  // Export token builder
  export { HTMLTokenBuilder } from './HTMLTokenBuilder';
  
  // Helper functions
  export function isStartTag(token: BaseToken): token is StartTagToken {
    return token.type === 'StartTag';
  }
  
  export function isEndTag(token: BaseToken): token is EndTagToken {
    return token.type === 'EndTag';
  }
  
  export function isText(token: BaseToken): token is TextToken {
    return token.type === 'Text';
  }
  
  export function isComment(token: BaseToken): token is CommentToken {
    return token.type === 'Comment';
  }
  
  export function isDoctype(token: BaseToken): token is DoctypeToken {
    return token.type === 'Doctype';
  }
  
  export function isCDATA(token: BaseToken): token is CDATAToken {
    return token.type === 'CDATA';
  }
  
  export function isEOF(token: BaseToken): token is EOFToken {
    return token.type === 'EOF';
  }