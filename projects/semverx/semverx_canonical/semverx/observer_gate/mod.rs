//! Observer-Mediated Recovery Architecture
//! 
//! 34-level fault taxonomy with auto-rollback

pub mod adjudicator;
pub mod fault_taxonomy;
pub mod recovery;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FaultLevel {
    Warning,        // 0-5
    Danger,         // 6-11
    ObserverActive, // 12-17
    Critical,       // 18-23
    Healing,        // 24-29
    Termination,    // 30-33
}

impl FaultLevel {
    pub fn from_code(code: u8) -> Self {
        match code {
            0..=5 => Self::Warning,
            6..=11 => Self::Danger,
            12..=17 => Self::ObserverActive,
            18..=23 => Self::Critical,
            24..=29 => Self::Healing,
            30..=33 => Self::Termination,
            _ => Self::Termination,
        }
    }
    
    pub fn requires_rollback(&self) -> bool {
        matches!(self, Self::ObserverActive | Self::Critical | Self::Termination)
    }
}
