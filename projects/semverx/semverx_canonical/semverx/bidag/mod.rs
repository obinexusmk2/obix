//! Tri-Node Bidirectional DAG Resolution
//! 
//! Nodes: X(upload) ↔ Y(runtime) ↔ Z(backup)
//! Strategies: Eulerian | Hamiltonian | A* | Hybrid

pub mod topology;
pub mod resolver;
pub mod sync;

#[derive(Debug, Clone, Copy)]
pub enum Node {
    Upload,   // X
    Runtime,  // Y
    Backup,   // Z
}

#[derive(Debug, Clone, Copy)]
pub enum Strategy {
    Eulerian,
    Hamiltonian,
    AStar,
    Hybrid,
}
