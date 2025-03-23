import { usePrivy } from "@privy-io/expo";
import { useEffect, useState } from "react";
import { ImageBackground, Text, StyleSheet, View, Image, FlatList, TouchableOpacity, ScrollView } from "react-native";

// Define the Match type for better type safety
interface Match {
  cid: string;
  file_id: string;
  picture: string;
  score: number;
  username: string;
}

const Matches = () => {
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const { getAccessToken } = usePrivy();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const identityToken = await getAccessToken();
      const res = await fetch(`https://cf3d-66-68-201-142.ngrok-free.app/matches`, {
        method: "GET",
        headers: {
          'Auth-Token': identityToken!
        }
      });
      const data = await res.json();
      console.log(data.data);
      setMatches(data.data);
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

  const renderMatchItem = ({ item }: { item: Match }) => (
    <TouchableOpacity style={styles.matchCard}>
      <View style={styles.matchContent}>
        <Image 
          source={{ uri: item.picture || "https://ui-avatars.com/api/?name=" + item.username + "&background=random"}}
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
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require("../../assets/AppBackground.png")}
      style={styles.background}
      resizeMode="cover"
    >
      {loadingMatches ? (
        <View style={styles.loading}>
          <Text style={styles.heading}>This isn't swiping. This is selection.</Text>
        </View>
      ) : (
        <View style={styles.container}>
          <Text style={styles.pageTitle}>Your Matches</Text>
          <Text style={styles.pageSubtitle}>Not just matches. Possibilities.</Text>
          
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
    textTransform: "uppercase"
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%" // Ensure loading view takes full height
  },
  background: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start", // Changed to flex-start for proper list layout
    alignItems: "center",
    padding: 25
  },
  container: {
    flex: 1,
    width: "100%",
    paddingTop: 40
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8
  },
  pageSubtitle: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 30,
    opacity: 0.8
  },
  matchesList: {
    width: "100%"
  },
  listContent: {
    paddingBottom: 20
  },
  matchCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    backdropFilter: "blur(10px)"
  },
  matchContent: {
    flexDirection: "row",
    alignItems: "center"
  },
  profilePicture: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ddd" // Placeholder background for images that fail to load
  },
  matchInfo: {
    marginLeft: 16,
    flex: 1
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  scoreLabel: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.7,
    marginRight: 8
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff"
  }
});

export default Matches;