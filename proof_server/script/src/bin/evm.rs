//! An end-to-end example of using the SP1 SDK to generate a proof of a program that can have an
//! EVM-Compatible proof generated which can be verified on-chain.
//!
//! You can run this script using the following command:
//! ```shell
//! RUST_LOG=info cargo run --release --bin evm -- --system groth16
//! ```
//! or
//! ```shell
//! RUST_LOG=info cargo run --release --bin evm -- --system plonk
//! ```

use alloy_sol_types::SolType;
use clap::{Parser, ValueEnum};
use serde::{Deserialize, Serialize};
use sp1_sdk::{
    include_elf, HashableKey, ProverClient, SP1ProofWithPublicValues, SP1Stdin, SP1VerifyingKey,
};
use std::path::PathBuf;
use tact_lib::{check_mutual_interest, PublicValuesStruct, UserLike};

/// The ELF (executable and linkable format) file for the Succinct RISC-V zkVM.
pub const BLIND_DATE_ELF: &[u8] = include_elf!("tact-program");

/// The arguments for the EVM command.
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct EVMArgs {
    #[clap(long, default_value = "1")]
    user_id: u32,

    #[clap(long, default_value = "2")]
    target_id: u32,

    #[clap(long, value_enum, default_value = "groth16")]
    system: ProofSystem,
}

/// Enum representing the available proof systems
#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, ValueEnum, Debug)]
enum ProofSystem {
    Plonk,
    Groth16,
}

/// A fixture that can be used to test the verification of SP1 zkVM proofs inside Solidity.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SP1MutualInterestProofFixture {
    user_id: u32,
    target_id: u32,
    is_match: bool,
    vkey: String,
    public_values: String,
    proof: String,
}

fn main() {
    // Setup the logger.
    sp1_sdk::utils::setup_logger();
    dotenv::dotenv().ok();

    // Parse the command line arguments.
    let args = EVMArgs::parse();

    // Create sample likes
    let likes = vec![
        UserLike {
            liker_id: 1,
            likee_id: 2,
        }, // User 1 likes User 2
        UserLike {
            liker_id: 2,
            likee_id: 1,
        }, // User 2 likes User 1 (mutual)
        UserLike {
            liker_id: 1,
            likee_id: 3,
        }, // User 1 likes User 3
        UserLike {
            liker_id: 3,
            likee_id: 1,
        }, // User 3 likes User 1 (mutual)
        UserLike {
            liker_id: 2,
            likee_id: 5,
        }, // User 2 likes User 5
        UserLike {
            liker_id: 3,
            likee_id: 4,
        }, // User 3 likes User 4
        UserLike {
            liker_id: 4,
            likee_id: 1,
        }, // User 4 likes User 1
        UserLike {
            liker_id: 5,
            likee_id: 1,
        }, // User 5 likes User 1
    ];

    // Setup the prover client.
    let client = ProverClient::from_env();

    // Setup the program.
    let (pk, vk) = client.setup(BLIND_DATE_ELF);

    // Setup the inputs.
    let mut stdin = SP1Stdin::new();
    stdin.write(&args.user_id);
    stdin.write(&args.target_id);

    // Write likes count
    stdin.write(&(likes.len() as u32));

    // Write all likes
    for like in &likes {
        stdin.write(&like.liker_id);
        stdin.write(&like.likee_id);
    }

    println!("user_id: {}, target_id: {}", args.user_id, args.target_id);
    println!("Proof System: {:?}", args.system);

    // Generate the proof based on the selected proof system.
    let proof = match args.system {
        ProofSystem::Plonk => client.prove(&pk, &stdin).plonk().run(),
        ProofSystem::Groth16 => client.prove(&pk, &stdin).groth16().run(),
    }
    .expect("failed to generate proof");

    create_proof_fixture(&proof, &vk, args.system);
}

/// Create a fixture for the given proof.
fn create_proof_fixture(
    proof: &SP1ProofWithPublicValues,
    vk: &SP1VerifyingKey,
    system: ProofSystem,
) {
    // Deserialize the public values.
    let bytes = proof.public_values.as_slice();
    let public_values = PublicValuesStruct::abi_decode(bytes, false).unwrap();

    // Create the testing fixture so we can test things end-to-end.
    let fixture = SP1MutualInterestProofFixture {
        user_id: public_values.user_id,
        target_id: public_values.target_id,
        is_match: public_values.is_match,
        vkey: vk.bytes32().to_string(),
        public_values: format!("0x{}", hex::encode(bytes)),
        proof: format!("0x{}", hex::encode(proof.bytes())),
    };

    // Print the fixture details
    println!("Verification Key: {}", fixture.vkey);
    println!("Public Values: {}", fixture.public_values);
    println!("Proof Bytes: {}", fixture.proof);
    println!(
        "User {} and User {} match: {}",
        fixture.user_id, fixture.target_id, fixture.is_match
    );

    // Save the fixture to a file.
    let fixture_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../contracts/src/fixtures");
    std::fs::create_dir_all(&fixture_path).expect("failed to create fixture path");
    std::fs::write(
        fixture_path.join(format!("{:?}-mutual-interest-fixture.json", system).to_lowercase()),
        serde_json::to_string_pretty(&fixture).unwrap(),
    )
    .expect("failed to write fixture");
}
