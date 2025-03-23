import { ImageBackground, View, StyleSheet } from "react-native";

export default function SplashLoading() {
  return (
    <ImageBackground
      source={require("../assets/splash-icon.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View></View>
      <View></View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
    borderRadius: 10,
  },
  text: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  button: {
    width: 300,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
    borderRadius: 14,
    backgroundColor: "#FFF",
    boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.15)",
    marginBottom: 55,
    paddingTop: 15,
    paddingBottom: 15,
  },
  buttonText: {
    textTransform: "uppercase",
    fontWeight: 800,
    fontSize: 16,
  },
});
