
import { HTMLToken } from './HTMLToken.js';

export class CommentToken extends HTMLToken {
  constructor(
    public data: string,
    public startPosition: number,
    public endPosition: number,
    public line: number,
    public column: number,
    public isConditional: boolean
  ) {
    super({
      type: 'Comment',
      position: {
        start: startPosition,
        end: endPosition,
        line: line,
        column: column
      }
    });
  }
}