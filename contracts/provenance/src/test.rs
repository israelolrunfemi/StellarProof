#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_mint_certificate() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ProvenanceContract, ());
    let client = ProvenanceContractClient::new(&env, &contract_id);
    
    let owner = Address::generate(&env);
    let content_hash = String::from_str(&env, "abc123hash");
    
    // Mint first certificate
    let cert_id = client.mint(&content_hash, &owner);
    assert_eq!(cert_id, 1);
    
    // Verify certificate was stored
    let certificate = client.get_certificate(&cert_id);
    assert!(certificate.is_some());
    
    let cert = certificate.unwrap();
    assert_eq!(cert.content_hash, content_hash);
    assert_eq!(cert.owner, owner);
    assert_eq!(cert.certificate_id, 1);
}

#[test]
fn test_mint_multiple_certificates() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ProvenanceContract, ());
    let client = ProvenanceContractClient::new(&env, &contract_id);
    
    let owner1 = Address::generate(&env);
    let owner2 = Address::generate(&env);
    
    // Mint multiple certificates
    let cert_id1 = client.mint(&String::from_str(&env, "hash1"), &owner1);
    let cert_id2 = client.mint(&String::from_str(&env, "hash2"), &owner2);
    let cert_id3 = client.mint(&String::from_str(&env, "hash3"), &owner1);
    
    assert_eq!(cert_id1, 1);
    assert_eq!(cert_id2, 2);
    assert_eq!(cert_id3, 3);
    
    // Verify all certificates exist
    assert!(client.get_certificate(&cert_id1).is_some());
    assert!(client.get_certificate(&cert_id2).is_some());
    assert!(client.get_certificate(&cert_id3).is_some());
}

#[test]
fn test_get_nonexistent_certificate() {
    let env = Env::default();
    let contract_id = env.register(ProvenanceContract, ());
    let client = ProvenanceContractClient::new(&env, &contract_id);
    
    let certificate = client.get_certificate(&999);
    assert!(certificate.is_none());
}
