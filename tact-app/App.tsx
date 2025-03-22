import { useCallback, useEffect, useState } from "react";
import { ImageBackground, Text, View, StyleSheet } from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import GetStarted from "./components/GetStarted";
import { PrivyProvider, usePrivy } from "@privy-io/expo";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  const { ready } = usePrivy();

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync(Entypo.font);
        // Artificially delay for two seconds to simulate a slow loading
        // experience. Remove this if you copy and paste the code!
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(() => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      SplashScreen.hide();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  if(!ready) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <PrivyProvider
      appId="cm8j51lri00ra5kwch3j8zg29"
      clientId="client-WY5i2S9jJQGhUTvZzuKnu7M9h33wRRp6MQYV4AT5RdW41"
    >
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <GetStarted />
      </View>
    </PrivyProvider>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "rgba(0,0,0,0.5)", // Optional overlay
    padding: 20,
    borderRadius: 10,
  },
  text: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
});
