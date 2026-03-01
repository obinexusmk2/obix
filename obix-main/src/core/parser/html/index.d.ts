  // parser/tokenizer/index.d.ts
  declare module 'obix/parser/tokenizer' {
    import { TokenizerOptions } from 'obix/parser/types';
  
    export enum TokenType {
      StartTag,
      EndTag,
      Text,
      Comment,
      Doctype,
      CDATA,
      EOF
    }
  
    export interface Token {
      type: TokenType;
      value: string;
      attributes?: Map<string, string>;
      selfClosing?: boolean;
      metadata?: Record<string, any>;
    }
  
    export class HTMLTokenizer {
      constructor(input: string, options?: TokenizerOptions);
      tokenize(): { tokens: Token[], errors: Error[] };
      consumeToken(): Token;
      readTag(): Token;
      readAttribute(): [string, string];
      readText(): Token;
      readComment(): Token;
    }
  }