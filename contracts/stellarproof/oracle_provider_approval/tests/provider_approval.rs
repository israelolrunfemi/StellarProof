use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::OracleProviderApprovalClient; 
use crate::OracleProviderApproval;

#[test]
fn admin_can_add_and_remove_provider() {
    let env = Env::default();
    let contract_id = env.register_contract(None, OracleProviderApproval);
    let client = OracleProviderApprovalClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let provider = Address::generate(&env);

    client.initialize(&admin);

    // Mock all auths so admin.require_auth() passes
    env.mock_all_auths();

    client.add_provider(&provider);
    assert!(client.is_provider(&provider));

    client.remove_provider(&provider);
    assert!(!client.is_provider(&provider));
}

#[test]
#[should_panic] // Expect unauthorized call to panic/fail
fn non_admin_cannot_add_provider() {
    let env = Env::default();
    let contract_id = env.register_contract(None, OracleProviderApproval);
    let client = OracleProviderApprovalClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let attacker = Address::generate(&env);
    let provider = Address::generate(&env);

    client.initialize(&admin);


    client.add_provider(&provider); // should panic because admin auth is not present
}