//! An end-to-end example of using the SP1 SDK to generate a proof of a program that can be executed
//! or have a core proof generated.
//!
//! You can run this script using the following command:
//! ```shell
//! RUST_LOG=info cargo run --release -- --execute
//! ```
//! or
//! ```shell
//! RUST_LOG=info cargo run --release -- --prove
//! ```

use alloy_sol_types::SolType;
use clap::Parser;
use sp1_sdk::{include_elf, ProverClient, SP1Stdin};
use tact_lib::{compute_matches_hash, find_matches, PublicValuesStruct, UserLike, UserProfile};

/// The ELF file for the Succinct RISC-V zkVM
pub const TACT_ELF: &[u8] = include_elf!("tact-program");

/// The arguments for the command
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Args {
    #[clap(long)]
    execute: bool,

    #[clap(long)]
    prove: bool,

    #[clap(long, default_value = "1")]
    user_id: u32,
}

fn main() {
    // Setup the logger
    sp1_sdk::utils::setup_logger();
    dotenv::dotenv().ok();

    // Parse the command line arguments
    let args = Args::parse();

    if args.execute == args.prove {
        eprintln!("Error: You must specify either --execute or --prove");
        std::process::exit(1);
    }

    // Create sample user profiles
    let profiles = vec![
        UserProfile {
            id: 1,
            min_age: 25,
            max_age: 35,
            interests: 0b1010,
            location: 1,
        }, // User 1
        UserProfile {
            id: 2,
            min_age: 23,
            max_age: 33,
            interests: 0b1100,
            location: 1,
        }, // User 2
        UserProfile {
            id: 3,
            min_age: 28,
            max_age: 40,
            interests: 0b1001,
            location: 1,
        }, // User 3
        UserProfile {
            id: 4,
            min_age: 22,
            max_age: 30,
            interests: 0b0011,
            location: 2,
        }, // User 4
        UserProfile {
            id: 5,
            min_age: 30,
            max_age: 45,
            interests: 0b1110,
            location: 1,
        }, // User 5
    ];

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

    // Setup the prover client
    let client = ProverClient::from_env();

    // Setup the inputs
    let mut stdin = SP1Stdin::new();
    stdin.write(&args.user_id);

    // Write profile and likes count
    stdin.write(&(profiles.len() as u32));
    stdin.write(&(likes.len() as u32));

    // Write all profiles
    for profile in &profiles {
        stdin.write(&profile.id);
        stdin.write(&profile.min_age);
        stdin.write(&profile.max_age);
        stdin.write(&profile.interests);
        stdin.write(&profile.location);
    }

    // Write all likes
    for like in &likes {
        stdin.write(&like.liker_id);
        stdin.write(&like.likee_id);
    }

    println!("User ID: {}", args.user_id);

    // Pre-compute the expected matches for verification
    let expected_matches = find_matches(args.user_id, &profiles, &likes);

    if args.execute {
        // Execute the program
        let (output, report) = client.execute(TACT_ELF, &stdin).run().unwrap();
        println!("Program executed successfully.");

        // Read the output
        let decoded = PublicValuesStruct::abi_decode(output.as_slice(), true).unwrap();

        println!(
            "Matches for user {}: {} found",
            args.user_id, decoded.match_count
        );
        println!("Matches hash: {:?}", decoded.matches_hash);

        // Compare the match count with expected matches
        assert_eq!(decoded.match_count as usize, expected_matches.len());

        // Compute hash of expected matches and compare
        let expected_hash = compute_matches_hash(&expected_matches);
        let mut expected_bytes32 = [0u8; 32];
        expected_bytes32.copy_from_slice(&expected_hash);

        // Convert FixedBytes back to raw bytes for comparison
        let received_hash_bytes: [u8; 32] = decoded.matches_hash.into();

        assert_eq!(
            expected_bytes32, received_hash_bytes,
            "Match hash doesn't match expected value"
        );
        println!("Match count and hash verified correctly!");

        // Record the number of cycles executed
        println!("Number of cycles: {}", report.total_instruction_count());
    } else {
        // Setup the program for proving
        let (pk, vk) = client.setup(TACT_ELF);

        // Generate the proof
        let proof = client
            .prove(&pk, &stdin)
            .run()
            .expect("failed to generate proof");

        println!("Successfully generated proof!");

        // Verify the proof
        client.verify(&proof, &vk).expect("failed to verify proof");
        println!("Successfully verified proof!");

        // Print the proof info
        let decoded = PublicValuesStruct::abi_decode(proof.public_values.as_slice(), true).unwrap();
        println!("User ID: {}", decoded.user_id);
        println!("Match count: {}", decoded.match_count);

        // For debugging, show expected matches
        println!("Expected matches: {:?}", expected_matches);
        println!(
            "Expected match hash: {:?}",
            compute_matches_hash(&expected_matches)
        );
    }
}
