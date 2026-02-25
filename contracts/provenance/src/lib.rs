#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String};

#[contract]
pub struct ProvenanceContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CertificateDetails {
    pub content_hash: String,
    pub metadata: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Certificate {
    pub content_hash: String,
    pub metadata: String,
    pub owner: Address,
    pub timestamp: u64,
    pub certificate_id: u64,
}

#[contractimpl]
impl ProvenanceContract {
    /// Initialize the contract with the Oracle address
    /// 
    /// # Arguments
    /// * `oracle` - Address of the Oracle contract authorized to mint certificates
    pub fn initialize(env: Env, oracle: Address) {
        // Ensure not already initialized
        if env.storage().persistent().has(&symbol_short!("ORACLE")) {
            panic!("Contract already initialized");
        }
        
        // Store oracle address
        env.storage().persistent().set(&symbol_short!("ORACLE"), &oracle);
    }
    
    /// Mint a new provenance certificate for verified content
    /// Only callable by the Oracle contract
    /// 
    /// # Arguments
    /// * `to` - Address of the certificate recipient/owner
    /// * `details` - Certificate details including content hash and metadata
    /// 
    /// # Returns
    /// Certificate ID on success
    pub fn mint(env: Env, to: Address, details: CertificateDetails) -> u64 {
        // Get oracle address from storage
        let oracle: Address = env.storage().persistent()
            .get(&symbol_short!("ORACLE"))
            .expect("Contract not initialized");
        
        // Require authorization from the oracle contract only
        oracle.require_auth();
        
        // Get and increment certificate counter
        let mut counter: u64 = env.storage().persistent().get(&symbol_short!("CERT_CNT")).unwrap_or(0);
        counter += 1;
        
        // Create certificate
        let certificate = Certificate {
            content_hash: details.content_hash.clone(),
            metadata: details.metadata.clone(),
            owner: to.clone(),
            timestamp: env.ledger().timestamp(),
            certificate_id: counter,
        };
        
        // Store certificate in persistent storage
        let cert_key = (symbol_short!("CERT"), counter);
        env.storage().persistent().set(&cert_key, &certificate);
        
        // Update counter in persistent storage
        env.storage().persistent().set(&symbol_short!("CERT_CNT"), &counter);
        
        // Emit event
        env.events().publish(
            (symbol_short!("mint"), to.clone()),
            (details.content_hash, counter),
        );
        
        counter
    }
    
    /// Get certificate by ID
    pub fn get_certificate(env: Env, certificate_id: u64) -> Option<Certificate> {
        let cert_key = (symbol_short!("CERT"), certificate_id);
        env.storage().persistent().get(&cert_key)
    }
}

mod test;
