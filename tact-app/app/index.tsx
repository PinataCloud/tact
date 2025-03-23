import { View, StyleSheet } from "react-native";
import { usePrivy } from "@privy-io/expo";
import GetStarted from "../components/GetStarted";
import { Text } from "react-native";
import Onboarding from "../components/Onboarding";
import { useEffect, useState } from "react";
import SplashLoading from "../components/SplashLoading";
import Matches from "../components/onboarding/Matches";

export default function HomeScreen() {
  const { isReady, user, getAccessToken, logout } = usePrivy();
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  
  useEffect(() => {
    const registerUserIfNotRegistered = async () => {
      const identityToken = await getAccessToken();
      await fetch(`https://cf3d-66-68-201-142.ngrok-free.app/users/register`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Auth-Token': identityToken!
        },
        body: JSON.stringify({})
      });

      //  Get onboarding status
      const results = await fetch(`https://cf3d-66-68-201-142.ngrok-free.app/users/profile`, {
        method: "GET",
        headers: {
          'Auth-Token': identityToken!
        },
      })

      const data = await results.json();

      if(data.data.response_hash) {
        console.log("Onboarding complete")
        setOnboardingComplete(true);
      } else {
        console.log("Time to onboard")
      }
    }
    
    if(user && user.id) {
      registerUserIfNotRegistered();
      // logout();
    }
  }, [user, getAccessToken]);

  if(!isReady) {
    return <SplashLoading />;
  }
  
  return (
    <View style={styles.container}>
      {user && onboardingComplete ? (
        <Matches />
      ) : user ? (
        <Onboarding setOnboardingComplete={setOnboardingComplete} />
      ) : (
        <GetStarted />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});