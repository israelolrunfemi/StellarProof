#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
pub enum DataKey {
    Registry,
    Provenance,
    Admin,
    Provider(Address),
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn init(env: Env, registry: Address, provenance: Address, admin: Address) {
        if env.storage().instance().has(&DataKey::Registry) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Registry, &registry);
        env.storage()
            .instance()
            .set(&DataKey::Provenance, &provenance);
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn add_provider(env: Env, provider: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set; initialize first");
        admin.require_auth();

        let key = DataKey::Provider(provider);
        env.storage().persistent().set(&key, &true);
    }

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

    pub fn is_provider(env: Env, provider: Address) -> bool {
        let key = DataKey::Provider(provider);
        env.storage().persistent().has(&key)
    }
}

mod test;
