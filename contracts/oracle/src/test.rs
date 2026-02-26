#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::storage::Temporary as _, testutils::Address as _, Address, BytesN, Env};

#[test]
fn test_init() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let registry = Address::generate(&env);
    let provenance = Address::generate(&env);

    client.init(&registry, &provenance);
}

#[test]
fn test_submit_request_stores_pending_in_temporary_storage() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    // Initialization not strictly required for submit_request, but keep setup consistent.
    let registry = Address::generate(&env);
    let provenance = Address::generate(&env);
    client.init(&registry, &provenance);

    let content_hash = BytesN::from_array(&env, &[5; 32]);

    let request_id = client.submit_request(&content_hash);
    assert_eq!(request_id, 1);

    // Verify the request is stored in temporary storage with Pending state.
    let key = DataKey::Request(request_id);
    // Access storage from the contract's context.
    let (stored, ttl) = env.as_contract(&contract_id, || {
        let stored: VerificationRequest = env
            .storage()
            .temporary()
            .get(&key)
            .expect("request must be stored");
        let ttl = env.storage().temporary().get_ttl(&key);
        (stored, ttl)
    });

    assert_eq!(stored.id, request_id);
    assert_eq!(stored.content_hash, content_hash);
    assert!(matches!(stored.state, RequestState::Pending));

    // TTL should be positive, indicating the entry is tracked in temporary storage.
    assert!(ttl > 0);
}

#[test]
fn test_submit_request_generates_unique_ids() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let registry = Address::generate(&env);
    let provenance = Address::generate(&env);
    client.init(&registry, &provenance);

    let hash1 = BytesN::from_array(&env, &[1; 32]);
    let hash2 = BytesN::from_array(&env, &[2; 32]);

    let id1 = client.submit_request(&hash1);
    let id2 = client.submit_request(&hash2);

    assert_eq!(id1, 1);
    assert_eq!(id2, 2);

    let key1 = DataKey::Request(id1);
    let key2 = DataKey::Request(id2);

    // Access storage from the contract's context.
    let (req1, req2) = env.as_contract(&contract_id, || {
        let req1: VerificationRequest = env.storage().temporary().get(&key1).unwrap();
        let req2: VerificationRequest = env.storage().temporary().get(&key2).unwrap();
        (req1, req2)
    });

    assert_eq!(req1.id, id1);
    assert_eq!(req2.id, id2);
    assert_eq!(req1.content_hash, hash1);
    assert_eq!(req2.content_hash, hash2);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_init_already_initialized() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let registry = Address::generate(&env);
    let provenance = Address::generate(&env);

    client.init(&registry, &provenance);
    client.init(&registry, &provenance);
}

#[test]
fn test_verify_tee_hash_success() {
    use registry::{Registry, RegistryClient};

    let env = Env::default();
    env.mock_all_auths();

    // Set up registry contract and add a trusted TEE hash.
    let registry_id = env.register(Registry, ());
    let registry_client = RegistryClient::new(&env, &registry_id);
    let admin = Address::generate(&env);
    registry_client.initialize(&admin);

    let tee_hash = BytesN::from_array(&env, &[1; 32]);
    registry_client.add_tee_hash(&tee_hash);

    // Set up oracle contract and initialize it with the registry address.
    let oracle_id = env.register(Contract, ());
    let oracle_client = ContractClient::new(&env, &oracle_id);

    let registry_address = registry_id.clone();
    let provenance = Address::generate(&env);
    oracle_client.init(&registry_address, &provenance);

    let result = oracle_client.try_verify_tee_hash(&tee_hash);
    // Outer Ok: contract call succeeded; inner Ok(()) means verification passed.
    assert_eq!(result, Ok(Ok(())));
}

#[test]
fn test_verify_tee_hash_invalid_hash() {
    use registry::{Registry, RegistryClient};

    let env = Env::default();
    env.mock_all_auths();

    // Registry is set up but the specific hash is NOT registered.
    let registry_id = env.register(Registry, ());
    let registry_client = RegistryClient::new(&env, &registry_id);
    let admin = Address::generate(&env);
    registry_client.initialize(&admin);

    let unregistered_hash = BytesN::from_array(&env, &[9; 32]);

    // Set up oracle and point it at the registry.
    let oracle_id = env.register(Contract, ());
    let oracle_client = ContractClient::new(&env, &oracle_id);
    let registry_address = registry_id.clone();
    let provenance = Address::generate(&env);
    oracle_client.init(&registry_address, &provenance);

    let result = oracle_client.try_verify_tee_hash(&unregistered_hash);

    // The contract returns Err(OracleError::TeeNotVerified), which surfaces as:
    // Err(Ok(OracleError::TeeNotVerified)) from the try_ client.
    assert_eq!(result, Err(Ok(OracleError::TeeNotVerified)));
}

#[test]
fn test_verify_tee_hash_registry_call_failure() {
    let env = Env::default();
    env.mock_all_auths();

    // Set up oracle with a bogus "registry" address (not a contract),
    // so the cross-contract call will fail at the host level.
    let oracle_id = env.register(Contract, ());
    let oracle_client = ContractClient::new(&env, &oracle_id);

    let bogus_registry = Address::generate(&env);
    let provenance = Address::generate(&env);
    oracle_client.init(&bogus_registry, &provenance);

    let tee_hash = BytesN::from_array(&env, &[3; 32]);

    let result = oracle_client.try_verify_tee_hash(&tee_hash);

    // Any host-level failure of the cross-contract call is mapped to
    // OracleError::RegistryCallFailed.
    assert_eq!(result, Err(Ok(OracleError::RegistryCallFailed)));
}
