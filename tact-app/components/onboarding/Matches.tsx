import { usePrivy } from "@privy-io/expo";
import { useEffect, useState, useRef } from "react";
import {
  ImageBackground,
  Text,
  StyleSheet,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Define the Match type for better type safety
interface Match {
  userId: number;
  cid: string;
  file_id: string;
  picture: string;
  score: number;
  username: string;
  mutual_match?: boolean;
  pending_match?: boolean;
}

const Matches = () => {
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [interestedUsers, setInterestedUsers] = useState<{
    [key: string]: boolean;
  }>({});
  const [animatingUsers, setAnimatingUsers] = useState<{
    [key: string]: boolean;
  }>({});
  const { getAccessToken } = usePrivy();

  // Animation values
  const animationValues = useRef<{ [key: string]: Animated.Value }>({});

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const identityToken = await getAccessToken();
      const res = await fetch(
        `https://tact-server.pinata-marketing-enterprise.workers.dev/matches`,
        {
          method: "GET",
          headers: {
            "Auth-Token": identityToken!,
          },
        }
      );
      const data = await res.json();
      console.log(data.data);

      // Initialize animation values for each match
      const matchData = data.data;
      matchData.forEach((match: Match) => {
        if (!animationValues.current[match.file_id]) {
          animationValues.current[match.file_id] = new Animated.Value(0);
        }
      });

      setMatches(matchData);
      setLoadingMatches(false);
    } catch (error) {
      console.error("Error loading matches:", error);
      setLoadingMatches(false);
    }
  };

  const formatScore = (score: number) => {
    // Convert score to percentage and round to whole number
    return Math.round(score * 100) + "%";
  };

  const showInterest = async (userId: number) => {
    console.log("Showing interest for: ", userId);
    // Prevent multiple clicks or if already a mutual match
    const matchItem = matches.find((match) => match.userId === userId);
    
    // If match item doesn't exist, return early
    if (!matchItem) return;
    
    // Check if we should skip animation
    if (
      animatingUsers[userId] ||
      interestedUsers[userId] ||
      matchItem.mutual_match
    ) {
      return;
    }
  
    // Set animating state
    setAnimatingUsers((prev) => ({ ...prev, [userId]: true }));
  
    // Run animation
    Animated.sequence([
      Animated.timing(animationValues.current[matchItem.file_id], {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
      Animated.timing(animationValues.current[matchItem.file_id], {
        toValue: 0.8,
        duration: 100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animation complete, update state
      setInterestedUsers((prev) => ({ ...prev, [userId]: true }));
      setAnimatingUsers((prev) => ({ ...prev, [userId]: false }));
  
      const sendInterest = async () => {
        try {
          const identityToken = await getAccessToken();
          await fetch(`https://tact-server.pinata-marketing-enterprise.workers.dev/matches`, {
            method: "POST",
            headers: {
              'Auth-Token': identityToken!,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ matchId: userId })
          });
        } catch (error) {
          console.error("Error expressing interest:", error);
        }
      };
      sendInterest();
    });
  };

  const renderMatchItem = ({ item }: { item: Match }) => {
    if(item.username === "polluterofminds") {
        console.log(item.picture);
    }
    // Initialize animation value if not already set
    if (!animationValues.current[item.file_id]) {
      animationValues.current[item.file_id] = new Animated.Value(0);
    }
  
    // Calculate animation styles
    const scale = animationValues.current[item.file_id].interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.2, 1],
    });
  
    const opacity = animationValues.current[item.file_id].interpolate({
      inputRange: [0, 0.8, 1],
      outputRange: [0, 0.7, 1],
    });
  
    return (
      <TouchableOpacity
        style={styles.matchCard}
        disabled={interestedUsers[item.userId]}
      >
        <View style={styles.matchContent}>
          <Image
            source={{
              uri:
                item.picture ||
                "https://ui-avatars.com/api/?name=" +
                  item.username +
                  "&background=random",
            }}
            style={styles.profilePicture}
          />
          <View style={styles.matchInfo}>
            <Text style={styles.username}>{item.username}</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Match Score</Text>
              <Text style={styles.scoreValue}>{formatScore(item.score)}</Text>
            </View>
          </View>
        </View>
  
        {/* Interest indicator */}
        <View style={styles.interestContainer}>
          {interestedUsers[item.userId] || item.pending_match ? (
            <View style={styles.statusContainer}>
              <Ionicons name="hourglass-outline" size={24} color="#FFD700" />
              <Text style={styles.statusText}>Pending</Text>
            </View>
          ) : item.mutual_match ? (
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => {
                /* Navigate to chat */
              }}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#4CD964" />
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.interestButton}
              onPress={() => showInterest(item.userId)}
              disabled={animatingUsers[item.userId]} // Changed from file_id to userId
            >
              <Text style={styles.interestButtonText}>Express Interest</Text>
            </TouchableOpacity>
          )}
  
          {/* Animation overlay */}
          {animatingUsers[item.userId] && ( // Changed from file_id to userId
            <Animated.View
              style={[
                styles.animationOverlay,
                {
                  opacity: opacity,
                  transform: [{ scale: scale }],
                },
              ]}
            >
              <Ionicons name="heart" size={40} color="#FF375F" />
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/AppBackground.png")}
      style={styles.background}
      resizeMode="cover"
    >
      {loadingMatches ? (
        <View style={styles.loading}>
          <Text style={styles.heading}>
            This isn't swiping. This is selection.
          </Text>
          <Text style={{ color: "#fff" }}>
            Tactfully finding your matches...
          </Text>
        </View>
      ) : (
        <View style={styles.container}>
          <Text style={styles.pageTitle}>Your Matches</Text>
          <Text style={styles.pageSubtitle}>
            Not just matches. Possibilities.
          </Text>

          <FlatList
            data={matches}
            renderItem={renderMatchItem}
            keyExtractor={(item) => item.file_id}
            style={styles.matchesList}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 50,
    color: "#fff",
    textTransform: "uppercase",
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%", // Ensure loading view takes full height
  },
  background: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start", // Changed to flex-start for proper list layout
    alignItems: "center",
    padding: 25,
  },
  container: {
    flex: 1,
    width: "100%",
    paddingTop: 40,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 30,
    opacity: 0.8,
  },
  matchesList: {
    width: "100%",
  },
  listContent: {
    paddingBottom: 20,
  },
  matchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profilePicture: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ddd", // Placeholder background for images that fail to load
  },
  matchInfo: {
    marginLeft: 16,
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 16,
    color: "#000",
    opacity: 0.7,
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  interestContainer: {
    position: "relative",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  interestButton: {
    backgroundColor: "#000",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
  },
  interestButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
    width: "100%",
    justifyContent: "center",
  },
  statusText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 4,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 217, 100, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(76, 217, 100, 0.3)",
    width: "100%",
    justifyContent: "center",
  },
  chatButtonText: {
    color: "#4CD964",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 4,
  },
  animationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 55, 95, 0.2)",
    borderRadius: 20,
    zIndex: 10,
  },
});

export default Matches;
