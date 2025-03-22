use alloy_sol_types::sol;

sol! {
    /// The public values encoded as a struct that can be easily deserialized inside Solidity.
    struct PublicValuesStruct {
        uint32 user_id; // The ID of the user checking for matches
        uint32 match_count; // Number of matches found
        bytes32 matches_hash; // Hash of matches for verification
    }
}

/// Represents a user profile with preferences
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UserProfile {
    pub id: u32,
    pub min_age: u32,
    pub max_age: u32,
    pub interests: u32, // Bitfield of interests (each bit represents an interest)
    pub location: u32,  // Location code
}

/// Represents a user's like for another user
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UserLike {
    pub liker_id: u32,
    pub likee_id: u32,
}

/// Check if two users are compatible based on their profiles
pub fn are_compatible(user1: &UserProfile, user2: &UserProfile) -> bool {
    // Check age preferences
    let age1_in_range = user2.min_age <= user1.max_age && user1.min_age <= user2.max_age;

    // Check shared interests (at least one common interest)
    let shared_interests = user1.interests & user2.interests != 0;

    // Check location proximity (simple check for demo purposes)
    let nearby_location = user1.location == user2.location;

    age1_in_range && shared_interests && nearby_location
}

/// Find mutual matches for a specific user
pub fn find_matches(user_id: u32, profiles: &[UserProfile], likes: &[UserLike]) -> Vec<u32> {
    let mut matches = Vec::new();

    // Find all users that the current user likes
    let user_likes: Vec<u32> = likes
        .iter()
        .filter(|like| like.liker_id == user_id)
        .map(|like| like.likee_id)
        .collect();

    // Find all users who like the current user
    let liked_by: Vec<u32> = likes
        .iter()
        .filter(|like| like.likee_id == user_id)
        .map(|like| like.liker_id)
        .collect();

    // Find mutual likes (match)
    for other_id in liked_by {
        if user_likes.contains(&other_id) {
            // Check profile compatibility
            let user_profile = profiles.iter().find(|p| p.id == user_id).unwrap();
            let other_profile = profiles.iter().find(|p| p.id == other_id).unwrap();

            if are_compatible(user_profile, other_profile) {
                matches.push(other_id);
            }
        }
    }

    matches
}

/// Compute a simple hash of matches for verification
pub fn compute_matches_hash(matches: &[u32]) -> [u8; 32] {
    let mut hash = [0u8; 32];
    for (i, match_id) in matches.iter().enumerate().take(8) {
        let bytes = match_id.to_le_bytes();
        for (j, &byte) in bytes.iter().enumerate().take(4) {
            let pos = (i * 4 + j) % 32;
            hash[pos] ^= byte;
        }
    }
    hash
}
