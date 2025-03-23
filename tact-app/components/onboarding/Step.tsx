import { usePrivy } from "@privy-io/expo";
import { useState } from "react";
import {
  Dimensions,
  TextInput,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";

const { width, height } = Dimensions.get("window");

type StepProps = {
  onboardingStep: number;
  setOnboardingStep: any;
  questionText: string;
  questionKey: string;
  totalSteps: number;
  responses: any;
  setResponses: any;
  setOnboardingComplete: any
};

const Step = (props: StepProps) => {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { getAccessToken } = usePrivy();

  const handleSubmit = async () => {
    const identityToken = await getAccessToken();
    const clonedResponses = JSON.parse(JSON.stringify(props.responses));
    clonedResponses[props.questionKey] = text;
    props.setResponses(clonedResponses);
    if (props.onboardingStep < props.totalSteps) {
      props.setOnboardingStep(props.onboardingStep + 1);
    } else {
      setSubmitting(true)
      await fetch(`https://tact-server.pinata-marketing-enterprise.workers.dev/users/responses`, {
        method: "POST",
        headers: {
          "Auth-Token": `${identityToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responses: props.responses,
        }),
      });
      props.setOnboardingComplete(true);
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.steps}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Text style={styles.question}>{props.questionText}</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter response"
        value={text}
        onChangeText={setText}
        placeholderTextColor="#eee"
      />
      <TouchableOpacity
        disabled={!text}
        onPress={handleSubmit}
        style={styles.buttonBackground}
      >
        <Text style={styles.buttonText}>
          {props.onboardingStep < props.totalSteps ? "Next" : submitting ? "Submitting profile..." : "Submit Profile"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  buttonText: {
    fontWeight: 900,
    textTransform: "uppercase",
    fontSize: 24,
    textAlign: "center",
  },
  buttonBackground: {
    backgroundColor: "#fff",
    padding: 20,
    width: width * 0.9,
    borderRadius: 30,
  },
  steps: {
    marginBottom: 300,
    width: width * 0.9,
  },
  input: {
    color: "#fff",
    display: "flex",
    width: width * 0.9,
    marginTop: 20,
    marginBottom: 35,
    backgroundColor: "#1C1C1E",
    padding: 20,
  },
  question: {
    color: "#fff",
    fontSize: 44,
    textTransform: "uppercase",
    marginTop: 20,    
  },
});

export default Step;
