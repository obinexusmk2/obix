import { CommentProcessor, DoctypeProcessor, TokenizerProcessor } from ".";
import { CDATAProcessor } from "./CDataProcessor.js";
import { TagProcessor } from "./TagProcessor.js";
import { TextProcessor } from "./TextProcessor.js";


/**
 * Processor factory to create appropriate processors
 */
export class ProcessorFactory {
  public options: any;
  public tagProcessor: TagProcessor;
  public commentProcessor: CommentProcessor;
  public cdataProcessor: CDATAProcessor;
  public textProcessor: TextProcessor;
  public doctypeProcessor: DoctypeProcessor;
  
  constructor(options: any = {}) {
    this.options = options;
    
    // Initialize processors
    this.tagProcessor = new TagProcessor();
    this.commentProcessor = new CommentProcessor();
    this.cdataProcessor = new CDATAProcessor();
    this.textProcessor = new TextProcessor(options.preserveWhitespace);
    this.doctypeProcessor = new DoctypeProcessor();
  }
  
  /**
   * Get a processor for a specific input
   */
  getProcessorForInput(input: string): TokenizerProcessor {
    if (input.startsWith('<!--')) {
      return this.commentProcessor;
    }
    
    if (input.startsWith('<!DOCTYPE') || input.startsWith('<!doctype')) {
      return this.doctypeProcessor;
    }
    
    if (this.options.recognizeCDATA && input.startsWith('<![CDATA[')) {
      return this.cdataProcessor;
    }
    
    if (input.startsWith('<')) {
      return this.tagProcessor;
    }
    
    return this.textProcessor;
  }
}