//! SemVerX PolyGatic Registry & Runtime
//! 
//! Implements:
//! - Extended semantic versioning (major.minor.patch(channel))
//! - Tri-node BiDAG resolution
//! - FilterFlash coherence gating
//! - Observer-mediated recovery

#![deny(unsafe_code)]
#![warn(missing_docs)]

pub mod core;
pub mod filterflash;
pub mod bidag;
pub mod observer_gate;
pub mod registry;
pub mod nlm;
pub mod polycall;

pub use core::*;
pub use filterflash::FilterFlashFunctor;
pub use bidag::{Node, Strategy};
pub use observer_gate::FaultLevel;

/// SemVerX version tuple
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SemVerX {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
    pub channel: Channel,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Channel {
    Legacy,
    Experimental,
    Stable,
    LTS,
}
