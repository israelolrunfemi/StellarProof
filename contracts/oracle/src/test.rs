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
