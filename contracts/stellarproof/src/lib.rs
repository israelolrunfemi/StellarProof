#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
pub enum DataKey {
    Admin,
    Provider(Address), // key per provider address
}

#[contract]
pub struct OracleProviderApproval;

#[contractimpl]
impl OracleProviderApproval {
    // One-time initializer to set admin
    pub fn initialize(env: Env, admin: Address) {
        // Prevent re-initialization
        if env.storage().instance().has(&DataKey::Admin) {
            // In production, use custom errors, but a simple panic works for tests
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    // Add an approved provider (admin-only)
    pub fn add_provider(env: Env, provider: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set; initialize first");

        // Require admin signature
        admin.require_auth();

        let key = DataKey::Provider(provider);
        env.storage().persistent().set(&key, &true);
    }

    // Remove an approved provider (admin-only)
    pub fn remove_provider(env: Env, provider: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set; initialize first");

        admin.require_auth();

        let key = DataKey::Provider(provider);
        env.storage().persistent().remove(&key);
    }

    // Query helper: is an address approved?
    pub fn is_provider(env: Env, provider: Address) -> bool {
        let key = DataKey::Provider(provider);
        env.storage().persistent().has(&key)
    }
}