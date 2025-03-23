import React, { useState, useEffect } from "react";
import {
  Dimensions,
  TextInput,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import { PinataSDK } from "pinata";
import { useIdentityToken, usePrivy } from "@privy-io/expo";

const pinata = new PinataSDK({
  pinataJwt: "123",
});

const { width, height } = Dimensions.get("window");

type StepProps = {
  onboardingStep: number;
  setOnboardingStep: any;
  questionText: string;
  questionKey: string;
  totalSteps: number;
};

const ProfileStep = (props: StepProps) => {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { getAccessToken } = usePrivy();

  const isUploadStep = props.questionKey === "picture";

  const pickImage = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need access to your photos to upload a profile picture."
      );
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image) return;
  
    try {
      setUploading(true);
  
      // Get the file info
      const fileInfo = await FileSystem.getInfoAsync(image);
  
      if (!fileInfo.exists) {
        throw new Error("File does not exist");
      }
  
      // Get authentication token
      const identityToken = await getAccessToken();
      if (!identityToken) {
        throw new Error("Authentication failed: No identity token");
      }
      
      // First, get a presigned URL from your server
      const presignedUrlResponse = await fetch(`https://tact-server.pinata-marketing-enterprise.workers.dev/users/pfp`, {
        method: "POST",
        headers: {
          "Auth-Token": identityToken,
          "Content-Type": "application/json",
        },
      });
  
      if (!presignedUrlResponse.ok) {
        throw new Error(`Failed to get presigned URL: ${presignedUrlResponse.status}`);
      }
  
      const presignedUrlData = await presignedUrlResponse.json();
      const uploadUrl = presignedUrlData.data;
  
      console.log("Got presigned URL:", uploadUrl);
  
      // Get the file name and mime type
      const fileName = image.split("/").pop() || "profile-image.jpg";
      const mimeType = getMimeType(fileName);
      
      // In React Native, we need to upload directly using fetch with FormData
      // Read the file as base64
      const base64Data = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // Create form data with the file
      const formData = new FormData();
      formData.append('file', {
        uri: image,
        type: mimeType,
        name: fileName,
      } as any);
  
      // Upload directly to the presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      if (!uploadResponse.ok) {
        console.error("Upload response:", await uploadResponse.text());
        throw new Error(`File upload failed: ${uploadResponse.status}`);
      }
  
      const uploadResult = await uploadResponse.json();
      console.log("Upload successful:", uploadResult);
  
      // Update user profile with the IPFS URL
      const cid = uploadResult.data.cid;
      const ipfsUrl = `https://tutorials.mypinata.cloud/ipfs/${cid}`;
  
      const profileUpdateResponse = await fetch(`https://tact-server.pinata-marketing-enterprise.workers.dev/users/profile`, {
        method: "PUT",
        headers: {
          "Auth-Token": identityToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          picture: ipfsUrl,
        }),
      });
  
      if (!profileUpdateResponse.ok) {
        throw new Error(`Profile update failed: ${profileUpdateResponse.status}`);
      }
  
      // Move to next step after successful upload
      if (props.onboardingStep < props.totalSteps) {
        props.setOnboardingStep(props.onboardingStep + 1);
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert(
        "Upload Failed",
        "There was a problem uploading your image. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  // Helper function to determine mime type from file name
  const getMimeType = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "heic":
        return "image/heic";
      default:
        return "image/jpeg"; // Default to jpeg
    }
  };

  const handleSubmit = async () => {
    const identityToken = await getAccessToken();

    if (isUploadStep && image) {
      await uploadImage();
    } else if (text) {
        console.log(text);
      if (props.onboardingStep < props.totalSteps) {
        console.log("uploading...")
        await fetch(`https://tact-server.pinata-marketing-enterprise.workers.dev/users/profile`, {
          method: "PUT",
          headers: {
            "Auth-Token": `${identityToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            [props.questionKey]: text,
          }),
        });
        props.setOnboardingStep(props.onboardingStep + 1);
      } else {
        // Finish profile & show matches
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.steps, isUploadStep && styles.uploadStep]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Text style={styles.question}>{props.questionText}</Text>

      {isUploadStep ? (
        <View style={styles.uploadContainer}>
          {image ? (
            <View style={styles.fileNameContainer}>
              <Text style={styles.fileName}>{image.split("/").pop()}</Text>
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={pickImage}
              >
                <Text style={styles.changeImageText}>Change File</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Text style={styles.uploadButtonText}>Select Profile Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Enter response"
          value={text}
          onChangeText={setText}
          placeholderTextColor="#eee"
        />
      )}

      <TouchableOpacity
        disabled={
          (isUploadStep && !image) || (!isUploadStep && !text) || uploading
        }
        onPress={handleSubmit}
        style={[
          styles.buttonBackground,
          ((isUploadStep && !image) || (!isUploadStep && !text) || uploading) &&
            styles.disabledButton,
        ]}
      >
        <Text style={styles.buttonText}>
          {uploading
            ? "Uploading..."
            : props.onboardingStep < props.totalSteps
            ? "Next"
            : "Submit Profile"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  buttonText: {
    fontWeight: "900",
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
  disabledButton: {
    backgroundColor: "#888",
    opacity: 0.7,
  },
  steps: {
    marginBottom: 300,
    width: width * 0.9,
    marginTop: -160, // Using the negative margin from your previous fix
  },
  uploadStep: {
    marginTop: -100, // Less negative margin for upload step to show more content
  },
  input: {
    color: "#fff",
    display: "flex",
    width: width * 0.9,
    marginTop: 35,
    marginBottom: 35,
    backgroundColor: "#1C1C1E",
    padding: 20,
  },
  question: {
    color: "#fff",
    fontSize: 44,
    textTransform: "uppercase",
    marginTop: 20
  },
  uploadContainer: {
    width: width * 0.9,
    marginTop: 20,
    marginBottom: 35,
    alignItems: "center",
  },
  uploadButton: {
    backgroundColor: "#1C1C1E",
    padding: 40,
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
    borderStyle: "dashed",
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  fileNameContainer: {
    width: "100%",
    backgroundColor: "#1C1C1E",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 15,
  },
  fileName: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  changeImageButton: {
    backgroundColor: "#1C1C1E",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
  },
  changeImageText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default ProfileStep;
