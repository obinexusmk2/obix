//! Core SemVerX primitives
//! 
//! Implements major.minor.patch(channel) version semantics

pub mod semverx;
pub mod channels;
pub mod platform;

pub use semverx::*;
pub use channels::*;
