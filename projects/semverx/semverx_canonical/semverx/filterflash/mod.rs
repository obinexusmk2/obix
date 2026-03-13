//! FilterFlash Functor - Coherence Gating Mechanism
//! 
//! Implements:
//! - F: Artifact → CanonicalArtifact
//! - Coherence scoring (gate at ≥0.954)
//! - Idempotent canonicalization
//! - Cross-language determinism

pub mod extractor;
pub mod canonicalizer;
pub mod scorer;

use std::collections::HashMap;

/// Coherence threshold (95.4%)
pub const COHERENCE_GATE: f64 = 0.954;

#[derive(Debug, Clone)]
pub struct FeatureVector {
    pub ast_hash: Vec<u8>,
    pub control_flow: Vec<u8>,
    pub literals: HashMap<String, usize>,
}

#[derive(Debug, Clone)]
pub struct CanonicalArtifact {
    pub canonical_hash: Vec<u8>,
    pub coherence: f64,
    pub features: FeatureVector,
}

pub trait FilterFlashFunctor {
    fn extract_features(&self, artifact: &[u8]) -> FeatureVector;
    fn canonicalize(&self, features: FeatureVector) -> Vec<u8>;
    fn score(&self, canonical: &[u8], corpus: &[&[u8]]) -> f64;
    fn transform(&self, artifact: &[u8]) -> CanonicalArtifact;
}
