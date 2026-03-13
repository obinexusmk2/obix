//! Neuro-Linguistic Mechanical Layer
//! 
//! Lexer → Parser → AST with observer-gated states

pub mod lexer;
pub mod parser;
pub mod ast;
pub mod atlas;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum LexState {
    Start,
    Scan,
    Error,
    Gated,  // Observer required
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ParseState {
    Ready,
    Build,
    Conflict,
    Resolve,
    Error,
}
