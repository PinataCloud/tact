//! A simple program that takes a number `n` as input, and writes the `n-1`th and `n`th fibonacci
//! number as an output.

// These two lines are necessary for the program to properly compile.
//
// Under the hood, we wrap your main function with some extra code so that it behaves properly
// inside the zkVM.
#![no_main]
sp1_zkvm::entrypoint!(main);

use alloy_sol_types::SolType;
use tact_lib::{check_mutual_interest, PublicValuesStruct, UserLike};

pub fn main() {
    // Read the user IDs
    let user_id = sp1_zkvm::io::read::<u32>();
    let target_id = sp1_zkvm::io::read::<u32>();

    // Read the number of likes
    let likes_count = sp1_zkvm::io::read::<u32>();

    // Read all user likes
    let mut likes = Vec::new();
    for _ in 0..likes_count {
        let liker_id = sp1_zkvm::io::read::<u32>();
        let likee_id = sp1_zkvm::io::read::<u32>();

        likes.push(UserLike { liker_id, likee_id });
    }

    // Check if there's a mutual interest
    let is_match = check_mutual_interest(user_id, target_id, &likes);

    // Encode the public values of the program
    let bytes = PublicValuesStruct::abi_encode(&PublicValuesStruct {
        user_id,
        target_id,
        is_match,
    });

    // Commit to the public values of the program
    sp1_zkvm::io::commit_slice(&bytes);
}
