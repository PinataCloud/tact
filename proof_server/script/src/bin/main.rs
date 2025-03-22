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
use tact_lib::{check_mutual_interest, PublicValuesStruct, UserLike};

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

    #[clap(long, default_value = "2")]
    target_id: u32,
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
    stdin.write(&args.target_id);

    // Write likes count
    stdin.write(&(likes.len() as u32));

    // Write all likes
    for like in &likes {
        stdin.write(&like.liker_id);
        stdin.write(&like.likee_id);
    }

    println!(
        "Checking if User {} and User {} have mutual interest",
        args.user_id, args.target_id
    );

    // Pre-compute the expected result for verification
    let expected_result = check_mutual_interest(args.user_id, args.target_id, &likes);

    if args.execute {
        // Execute the program
        let (output, report) = client.execute(TACT_ELF, &stdin).run().unwrap();
        println!("Program executed successfully.");

        // Read the output
        let decoded = PublicValuesStruct::abi_decode(output.as_slice(), true).unwrap();

        println!(
            "User {} and User {} mutual match: {}",
            decoded.user_id, decoded.target_id, decoded.is_match
        );

        // Compare with expected result
        assert_eq!(decoded.is_match, expected_result);
        println!("Result verified correctly!");

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
        println!("Target ID: {}", decoded.target_id);
        println!("Is Match: {}", decoded.is_match);

        // Verify the result
        assert_eq!(decoded.is_match, expected_result);
        println!("Result verified correctly!");
    }
}
