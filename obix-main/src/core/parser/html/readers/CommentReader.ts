import { HTMLToken, HTMLTokenType } from '../tokens/HTMLTokenType.js';

export class CommentReader {
    /**
     * Attempts to read an HTML comment from the input string
     * @param input Input string to parse
     * @param position Current position in the input
     * @returns Object containing the parsed comment token and number of characters consumed
     */
    readNext(
        input: string,
        position: { start: number; line: number; column: number }
    ): { token: HTMLToken | null; consumed: number } {
        // Check if we have enough characters for a comment start "<!--"
        if (input.length < 4) {
            return { token: null, consumed: 0 };
        }

        // Check if this is actually a comment
        if (input.substring(0, 4) !== '<!--') {
            return { token: null, consumed: 0 };
        }

        let consumed = 4; // Start after <!--
        let content = '';
        let endFound = false;

        // Look for comment end "-->"
        while (consumed < input.length) {
            if (
                input[consumed] === '-' &&
                input[consumed + 1] === '-' &&
                input[consumed + 2] === '>'
            ) {
                endFound = true;
                consumed += 3;
                break;
            }
            content += input[consumed];
            consumed++;
        }

        // If we didn't find a proper end, return null
        if (!endFound) {
            return { token: null, consumed: 0 };
        }

        return {
            token: {
                type: HTMLTokenType.COMMENT,
                content: content,
                position: {
                    start: position.start,
                    end: position.start + consumed,
                    line: position.line,
                    column: position.column
                }
            },
            consumed
        };
    }

    /**
     * Updates position information based on consumed content
     * @param input Content that was consumed
     * @param position Current position
     * @returns Updated position
     */
    updatePosition(
        input: string,
        position: { start: number; line: number; column: number }
    ): { start: number; line: number; column: number } {
        const lines = input.split('\n');
        const newPosition = { ...position };

        if (lines.length === 1) {
            newPosition.column += input.length;
        } else {
            newPosition.line += lines.length - 1;
            newPosition.column = (lines[lines.length - 1] ?? '').length + 1;
        }
        newPosition.start += input.length;

        return newPosition;
    }
}