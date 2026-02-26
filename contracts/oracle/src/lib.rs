#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
pub enum DataKey {
    Registry,
    Provenance,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum OracleError {
    /// Oracle has not been initialized with a registry address.
    RegistryNotConfigured = 1,
    /// Cross-contract call to the registry failed (e.g. missing function, bad address).
    RegistryCallFailed = 2,
    /// The registry does not recognize the provided TEE hash as trusted.
    TeeNotVerified = 3,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn init(env: Env, registry: Address, provenance: Address) {
        if env.storage().instance().has(&DataKey::Registry) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Registry, &registry);
        env.storage()
            .instance()
            .set(&DataKey::Provenance, &provenance);
    }

    /// Verify a TEE measurement hash via the external Registry contract.
    ///
    /// This performs a cross-contract call to the Registry's `is_verified`
    /// function using the stored Registry address.
    ///
    /// - If the registry reports the hash as not verified, this returns
    ///   `Err(OracleError::TeeNotVerified)`.
    /// - If the cross-contract call itself fails (e.g. bad address, missing
    ///   function), this returns `Err(OracleError::RegistryCallFailed)`.
    /// - If the Oracle was never initialized with a registry address, this
    ///   returns `Err(OracleError::RegistryNotConfigured)`.
    pub fn verify_tee_hash(env: Env, tee_hash: BytesN<32>) -> Result<(), OracleError> {
        // 1. Load the configured registry address.
        let registry: Address = env
            .storage()
            .instance()
            .get(&DataKey::Registry)
            .ok_or(OracleError::RegistryNotConfigured)?;

        // 2. Call `is_verified` on the registry via a cross-contract call.
        //    Use `try_invoke_contract` so that we can handle failures
        //    gracefully instead of aborting the transaction.
        let func = Symbol::new(&env, "is_verified");
        let args: Vec<Val> = vec![&env, tee_hash.into_val(&env)];

        let result = env.try_invoke_contract::<bool, InvokeError>(&registry, &func, args);

        match result {
            // Cross-contract call succeeded and returned a value.
            Ok(Ok(true)) => Ok(()),
            Ok(Ok(false)) => Err(OracleError::TeeNotVerified),
            // Any failure to invoke or decode the result from the registry
            // is treated as a generic cross-contract call failure.
            Ok(Err(_)) | Err(_) => Err(OracleError::RegistryCallFailed),
        }
    }
}

mod test;
