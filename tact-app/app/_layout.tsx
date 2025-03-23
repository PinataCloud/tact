import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { PrivyElements, PrivyProvider } from "@privy-io/expo";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";

enableScreens();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();
// Set the animation options
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync(Entypo.font);
        // Simulate a slow loading experience (remove in production)
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
      // Hide splash screen once app is ready
      SplashScreen.hide();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PrivyProvider
        appId="cm8j51lri00ra5kwch3j8zg29"
        clientId="client-WY5i2S9jJQGhUTvZzuKnu7M9h33wRRp6MQYV4AT5RdW41"
        config={{
          embedded: {
              ethereum: { 
                  createOnLogin: 'users-without-wallets',
              }, 
          }, 
      }}
      >
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <Stack screenOptions={{
            headerShown: false,
            animation: 'fade'
          }} />
        </View>
        <PrivyElements />
      </PrivyProvider>
    </SafeAreaProvider>
  );
}
