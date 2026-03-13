# SemVerX Architecture Comparison: Current vs Canonical

## Executive Summary

Your proposed structure has **excellent foundations** for polyglot FFI and platform abstraction, but is missing **critical specification-mandated components** for SemVerX PolyGatic BiDAG compliance.

---

## Side-by-Side Comparison

### Current Structure (Your Proposal)
```
semverx/
└── semverx/                    # Core codebase
    ├── Cargo.toml
    ├── audit/
    │   ├── plpinterpreter/     ✅ Good: Intent-based profiling
    │   ├── plpprofiler/        ✅ Good: HINTL/HOUTOL telemetry
    │   ├── plprecovery/        ⚠️  Needs: Observer gate integration
    │   └── plptelemetry/       ✅ Good: Audit trail support
    ├── cli/
    │   ├── plpadapter/         ✅ Good: PLP adapter layer
    │   ├── plpbind/            ✅ Good: FFI bindings
    │   ├── plpplugin/          ✅ Good: Plugin architecture
    │   └── plpsdk/             ✅ Good: SDK tooling
    ├── core/
    │   ├── nnffi/              ⚠️  Rename: Should be polycall/
    │   │   ├── stable/         ✅ Good: Channel separation
    │   │   ├── experimental/   ✅ Good: Experimental channel
    │   │   └── legacy/         ✅ Good: Legacy support
    │   ├── plplinux/           ✅ Good: Platform abstraction
    │   ├── plpmacos/           ✅ Good: Platform abstraction
    │   └── plpwindows/         ✅ Good: Platform abstraction
    └── src/
        ├── major/              ✅ Good: Version component modules
        ├── minor/              ✅ Good: Version component modules
        └── patch/              ✅ Good: Version component modules
```

**Strengths:**
- ✅ Platform abstraction (Linux/macOS/Windows)
- ✅ Channel-based FFI (stable/experimental/legacy)
- ✅ Audit/telemetry infrastructure
- ✅ CLI tooling layer

**Critical Gaps:**
- ❌ **FilterFlash functor** (coherence gating)
- ❌ **BiDAG resolver** (Eulerian/Hamiltonian/A*)
- ❌ **Observer gate** (ambiguity adjudication)
- ❌ **NLM layer** (lexer/parser/AST)
- ❌ **Registry** (AVL index + AuraSeal)
- ❌ **Polyglot workspace** (TypeScript/Python clients)

---

### Canonical Structure (Specification-Compliant)
```
semverx/                        # Root (IaaS polyglot workspace)
├── Cargo.toml                  # Workspace root
│
├── semverx/                    # Core Rust implementation
│   ├── core/                   ✅ Version primitives
│   │   ├── semverx.rs         # major.minor.patch(channel)
│   │   ├── channels.rs        # stable|lts|experimental|legacy
│   │   └── platform/          # Your existing platform modules
│   │
│   ├── filterflash/           🔴 CRITICAL: Coherence gating
│   │   ├── extractor.rs       # Feature extraction
│   │   ├── canonicalizer.rs   # AST canonicalization
│   │   ├── scorer.rs          # ≥0.954 gate
│   │   └── oracle.py          # Python reference (ORACLE)
│   │
│   ├── bidag/                 🔴 CRITICAL: DAG resolution
│   │   ├── topology.rs        # Star/Bus/Ring/Hybrid
│   │   ├── resolver/
│   │   │   ├── eulerian.rs    # Eulerian cycle detection
│   │   │   ├── hamiltonian.rs # Hamiltonian path search
│   │   │   └── astar.rs       # A* optimal path
│   │   └── sync.rs            # Tri-node sync
│   │
│   ├── observer_gate/         🔴 CRITICAL: Recovery architecture
│   │   ├── adjudicator.rs     # Ambiguity resolution
│   │   ├── fault_taxonomy.rs  # 34-level fault model
│   │   └── recovery.rs        # Auto-rollback (≥12 triggers)
│   │
│   ├── registry/              🔴 CRITICAL: Package index
│   │   ├── avl_tree.rs        # O(log n) lookups
│   │   ├── aura_seal.rs       # Crypto signing
│   │   └── rate_limiter.rs    # 5-10 updates/sec
│   │
│   ├── nlm/                   🔴 CRITICAL: Linguistic layer
│   │   ├── lexer.rs           # LEX_GATED states
│   │   ├── parser.rs          # PARSE_RESOLVE states
│   │   ├── ast.rs             # ASTVersion/ASTExpr nodes
│   │   └── atlas/             # Cultural grounding
│   │
│   ├── polycall/              ⚠️  Renamed from nnffi/
│   │   ├── ffi/               # Your existing FFI
│   │   ├── adapter.rs         # Your existing adapter
│   │   └── protocol.rs        # PolyCall protocol
│   │
│   ├── audit/                 ✅ Your existing audit modules
│   │   ├── plpinterpreter/   
│   │   ├── plpprofiler/      
│   │   ├── plprecovery/       (+ observer gate hooks)
│   │   └── plptelemetry/     
│   │
│   ├── cli/                   ✅ Your existing CLI
│   │   ├── plpadapter/       
│   │   ├── plpbind/          
│   │   ├── plpplugin/        
│   │   └── plpsdk/           
│   │
│   └── src/                   ✅ Your existing version modules
│       ├── lib.rs             (main entry point)
│       ├── major/            
│       ├── minor/            
│       └── patch/            
│
├── polyglot/                  🔴 NEW: IaaS compliance layer
│   ├── typescript/            # @obinexus/semverx-registry
│   │   ├── src/semverx.ts    
│   │   ├── src/registry.ts   
│   │   └── src/filterflash.ts
│   │
│   ├── python/                # pysemverx (ORACLE)
│   │   ├── pysemverx/        
│   │   │   ├── semverx.py    
│   │   │   ├── registry.py   
│   │   │   └── filterflash.py  # **CANONICAL ORACLE**
│   │   └── tests/            
│   │
│   └── c/                     # LibPolyCall C bindings
│       └── bindings/         
│
├── schemas/                   ✅ Your existing schemas
│   ├── canonical.toml        
│   ├── semverx.schema.json   
│   └── bidag.schema.json     
│
├── ci/                        🔴 CRITICAL: CI/CD pipeline
│   ├── workflows/
│   │   ├── filterflash-oracle.yml  # Cross-lang coherence
│   │   ├── integration-hot-swap.yml
│   │   └── property-tests.yml
│   └── scripts/
│       └── validate-coherence.py
│
├── docs/                      📚 Documentation
│   ├── architecture/
│   │   ├── bidag.md          
│   │   ├── filterflash.md    
│   │   └── observer-gate.md  
│   └── rfcs/
│       └── semverx-spec-v3.md
│
└── tests/                     🧪 Test artifacts
    ├── artifacts/             # Test corpus
    │   ├── artifact-a/       
    │   ├── artifact-b/       
    │   └── artifact-c/       
    └── integration/
        └── hot-swap/         
```

---

## Component Priority Matrix

### 🔴 **P0 - Blocking (Must implement for spec compliance)**

| Component | Purpose | Specification Reference |
|-----------|---------|------------------------|
| `filterflash/` | Coherence gating (≥0.954) | §12 FilterFlash Functor |
| `bidag/resolver/` | Eulerian/Hamiltonian/A* | §6 DAG Resolution |
| `observer_gate/` | 34-level fault taxonomy | §7 Observer-Gate Architecture |
| `nlm/` | Lexer/Parser/AST states | §3-4 Lexical/Parser Layers |
| `registry/` | AVL index + AuraSeal | §18 Deployment Architecture |

### 🟡 **P1 - High (Needed for polyglot IaaS)**

| Component | Purpose | Notes |
|-----------|---------|-------|
| `polyglot/python/` | FilterFlash oracle | **Canonical reference implementation** |
| `polyglot/typescript/` | Client bindings | API parity with Python |
| `ci/filterflash-oracle.yml` | Cross-language validation | Bitwise-equal outputs |

### 🟢 **P2 - Medium (Enhance existing)**

| Component | Purpose | Migration |
|-----------|---------|-----------|
| `polycall/` | Rename from `nnffi/` | Align naming with LibPolyCall |
| `audit/plprecovery/` | Add observer gate hooks | Integrate with `observer_gate/` |
| `schemas/` | Add BiDAG schema | Define graph topology format |

---

## Migration Strategy

### Phase 1: Structural Reform (Week 1)
```bash
# Run migration script
chmod +x semverx_migrate.sh
./semverx_migrate.sh ./semverx

# This creates: semverx_canonical/
cd semverx_canonical
cargo build  # Should compile with stubs
```

### Phase 2: Implement P0 Components (Weeks 2-4)

**Week 2: FilterFlash + NLM**
```rust
// semverx/filterflash/scorer.rs
pub fn score(canonical: &[u8], corpus: &[&[u8]]) -> f64 {
    // TODO: Implement topological fingerprint scoring
    0.0
}

// semverx/nlm/lexer.rs
pub fn lex(input: &str) -> Result<Vec<Token>, LexError> {
    // TODO: Implement LEX_START → LEX_GATED state machine
    Ok(vec![])
}
```

**Week 3: BiDAG Resolver**
```rust
// semverx/bidag/resolver/eulerian.rs
pub fn is_eulerian(graph: &Graph) -> bool {
    // TODO: Check if all vertices have even degree
    false
}

// semverx/bidag/resolver/hamiltonian.rs
pub fn find_hamiltonian_path(graph: &Graph) -> Option<Vec<NodeId>> {
    // TODO: Attempt Hamiltonian path search (bounded timeout)
    None
}
```

**Week 4: Observer Gate + Registry**
```rust
// semverx/observer_gate/adjudicator.rs
pub fn adjudicate(coherence: f64) -> Decision {
    if coherence >= 0.954 {
        Decision::Accept
    } else if coherence <= 0.600 {
        Decision::Reject
    } else {
        Decision::Escalate  // Human-in-loop
    }
}

// semverx/registry/avl_tree.rs
pub fn insert(&mut self, key: String, entry: PackageEntry) {
    // TODO: Implement AVL insertion with rotation
}
```

### Phase 3: Polyglot Bindings (Week 5)

**Python Oracle (CRITICAL)**
```python
# polyglot/python/pysemverx/filterflash.py
class FilterFlashOracle:
    def extract_features(self, artifact: bytes) -> Dict[str, Any]:
        tree = ast.parse(artifact.decode('utf-8'))
        # Extract AST hash, control flow, literals
        return {
            'ast_hash': self._hash_ast(tree),
            'control_flow': self._extract_control_flow(tree),
            'literals': self._extract_literals(tree),
        }
```

**TypeScript Client**
```typescript
// polyglot/typescript/src/filterflash.ts
export class FilterFlash {
  async score(artifact: Uint8Array, corpus: Uint8Array[]): Promise<number> {
    // Must match Python oracle output
    const features = this.extractFeatures(artifact);
    return this.computeCoherence(features, corpus);
  }
}
```

### Phase 4: CI/CD Validation (Week 6)

```yaml
# ci/workflows/cross-language-coherence.yml
- name: Validate FilterFlash coherence
  run: |
    # Generate test artifacts
    python3 tests/generate_artifacts.py
    
    # Run Python oracle
    python3 -m pysemverx.filterflash --test
    
    # Verify Rust matches oracle
    cargo test --package semverx --lib filterflash::tests::oracle_parity
    
    # Verify TypeScript matches oracle
    npm test --workspace=@obinexus/semverx-registry
```

---

## Critical Success Criteria

✅ **Specification Compliance Checklist**

- [ ] FilterFlash produces bitwise-identical canonicalization across Rust/Python/TypeScript
- [ ] Coherence gate blocks swaps below 0.954 threshold
- [ ] BiDAG resolver supports all three strategies (Eulerian/Hamiltonian/A*)
- [ ] Observer gate triggers auto-rollback at fault level ≥12
- [ ] NLM lexer/parser implements LEX_GATED and PARSE_RESOLVE states
- [ ] Registry AVL operations maintain O(log n) complexity
- [ ] AuraSeal signatures validate before hot-swap
- [ ] CI pipeline runs cross-language property tests
- [ ] All test artifacts pass coherence validation

---

## Next Steps

1. **Run migration script:**
   ```bash
   chmod +x semverx_migrate.sh
   ./semverx_migrate.sh ./semverx
   cd semverx_canonical
   ```

2. **Verify structure:**
   ```bash
   tree -L 3 semverx/
   cargo check
   ```

3. **Implement P0 components** (start with FilterFlash oracle in Python)

4. **Set up CI pipeline:**
   ```bash
   mkdir -p .github/workflows
   cp ci/workflows/* .github/workflows/
   ```

5. **Run validation:**
   ```bash
   cargo test
   python3 ci/scripts/validate-coherence.py
   ```

---

## Questions to Clarify

1. **IaaS Platform**: Which cloud provider are you targeting? (AWS/Azure/GCP)
2. **Polyglot Priority**: Which language binding needs to ship first? (Python oracle is mandatory)
3. **Hot-Swap Context**: What runtime are you hot-swapping components in? (WASM/Native/Container)
4. **Observer Gate**: Do you need human-in-loop UI or CLI-only adjudication?
5. **Performance SLA**: What's your target for 95th percentile registry lookup? (Default: <20ms)

---

## Summary

Your current structure provides **solid foundations** for platform abstraction and PLP integration, but requires **5 critical components** to meet the SemVerX PolyGatic BiDAG specification:

1. **FilterFlash** - Coherence gating mechanism
2. **BiDAG** - Graph-based dependency resolution
3. **Observer Gate** - Fault-tolerant recovery
4. **NLM** - Linguistic parsing layer
5. **Registry** - AVL-backed package index

The migration script creates the canonical structure while preserving your existing audit/CLI modules. Implement P0 components first, then gradually migrate your existing code into the new architecture.

**Time estimate**: 6 weeks to full specification compliance with 1 engineer.
