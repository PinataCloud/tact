import fs from "fs";
import { PinataSDK } from "pinata";
import type { DatabaseUser, User } from "./types";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GROUP_ID = "0195b878-390f-7ab6-85d4-710312d2f33d";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
});

const questions: Record<keyof User["responses"], string[]> = {
  whatBringsYouHere: [
    "Serious Relationship",
    "Casual Dating",
    "Friendship",
    "Exploring",
    "Not Sure Yet",
  ],
  idealRelationshipDynamic: [
    "Long-term",
    "Short-term",
    "Open Relationship",
    "Monogamous",
    "Undecided",
  ],
  preferredCommunication: [
    "Text-heavy",
    "Calls",
    "In-person",
    "Mixed",
    "Slow to Respond but Thoughtful",
  ],
  attachmentStyle: ["Secure", "Anxious", "Avoidant", "Not Sure"],
  loveLanguage: [
    "Words of Affirmation",
    "Acts of Service",
    "Physical Touch",
    "Quality Time",
    "Gifts",
  ],
  weekendActivity: [
    "Outdoors & Active",
    "Socializing",
    "Traveling",
    "Relaxing at Home",
    "Creative Projects",
    "Gaming",
    "Other",
  ],
  petsPreference: [
    "Love them & have one",
    "Want one",
    "Allergic",
    "Not a fan",
    "Neutral",
  ],
  dailyRoutine: [
    "Early bird",
    "Night owl",
    "Flexible",
    "Always on the go",
    "Chill & spontaneous",
  ],
  conflictHandling: [
    "Talk it out immediately",
    "Need space first",
    "Prefer to avoid conflict",
    "Open to learning better ways",
  ],
  biggestTurnOff: [
    "Flakiness & ghosting",
    "Poor communication",
    "Lack of ambition",
    "Different political/social values",
    "Bad hygiene",
    "Other",
  ],
  wantKids: ["Yes", "No", "Maybe", "Open to discussion"],
  workLifeBalance: [
    "Ambitious & work-driven",
    "Balanced",
    "Flexible",
    "More laid-back",
    "Still figuring it out",
  ],
  biggestDealbreaker: [
    "Trust issues",
    "Lack of ambition",
    "Incompatibility in beliefs",
    "Lack of affection",
    "Different lifestyles",
  ],
  successInRelationship: [
    "Growing together",
    "Emotional support",
    "Shared experiences",
    "Passion & chemistry",
    "Other",
  ],
  uncompromisableValue: [
    "Honesty",
    "Loyalty",
    "Family",
    "Religion",
    "Career",
    "Personal Freedom",
    "Other",
  ],
  funFact: [
    "I can juggle flaming torches",
    "I once hiked 10 miles barefoot",
    "I have a secret talent for beatboxing",
    "I can solve a Rubik's cube in under a minute",
  ],
  comfortFood: ["Tacos", "Sushi", "Pizza", "Pasta", "Burgers", "Other"],
  dreamLife: [
    "Traveling the world",
    "Running my own business",
    "Living in a cabin in the woods",
    "Writing a book",
    "Exploring outer space",
  ],
  guiltyPleasure: [
    "Reality TV",
    "Cheesy rom-coms",
    "K-pop",
    "Heavy metal",
    "Old-school cartoons",
  ],
  perfectFirstDate: [
    "A sunset picnic by the beach",
    "Exploring a new city together",
    "Cooking a meal together",
    "A spontaneous road trip",
    "Stargazing in the mountains",
  ],
  selfImprovement: [
    "Being more patient",
    "Learning a new language",
    "Getting better at setting boundaries",
    "Becoming more confident",
  ],
  pastRelationshipLesson: [
    "Communication is everything",
    "Compromise is key",
    "Trust takes time",
    "Love is not enough without respect",
  ],
  similarOrChallenge: [
    "Someone similar to me",
    "Someone who challenges me",
    "A mix of both",
  ],
  liveAnywhere: [
    "Tokyo for the food and culture",
    "Bali for the beaches and peace",
    "New York for the energy and opportunities",
    "Paris for the romance",
    "Switzerland for the nature and hiking",
  ],
  heartWinner: [
    "Remembering small details about me",
    "Making me laugh when I least expect it",
    "Being kind to strangers",
    "Bringing me my favorite snack without asking",
  ],
};

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomGender(): "Male" | "Female" | "Non-binary" {
  return getRandomElement(["Male", "Female", "Non-binary"]);
}

const createUserProfile = async (): Promise<User> => {
  try {
    const gender = getRandomGender();
    const res = await fetch(
      `https://randomuser.me/api/?gender=${gender.toLowerCase()}`
    );
    const data = await res.json();
    const { results } = data;

    const user: User = {
      gender,
      name: results[0].name,
      location: {
        street: {
          number: results[0].location.street.number,
          name: results[0].location.street.name,
        },
        city: results[0].location.city,
        state: results[0].location.state,
        country: results[0].location.country,
        postcode: results[0].location.postcode,
        coordinates: {
          latitude: results[0].location.coordinates.latitude,
          longitude: results[0].location.coordinates.longitude,
        },
        timezone: {
          offset: results[0].location.timezone.offset,
          description: results[0].location.timezone.description,
        },
      },
      username: results[0].login.username,
      dob: results[0].dob.date,
      age: results[0].dob.age,
      picture: {
        large: results[0].picture.large,
        thumbnail: results[0].picture.thumbnail,
      },
      responses: {} as User["responses"],
    };

    if (user.responses) {
      Object.keys(questions).forEach((key) => {
        user.responses![key as keyof User["responses"]] = getRandomElement(
          questions[key as keyof User["responses"]]
        );
      });
    }

    return user;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const generateProfiles = async () => {
  const totalProfiles = 500;
  let currentCount = 0;
  const users: User[] = [];

  while (currentCount < totalProfiles) {
    try {
      console.log("User number: ", currentCount);
      const user = await createUserProfile();
      users.push(user);
      fs.writeFileSync(`./users/${user.username}.json`, JSON.stringify(user));
      currentCount++;
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }

  console.log("Done!");
};

const vectorizeProfileData = async () => {
  try {
    const users = fs.readdirSync("./users");
    for (const userFile of users) {
      if (userFile.includes(".json")) {
        console.log(userFile);
        try {
          const userDataRaw = fs.readFileSync(`./users/${userFile}`, "utf-8");
          const userData: User = JSON.parse(userDataRaw);

          const username = userData.username;
          const userQuestions = Object.keys(userData.responses!);
          let textString = ``;
          for (const question of userQuestions) {
            try {
              textString += `${question}: ${
                userData.responses?.[
                  question as keyof typeof userData.responses
                ] ?? "N/A"
              }\n`;
            } catch (error) {
              console.log("Error looping through user questions");
              throw error;
            }
          }

          const file = new File([textString], username, {
            type: "text/plain",
          });

          const { cid } = await pinata.upload.private
            .file(file)
            .group(GROUP_ID)
            .vectorize();

          await addToDB(userData, cid);
        } catch (error) {
          console.error(error);
          console.error("File:", userFile);
          throw error;
        }
      }
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const addToDB = async (user: User, cid: string) => {
  const userToAdd: DatabaseUser = {
    username: user.username,
    dob: user.dob,
    city: user.location.city,
    state: user.location.state,
    country: user.location.country,
    picture: user.picture.large,
    response_hash: cid,
    full_name: `${user.name.first} ${user.name.last}`,
  };
  const { data, error } = await supabase
    .from("users")
    .insert([userToAdd])
    .select();

  if (error) {
    throw error;
  }
};

const startScript = async () => {
  try {
    await generateProfiles();
    await vectorizeProfileData();
    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const updateGender = async () => {
  try {
    let { data: users, error } = await supabase.from("users").select("*");

    if (error) {
      throw error;
    }

    let newUsers = [];

    if (users) {
      for (const user of users) {
        console.log(user.username);
        try {
          const gender = getRandomGender();
          const res = await fetch(
            `https://randomuser.me/api/?gender=${gender.toLowerCase()}`
          );
          const data = await res.json();
          const { results } = data;

          const userData = results[0];

          const { data: updateData, error: updateError } = await supabase
            .from("users")
            .update({
              gender: gender,
              username: user.username,
              dob: userData.dob.date,
              city: userData.location.city,
              state: userData.location.state,
              country: userData.location.country,
              picture: userData.picture.large,
              full_name: `${userData.name.first} ${userData.name.last}`,
              created_at: new Date()
            })
            .eq("username", user.username)
            .select();

          if (updateError) {
            throw updateError;
          }
        } catch (error) {
          console.log(error);
          console.log(user.username);
          throw error;
        }
      }
    }

    console.log("Done!");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

// startScript();
updateGender();
