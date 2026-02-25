#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_mint_certificate() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ProvenanceContract, ());
    let client = ProvenanceContractClient::new(&env, &contract_id);
    
    let oracle = Address::generate(&env);
    let owner = Address::generate(&env);
    
    // Initialize contract with oracle address
    client.initialize(&oracle);
    
    let details = CertificateDetails {
        content_hash: String::from_str(&env, "abc123hash"),
        metadata: String::from_str(&env, "test metadata"),
    };
    
    // Mint first certificate
    let cert_id = client.mint(&owner, &details);
    assert_eq!(cert_id, 1);
    
    // Verify certificate was stored
    let certificate = client.get_certificate(&cert_id);
    assert!(certificate.is_some());
    
    let cert = certificate.unwrap();
    assert_eq!(cert.content_hash, details.content_hash);
    assert_eq!(cert.metadata, details.metadata);
    assert_eq!(cert.owner, owner);
    assert_eq!(cert.certificate_id, 1);
}

#[test]
fn test_mint_multiple_certificates() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ProvenanceContract, ());
    let client = ProvenanceContractClient::new(&env, &contract_id);
    
    let oracle = Address::generate(&env);
    let owner1 = Address::generate(&env);
    let owner2 = Address::generate(&env);
    
    // Initialize contract
    client.initialize(&oracle);
    
    let details1 = CertificateDetails {
        content_hash: String::from_str(&env, "hash1"),
        metadata: String::from_str(&env, "metadata1"),
    };
    
    let details2 = CertificateDetails {
        content_hash: String::from_str(&env, "hash2"),
        metadata: String::from_str(&env, "metadata2"),
    };
    
    let details3 = CertificateDetails {
        content_hash: String::from_str(&env, "hash3"),
        metadata: String::from_str(&env, "metadata3"),
    };
    
    // Mint multiple certificates
    let cert_id1 = client.mint(&owner1, &details1);
    let cert_id2 = client.mint(&owner2, &details2);
    let cert_id3 = client.mint(&owner1, &details3);
    
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

#[test]
#[should_panic(expected = "Contract not initialized")]
fn test_mint_without_initialization() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ProvenanceContract, ());
    let client = ProvenanceContractClient::new(&env, &contract_id);
    
    let owner = Address::generate(&env);
    let details = CertificateDetails {
        content_hash: String::from_str(&env, "hash"),
        metadata: String::from_str(&env, "metadata"),
    };
    
    // Should panic because contract is not initialized
    client.mint(&owner, &details);
}

#[test]
#[should_panic(expected = "Contract already initialized")]
fn test_double_initialization() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ProvenanceContract, ());
    let client = ProvenanceContractClient::new(&env, &contract_id);
    
    let oracle = Address::generate(&env);
    
    // Initialize once
    client.initialize(&oracle);
    
    // Should panic on second initialization
    client.initialize(&oracle);
}
