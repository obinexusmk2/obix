// tokenizer/types.ts
import { HTMLToken } from "./tokens";

export interface TokenizerError {
    message: string;
    severity: 'warning' | 'error';
    line: number;
    column: number;
    start: number;
    end: number;
  }
  
  export interface TokenizerResult {
    tokens: HTMLToken[];
    errors: TokenizerError[];
  }
  // tokenizer/types.ts


export interface TokenizerError {
  message: string;
  severity: 'warning' | 'error';
  line: number;
  column: number;
  start: number;
  end: number;
}

export interface TokenizerResult {
  tokens: HTMLToken[];
  errors: TokenizerError[];
}

export interface TokenizerOptions {
  xmlMode?: boolean;
  recognizeCDATA?: boolean;
  recognizeConditionalComments?: boolean;
  preserveWhitespace?: boolean;
  allowUnclosedTags?: boolean;
  advanced?: boolean;
}
export interface TokenState {
  transitions: Map<string, TokenState>;
  isAccepting: boolean;
  equivalenceClass: number | null;
}

export interface TokenMetadata {
  equivalenceClass: number | null;
  stateSignature: string | null;
  isMinimized: boolean;
}

export interface TokenizerError {
  message: string;
  severity: 'warning' | 'error';
  line: number;
  column: number;
  start: number;
  end: number;
}

