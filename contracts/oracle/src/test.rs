#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

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
