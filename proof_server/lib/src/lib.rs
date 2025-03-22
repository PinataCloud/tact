use alloy_sol_types::sol;

sol! {
    /// The public values encoded as a struct that can be easily deserialized inside Solidity.
    struct PublicValuesStruct {
        uint32 user_id; // The ID of the user checking for matches
        uint32 target_id; // The ID of the potential match
        bool is_match; // Whether they mutually like each other
    }
}

/// Represents a user's like for another user
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UserLike {
    pub liker_id: u32,
    pub likee_id: u32,
}

/// Check if two users have mutual interest in each other
pub fn check_mutual_interest(user_id: u32, target_id: u32, likes: &[UserLike]) -> bool {
    // Check if user_id likes target_id
    let user_likes_target = likes
        .iter()
        .any(|like| like.liker_id == user_id && like.likee_id == target_id);

    // Check if target_id likes user_id
    let target_likes_user = likes
        .iter()
        .any(|like| like.liker_id == target_id && like.likee_id == user_id);

    // Return true if both like each other
    user_likes_target && target_likes_user
}
