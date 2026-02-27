#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_init() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let registry = Address::generate(&env);
    let provenance = Address::generate(&env);
    let admin = Address::generate(&env);

    client.init(&registry, &provenance, &admin);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_init_already_initialized() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let registry = Address::generate(&env);
    let provenance = Address::generate(&env);
    let admin = Address::generate(&env);

    client.init(&registry, &provenance, &admin);
    client.init(&registry, &provenance, &admin);
}

#[test]
fn test_provider_management() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let registry = Address::generate(&env);
    let provenance = Address::generate(&env);
    let admin = Address::generate(&env);
    let provider = Address::generate(&env);

    client.init(&registry, &provenance, &admin);

    // Initially not a provider
    assert!(!client.is_provider(&provider));

    // Add provider
    client.add_provider(&provider);
    assert!(client.is_provider(&provider));

    // Remove provider
    client.remove_provider(&provider);
    assert!(!client.is_provider(&provider));
}

use ed25519_dalek::{Signer, SigningKey};
use soroban_sdk::{Bytes, BytesN};

fn create_keypair(env: &Env, seed: u8) -> (SigningKey, BytesN<32>) {
    let secret = [seed; 32];
    let signing_key = SigningKey::from_bytes(&secret);
    let public_key = signing_key.verifying_key();
    let pk_bytes: [u8; 32] = public_key.to_bytes();
    (signing_key, BytesN::from_array(env, &pk_bytes))
}

fn sign_payload(env: &Env, signing_key: &SigningKey, payload: &[u8]) -> BytesN<64> {
    let signature = signing_key.sign(payload);
    let sig_bytes: [u8; 64] = signature.to_bytes();
    BytesN::from_array(env, &sig_bytes)
}

// Registry Mock for testing
#[soroban_sdk::contract]
pub struct RegistryMock;

#[soroban_sdk::contractimpl]
impl RegistryMock {
    pub fn is_verified(_env: Env, hash: BytesN<32>, _provider: BytesN<32>) -> bool {
        // Just return true if the first byte of provider is 1 (for authorized testing)
        // and true if the first byte of hash is 88 (for valid hash testing)
        let hash_bytes = hash.to_array();

        // Simulate an authorized condition: Authorized provider (first byte = 1, since seed=1 creates a specific key, we just hardcode the expected mock outcome based on the seed we know we'll use, wait actually we can just use the exact byte value of the public key or just mock it cleanly)

        // Actually, let's just use the first byte of the array to control it:
        // Or simpler: We know we pass `[1; 32]` or `[2; 32]` for seed in `create_keypair`, but `create_keypair` creates real ed25519 keys so the first byte isn't 1.

        // Let's use a simpler mock: return true if the hash matches a specific known good value,
        // and provider matches a specific known good value. But we create keys dynamically.
        // Let's just say if hash == [88; 32], we only approve if provider isn't all zeros.

        // Let's use `hash` first byte to determine behavior:
        // if hash[0] == 88 -> return true (authorized)
        // if hash[0] == 99 -> return false (unauthorized)
        hash_bytes[0] == 88
    }
}

#[test]
fn test_verify_attestation_success() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    // Register Registry Mock
    let registry_id = env.register(RegistryMock, ());

    let provenance = Address::generate(&env);
    client.init(&registry_id, &provenance);

    let (signing_key, provider_pk) = create_keypair(&env, 1);
    let tee_hash = BytesN::from_array(&env, &[88; 32]); // 88 triggers true in mock

    let raw_payload = b"hello world";
    let payload = Bytes::from_slice(&env, raw_payload);
    let signature = sign_payload(&env, &signing_key, raw_payload);

    // Should succeed
    client.verify_attestation(&provider_pk, &tee_hash, &payload, &signature);
}

#[test]
fn test_verify_attestation_unauthorized_signer() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let registry_id = env.register(RegistryMock, ());
    let provenance = Address::generate(&env);
    client.init(&registry_id, &provenance);

    let (signing_key, provider_pk) = create_keypair(&env, 1);
    let tee_hash = BytesN::from_array(&env, &[99; 32]); // 99 triggers false in mock

    let raw_payload = b"hello world";
    let payload = Bytes::from_slice(&env, raw_payload);
    let signature = sign_payload(&env, &signing_key, raw_payload);

    let result = client.try_verify_attestation(&provider_pk, &tee_hash, &payload, &signature);
    assert_eq!(result, Err(Ok(Error::UnauthorizedSigner)));
}

#[test]
#[should_panic]
fn test_verify_attestation_invalid_signature() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let registry_id = env.register(RegistryMock, ());
    let provenance = Address::generate(&env);
    client.init(&registry_id, &provenance);

    let (_, provider_pk) = create_keypair(&env, 1);
    let (other_signing_key, _) = create_keypair(&env, 2);
    let tee_hash = BytesN::from_array(&env, &[88; 32]); // 88 triggers true in mock

    let raw_payload = b"hello world";
    let payload = Bytes::from_slice(&env, raw_payload);

    // Sign with the WRONG key
    let signature = sign_payload(&env, &other_signing_key, raw_payload);

    // ed25519_verify aborts the host logic, so this panics
    client.verify_attestation(&provider_pk, &tee_hash, &payload, &signature);
}

#[test]
fn test_verify_attestation_not_initialized() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let (_, provider_pk) = create_keypair(&env, 1);
    let tee_hash = BytesN::from_array(&env, &[88; 32]);
    let payload = Bytes::from_slice(&env, b"");
    let signature = BytesN::from_array(&env, &[0; 64]);

    let result = client.try_verify_attestation(&provider_pk, &tee_hash, &payload, &signature);
    assert_eq!(result, Err(Ok(Error::NotInitialized)));
}
