//! A simple program that takes a number `n` as input, and writes the `n-1`th and `n`th fibonacci
//! number as an output.

// These two lines are necessary for the program to properly compile.
//
// Under the hood, we wrap your main function with some extra code so that it behaves properly
// inside the zkVM.
#![no_main]
sp1_zkvm::entrypoint!(main);

use alloy_sol_types::{private::FixedBytes, SolType};
use tact_lib::{compute_matches_hash, find_matches, PublicValuesStruct, UserLike, UserProfile};

pub fn main() {
    // Read the user ID for whom we want to find matches
    let user_id = sp1_zkvm::io::read::<u32>();

    // Read the number of profiles and likes
    let profile_count = sp1_zkvm::io::read::<u32>();
    let likes_count = sp1_zkvm::io::read::<u32>();

    // Read all user profiles
    let mut profiles = Vec::new();
    for _ in 0..profile_count {
        let id = sp1_zkvm::io::read::<u32>();
        let min_age = sp1_zkvm::io::read::<u32>();
        let max_age = sp1_zkvm::io::read::<u32>();
        let interests = sp1_zkvm::io::read::<u32>();
        let location = sp1_zkvm::io::read::<u32>();

        profiles.push(UserProfile {
            id,
            min_age,
            max_age,
            interests,
            location,
        });
    }

    // Read all user likes
    let mut likes = Vec::new();
    for _ in 0..likes_count {
        let liker_id = sp1_zkvm::io::read::<u32>();
        let likee_id = sp1_zkvm::io::read::<u32>();

        likes.push(UserLike { liker_id, likee_id });
    }

    // Find matches for the given user
    let matches = find_matches(user_id, &profiles, &likes);

    // Compute hash of matches for verification
    let matches_hash = compute_matches_hash(&matches);

    // Convert matches_hash to bytes32
    let mut bytes32 = [0u8; 32];
    bytes32.copy_from_slice(&matches_hash);

    // Encode the public values of the program
    let bytes = PublicValuesStruct::abi_encode(&PublicValuesStruct {
        user_id,
        match_count: matches.len() as u32,
        // Convert raw bytes to FixedBytes type
        matches_hash: FixedBytes(bytes32),
    });

    // Commit to the public values of the program
    sp1_zkvm::io::commit_slice(&bytes);
}
