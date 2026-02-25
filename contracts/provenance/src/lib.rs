#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String};

#[contract]
pub struct ProvenanceContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Certificate {
    pub content_hash: String,
    pub owner: Address,
    pub timestamp: u64,
    pub certificate_id: u64,
}

#[contractimpl]
impl ProvenanceContract {
    /// Mint a new provenance certificate for verified content
    /// 
    /// # Arguments
    /// * `content_hash` - Hash of the verified content
    /// * `owner` - Address of the content owner
    /// 
    /// # Returns
    /// Certificate ID on success
    pub fn mint(env: Env, content_hash: String, owner: Address) -> u64 {
        // Require authorization from the owner
        owner.require_auth();
        
        // Get and increment certificate counter
        let mut counter: u64 = env.storage().instance().get(&symbol_short!("CERT_CNT")).unwrap_or(0);
        counter += 1;
        
        // Create certificate
        let certificate = Certificate {
            content_hash: content_hash.clone(),
            owner: owner.clone(),
            timestamp: env.ledger().timestamp(),
            certificate_id: counter,
        };
        
        // Store certificate
        let cert_key = (symbol_short!("CERT"), counter);
        env.storage().instance().set(&cert_key, &certificate);
        
        // Update counter
        env.storage().instance().set(&symbol_short!("CERT_CNT"), &counter);
        
        // Emit event
        env.events().publish(
            (symbol_short!("mint"), owner.clone()),
            (content_hash, counter),
        );
        
        counter
    }
    
    /// Get certificate by ID
    pub fn get_certificate(env: Env, certificate_id: u64) -> Option<Certificate> {
        let cert_key = (symbol_short!("CERT"), certificate_id);
        env.storage().instance().get(&cert_key)
    }
}

mod test;
