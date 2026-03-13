//! AVL-Backed Package Registry
//! 
//! Features:
//! - O(log n) lookups
//! - AuraSeal cryptographic signing
//! - Rate-limited observer pattern (5-10 updates/sec)

pub mod avl_tree;
pub mod aura_seal;
pub mod rate_limiter;

use std::collections::BTreeMap;

#[derive(Debug)]
pub struct PackageRegistry {
    index: BTreeMap<String, PackageEntry>,
}

#[derive(Debug, Clone)]
pub struct PackageEntry {
    pub name: String,
    pub version: String,
    pub tarball_hash: Vec<u8>,
    pub signature: Vec<u8>,
}
