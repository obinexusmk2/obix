import { HTMLToken } from './HTMLToken.js';

export class CDATAToken extends HTMLToken {
  constructor(
    public content: string,
    public start: number,
    public end: number,
    public line: number,
    public column: number
  ) {
    super({ type: 'CDATA', position: { start, end, line, column } });
  }
}