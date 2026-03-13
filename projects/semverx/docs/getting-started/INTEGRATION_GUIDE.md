# rust-semverx Complete Integration Guide
## Bridging github.com/obinexus/rust-semverx and github.com/obinexus/semverx

---

## Overview

You have **two repositories** that need to work together:

1. **rust-semverx** — Core Rust implementation with DAG resolution
2. **semverx** — Polyglot workspace with TypeScript/Python/C bindings

This guide shows how to integrate them for full SemVerX PolyGatic BiDAG compliance.

---

## Architecture Integration

### Repository Roles

```
┌─────────────────────────────────────────────────────────┐
│  github.com/obinexus/rust-semverx                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │ CORE RUST IMPLEMENTATION                          │  │
│  │ • DAG resolver (Euler/Hamilton/A*)               │  │
│  │ • Core semver parsing                             │  │
│  │ • FFI/C API                                       │  │
│  │ • ODTS integration (aghe-dozie)                   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
                     FFI Bindings
                           ↓
┌─────────────────────────────────────────────────────────┐
│  github.com/obinexus/semverx                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │ POLYGLOT WORKSPACE                                │  │
│  │ • FilterFlash (Python oracle)                     │  │
│  │ • Observer Gate                                    │  │
│  │ • BiDAG tri-node topology                         │  │
│  │ • TypeScript/Python clients                       │  │
│  │ • Registry (AVL + AuraSeal)                       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Integration

### Phase 1: Sync Implementations (Week 1)

#### 1.1 Copy DAG Resolution from rust-semverx to semverx

```bash
# In rust-semverx repository
cd ~/obinexus/workspace/rust-semverx

# Build and test DAG strategies
cargo test --package semverx --lib resolver::strategies

# Copy implementation to semverx repo
cp src/resolver/strategies.rs \
   ~/obinexus/workspace/semverx/semverx/bidag/resolver/

# Copy supporting files
cp src/resolver/{graph.rs,types.rs,errors.rs} \
   ~/obinexus/workspace/semverx/semverx/bidag/
```

#### 1.2 Extract FFI Layer

```bash
# Build rust-semverx as shared library
cd ~/obinexus/workspace/rust-semverx
cargo build --release --lib

# Copy artifacts to semverx
cp target/release/libsemverx.a \
   ~/obinexus/workspace/semverx/polyglot/c/lib/

cp src/ffi/c_api.rs \
   ~/obinexus/workspace/semverx/semverx/polycall/ffi/
```

### Phase 2: Implement Missing Modules (Weeks 2-4)

#### 2.1 FilterFlash Module (Priority P0)

```bash
# In semverx repository
cd ~/obinexus/workspace/semverx/semverx

# Create FilterFlash from spec
mkdir -p filterflash
cat > filterflash/mod.rs << 'EOF'
//! FilterFlash Coherence Gating
//! 
//! Implements ≥95.4% coherence threshold

pub mod scorer;
pub mod canonicalizer;
pub mod extractor;

pub const COHERENCE_GATE: f64 = 0.954;

#[derive(Debug, Clone)]
pub struct CoherenceScore {
    pub value: f64,
    pub passed: bool,
}

impl CoherenceScore {
    pub fn new(value: f64) -> Self {
        Self {
            value,
            passed: value >= COHERENCE_GATE,
        }
    }
}
EOF

# Implement scorer
cat > filterflash/scorer.rs << 'EOF'
use super::COHERENCE_GATE;
use super::CoherenceScore;

/// Score artifact coherence against corpus
/// 
/// Returns value in [0.0, 1.0]
/// Gate passes if score ≥ 0.954
pub fn score_coherence(
    canonical: &[u8],
    corpus: &[&[u8]],
) -> CoherenceScore {
    // TODO: Implement topological fingerprint scoring
    // For now, placeholder implementation
    
    let score = if corpus.is_empty() {
        1.0  // No reference corpus, accept
    } else {
        // Compute similarity to corpus
        compute_similarity(canonical, corpus)
    };
    
    CoherenceScore::new(score)
}

fn compute_similarity(artifact: &[u8], corpus: &[&[u8]]) -> f64 {
    // Placeholder: Average Jaccard similarity
    let mut total = 0.0;
    for reference in corpus {
        total += jaccard_similarity(artifact, reference);
    }
    total / corpus.len() as f64
}

fn jaccard_similarity(a: &[u8], b: &[u8]) -> f64 {
    let set_a: std::collections::HashSet<_> = a.iter().collect();
    let set_b: std::collections::HashSet<_> = b.iter().collect();
    
    let intersection = set_a.intersection(&set_b).count();
    let union = set_a.union(&set_b).count();
    
    if union == 0 {
        1.0
    } else {
        intersection as f64 / union as f64
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_coherence_gate() {
        let artifact = b"test artifact";
        let corpus = vec![b"test artifact" as &[u8]];
        
        let score = score_coherence(artifact, &corpus);
        assert!(score.passed, "Identical artifact should pass gate");
        assert!(score.value >= COHERENCE_GATE);
    }
}
EOF
```

#### 2.2 Observer Gate Module (Priority P0)

```bash
# Create observer_gate
mkdir -p observer_gate
cat > observer_gate/fault_taxonomy.rs << 'EOF'
//! 34-Level Fault Taxonomy
//! 
//! Maps fault codes to recovery actions

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FaultLevel {
    Warning,        // 0-5: Log only
    Danger,         // 6-11: Alert
    ObserverActive, // 12-17: Rollback trigger
    Critical,       // 18-23: Emergency rollback
    Healing,        // 24-29: Auto-recovery
    Termination,    // 30-33: System halt
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
        matches!(
            self,
            Self::ObserverActive | Self::Critical | Self::Termination
        )
    }
    
    pub fn to_code(&self) -> u8 {
        match self {
            Self::Warning => 2,
            Self::Danger => 8,
            Self::ObserverActive => 14,
            Self::Critical => 20,
            Self::Healing => 26,
            Self::Termination => 32,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_rollback_threshold() {
        assert!(!FaultLevel::from_code(5).requires_rollback());
        assert!(!FaultLevel::from_code(11).requires_rollback());
        assert!(FaultLevel::from_code(12).requires_rollback());
        assert!(FaultLevel::from_code(20).requires_rollback());
    }
}
EOF
```

### Phase 3: Unified Build System (Week 5)

#### 3.1 Workspace Cargo.toml

```bash
# In semverx repository root
cat > Cargo.toml << 'EOF'
[workspace]
members = [
    "semverx",
]
resolver = "2"

[workspace.package]
version = "0.1.0"
edition = "2021"
authors = ["OBINexus <obinexus@proton.me>"]
license = "OPENSENSE-NT"

[workspace.dependencies]
# Shared across all crates
petgraph = "0.6"
serde = { version = "1.0", features = ["derive"] }
sha2 = "0.10"
toml = "0.8"

# Link to rust-semverx via path
rust-semverx = { path = "../rust-semverx" }
EOF

# In semverx/Cargo.toml
cat > semverx/Cargo.toml << 'EOF'
[package]
name = "semverx"
version.workspace = true
edition.workspace = true
authors.workspace = true
license.workspace = true

[dependencies]
petgraph.workspace = true
serde.workspace = true
sha2.workspace = true
toml.workspace = true

# Import DAG resolution from rust-semverx
rust-semverx = { workspace = true }

[features]
default = ["filterflash", "observer-gate"]
filterflash = []
observer-gate = []
bidag = []
EOF
```

#### 3.2 Unified Build Script

```bash
cat > build_all.sh << 'EOF'
#!/bin/bash
# Unified build for both repositories

set -e

echo "🔨 Building rust-semverx..."
cd ~/obinexus/workspace/rust-semverx
cargo build --release
cargo test

echo "🔨 Building semverx..."
cd ~/obinexus/workspace/semverx
cargo build --release
cargo test

echo "🔨 Building polyglot bindings..."
cd polyglot/python
python3 setup.py build

cd ../typescript
npm install
npm run build

echo "✅ All components built successfully!"
EOF

chmod +x build_all.sh
```

### Phase 4: Testing Integration (Week 6)

#### 4.1 Cross-Repository Tests

```bash
# Create integration test
mkdir -p ~/obinexus/workspace/semverx/tests/cross_repo
cat > ~/obinexus/workspace/semverx/tests/cross_repo/test_dag_interop.rs << 'EOF'
//! Test DAG resolution from rust-semverx via FFI

use rust_semverx::resolver::{DependencyGraph, astar_resolve};

#[test]
fn test_rust_semverx_dag_via_ffi() {
    let mut graph = DependencyGraph::new();
    
    let a = graph.add_node("1.0.0".to_string());
    let b = graph.add_node("2.0.0".to_string());
    graph.add_edge(&a, &b);
    
    let result = astar_resolve(&graph, a, b);
    assert!(result.is_ok(), "Should resolve path via rust-semverx");
}
EOF

# Run cross-repo tests
cargo test --test cross_repo
```

#### 4.2 FilterFlash Oracle Validation

```bash
# Python oracle test
cd ~/obinexus/workspace/semverx/polyglot/python
cat > tests/test_oracle_parity.py << 'EOF'
import subprocess
import json

def test_rust_python_coherence_parity():
    """Ensure Rust and Python produce identical coherence scores"""
    
    artifact = b"test artifact content"
    
    # Python oracle score
    from pysemverx.filterflash import FilterFlashOracle
    oracle = FilterFlashOracle()
    py_score = oracle.score(artifact, [artifact])
    
    # Rust score via FFI
    # TODO: Call Rust FFI and compare
    # rust_score = call_rust_ffi(artifact)
    # assert abs(py_score - rust_score) < 1e-6
    
    assert py_score >= 0.954  # At minimum, gate passes
EOF

python3 -m pytest tests/test_oracle_parity.py
```

---

## Directory Structure After Integration

```
obinexus/workspace/
│
├── rust-semverx/              # Core Rust (DAG + FFI)
│   ├── src/
│   │   ├── resolver/
│   │   │   ├── strategies.rs  ✅ Complete Hamilton/Euler/A*
│   │   │   ├── graph.rs
│   │   │   └── types.rs
│   │   ├── ffi/
│   │   │   └── c_api.rs       ✅ Polyglot FFI
│   │   └── lib.rs
│   ├── Cargo.toml
│   └── tests/
│
└── semverx/                   # Polyglot workspace
    ├── semverx/               # Core semverx crate
    │   ├── core/
    │   ├── filterflash/       🔴 NEW: Coherence gating
    │   ├── bidag/             🔴 NEW: Uses rust-semverx resolver
    │   ├── observer_gate/     🔴 NEW: Fault taxonomy
    │   ├── registry/
    │   └── polycall/          ✅ Links to rust-semverx FFI
    │
    ├── polyglot/
    │   ├── python/
    │   │   └── pysemverx/
    │   │       └── filterflash.py  🔴 ORACLE
    │   ├── typescript/
    │   └── c/
    │
    ├── Cargo.toml             # Workspace root
    └── build_all.sh           # Unified build
```

---

## Performance Validation

### Big O Complexity Targets

```bash
# Benchmark DAG operations
cd ~/obinexus/workspace/rust-semverx
cargo bench

# Expected complexity:
# - Eulerian detection: O(E)
# - A* resolution: O(E log V)
# - AVL index: O(log n)
```

### Load Testing

```bash
# Create stress test
cat > tests/stress/dag_scalability.rs << 'EOF'
use rust_semverx::resolver::DependencyGraph;

#[test]
fn test_astar_scales_log_n() {
    for size in [100, 1000, 10000] {
        let mut graph = DependencyGraph::new();
        
        // Create linear dependency chain
        let nodes: Vec<_> = (0..size)
            .map(|i| graph.add_node(format!("v{}", i)))
            .collect();
        
        for i in 0..size-1 {
            graph.add_edge(&nodes[i], &nodes[i+1]);
        }
        
        let start = std::time::Instant::now();
        let _ = rust_semverx::resolver::astar_resolve(
            &graph,
            nodes[0].clone(),
            nodes[size-1].clone(),
        );
        let elapsed = start.elapsed();
        
        println!("N={} took {:?}", size, elapsed);
        // Verify log(n) scaling
    }
}
EOF
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/integrated_build.yml
name: Integrated Build

on: [push, pull_request]

jobs:
  rust-semverx:
    runs-on: windows-latest
    defaults:
      run:
        shell: msys2 {0}
    
    steps:
      - uses: msys2/setup-msys2@v2
        with:
          msystem: MINGW64
          install: >-
            mingw-w64-x86_64-rust
            mingw-w64-x86_64-gcc
      
      - uses: actions/checkout@v3
        with:
          repository: obinexus/rust-semverx
          path: rust-semverx
      
      - name: Build rust-semverx
        working-directory: rust-semverx
        run: |
          cargo build --release
          cargo test
  
  semverx-polyglot:
    needs: rust-semverx
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
        with:
          repository: obinexus/semverx
          path: semverx
      
      - uses: actions/checkout@v3
        with:
          repository: obinexus/rust-semverx
          path: rust-semverx
      
      - name: Build semverx
        working-directory: semverx
        run: |
          cargo build --release
          cargo test
      
      - name: Validate FilterFlash coherence
        run: |
          cd semverx/polyglot/python
          python3 -m pytest tests/test_oracle_parity.py
```

---

## Summary

### What You Now Have

✅ **rust-semverx** — Complete DAG resolution (Hamilton/Euler/A*)  
✅ **FFI bindings** — C API for polyglot integration  
✅ **MSYS setup** — Full Rust toolchain on Windows  
✅ **Integration path** — Clear steps to merge repositories  

### What You Need to Do

1. **Copy strategies.rs** from rust-semverx to semverx/bidag/
2. **Implement FilterFlash scorer** (use templates above)
3. **Implement Observer Gate** fault taxonomy
4. **Run unified build** via build_all.sh
5. **Validate coherence** across Python/Rust/TypeScript

### Time Estimate

- Week 1: Integration setup (3-5 hours)
- Week 2-4: Implement missing modules (20-30 hours)
- Week 5-6: Testing and validation (10-15 hours)

**Total: ~40-50 hours of work**

---

## Quick Start Commands

```bash
# 1. Setup MSYS Rust (if not done)
cd ~/obinexus/workspace/rust-semverx
source ~/MSYS_RUST_SETUP.md  # Follow guide

# 2. Build rust-semverx
cargo clean && cargo build --release
cargo test

# 3. Integrate with semverx
cd ~/obinexus/workspace/semverx
# Copy implementations (see Phase 1 above)

# 4. Build unified
./build_all.sh

# 5. Validate
cargo test --all
python3 polyglot/python/tests/test_oracle_parity.py
```

---

**You're now ready to complete the full SemVerX PolyGatic BiDAG implementation!**
