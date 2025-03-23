import { useCallback, useEffect, useState } from "react";
import {
  ImageBackground,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { IconButton } from "react-native-paper";
import Step from "./onboarding/Step";
import { profileQuestions, questions } from "../app/utils/questions";
import ProfileStep from "./onboarding/ProfileStep";
import { usePrivy } from "@privy-io/expo";

const { width, height } = Dimensions.get("window");

type OnboardingProps = {
  setOnboardingComplete: any
}

export default function Onboarding(props: OnboardingProps) {
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingStarted, setOnboardingStarted] = useState(false);
  const [responses, setResponses] = useState({
    whatBringsYouHere: "",
    weekendActivity: "",
    petsPreference: "",
    biggestTurnOff: "",
    wantKids: "",
    confortFood: "",
    liveAnywhere: "",
  });

  console.log(responses);

  const { logout } = usePrivy();

  //  We need to check the DB for onboarding state because we don't want to lose answers if someone's phone dies or they kill the app
  useEffect(() => {
    //  Load onboarding state here
  }, []);

  const totalSteps = profileQuestions.length + questions.length;

  const lastStep = () => {
    if (onboardingStep === 1) {
      setOnboardingStarted(false);
    } else {
      setOnboardingStep(onboardingStep - 1);
    }
  };

  const OnboardingStep = () => {
    // If step is within the profileQuestions range
    if (onboardingStep <= profileQuestions.length) {
      return (
        <ProfileStep
          questionKey={profileQuestions[onboardingStep - 1].questionKey}
          questionText={profileQuestions[onboardingStep - 1].questionText}
          totalSteps={totalSteps}
          onboardingStep={onboardingStep}
          setOnboardingStep={setOnboardingStep}
        />
      );
    } 
    // If step is within the regular questions range
    else {
      // Calculate the correct index for questions array
      const questionIndex = onboardingStep - profileQuestions.length - 1;
      
      return (
        <Step
          questionKey={questions[questionIndex].questionKey}
          questionText={questions[questionIndex].questionText}
          totalSteps={totalSteps}
          onboardingStep={onboardingStep}
          setOnboardingStep={setOnboardingStep}
          responses={responses}
          setResponses={setResponses}
          setOnboardingComplete={props.setOnboardingComplete}
        />
      );
    }
  };

  if (!onboardingStarted) {
    return (
      <ImageBackground
        source={require("../assets/AppBackground.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View></View>
        <View>
          <View style={styles.headingWrapper}>
            <Text style={styles.heading}>It's not just dating. It's TACT.</Text>
          </View>
          <View style={styles.onboardingStartCard}>
            <Text style={styles.startText}>
              A place for intentional connection. Private by design, personal by
              nature. Take your time—what you're looking for is looking for you
              too.
            </Text>
            <TouchableOpacity
              onPress={() => setOnboardingStarted(true)}
              style={styles.startOnboardingButton}
            >
              <Text style={styles.buildButtonText}>Build My Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <View style={styles.background}>
      <View style={styles.onboardingHeader}>
        <IconButton icon="chevron-left" size={40} onPress={lastStep} />
        <View />
      </View>
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          width,
          marginLeft: 60,
        }}
      >        
        <OnboardingStep />
        <Text style={styles.stepsText}>
          Step {onboardingStep} of {totalSteps}
        </Text>
      </View>
      <View />
    </View>
  );
}

const styles = StyleSheet.create({
  stepsText: {
    color: "#888",
    textAlign: "left",
  },
  onboardingHeader: {
    display: "flex",
    flexDirection: "row",
    paddingTop: 40,
    paddingLeft: 0,
    justifyContent: "flex-start",
    alignContent: "flex-start",
    width: width,
    marginBottom: 40
  },
  startText: {
    fontWeight: "600",
    marginBottom: 30,
  },
  onboardingStartCard: {
    backgroundColor: "#fff",
    borderRadius: 60,
    paddingTop: 65,
    paddingRight: 30,
    paddingLeft: 30,
    paddingBottom: 65,
  },
  headingWrapper: {
    width: width * 0.85,
    alignSelf: "center",
    marginBottom: 40,
  },
  heading: {
    textTransform: "uppercase",
    fontSize: 60,
    fontWeight: "800",
    color: "#fff",
  },
  background: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#000",
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
    alignSelf: "center",
    borderRadius: 14,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 55,
    paddingVertical: 15,
  },
  buttonText: {
    textTransform: "uppercase",
    fontWeight: "800",
    fontSize: 16,
  },
  startOnboardingButton: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  buildButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});