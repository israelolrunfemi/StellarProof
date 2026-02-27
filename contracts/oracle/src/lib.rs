use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Bytes, BytesN, Env, IntoVal,
};

#[contracttype]
pub enum DataKey {
    Registry,
    Provenance,
    Admin,
    Provider(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    UnauthorizedSigner = 2,
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

    /// Verifies a cryptographic signature from a TEE provider.
    /// Calls the Registry contract to ensure both the provider and TEE hash are authorized.
    /// Rejects with `OracleError::UnauthorizedSigner` if unauthorized.
    /// Aborts (panics) if the Ed25519 signature is invalid.
    pub fn verify_attestation(
        env: Env,
        provider: BytesN<32>,
        tee_hash: BytesN<32>,
        payload: Bytes,
        signature: BytesN<64>,
    ) -> Result<(), Error> {
        let registry: Address = env
            .storage()
            .instance()
            .get(&DataKey::Registry)
            .ok_or(Error::NotInitialized)?;

        // Verify provider and hash are authorized in the Registry
        let is_verified: bool = env.invoke_contract(
            &registry,
            &soroban_sdk::Symbol::new(&env, "is_verified"),
            soroban_sdk::vec![
                &env,
                tee_hash.into_val(&env),
                provider.clone().into_val(&env)
            ],
        );

        if !is_verified {
            return Err(Error::UnauthorizedSigner);
        }

        // Verify the cryptographic signature (aborts entirely if invalid)
        env.crypto().ed25519_verify(&provider, &payload, &signature);

        Ok(())
    }
}

mod test;
