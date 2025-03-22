export type User = {
  gender: "Male" | "Female" | "Non-binary";
  name: {
    title: string;
    first: string;
    last: string;
  };
  location: {
    street: {
      number: number;
      name: string;
    };
    city: string;
    state: string;
    country: string;
    postcode: number | string;
    coordinates: {
      latitude: string;
      longitude: string;
    };
    timezone: {
      offset: string;
      description: string;
    };
  };
  username: string;
  dob: string; // ISO date string
  age: number;
  picture: {
    large: string;
    thumbnail: string;
  };
  responses?: {
    whatBringsYouHere: string;
    idealRelationshipDynamic: string;
    preferredCommunication: string;
    attachmentStyle: string;
    loveLanguage: string;
    weekendActivity: string;
    petsPreference: string;
    dailyRoutine: string;
    conflictHandling: string;
    biggestTurnOff: string;
    wantKids: string;
    workLifeBalance: string;
    biggestDealbreaker: string;
    successInRelationship: string;
    uncompromisableValue: string;
    funFact: string;
    comfortFood: string;
    dreamLife: string;
    guiltyPleasure: string;
    perfectFirstDate: string;
    selfImprovement: string;
    pastRelationshipLesson: string;
    similarOrChallenge: string;
    liveAnywhere: string;
    heartWinner: string;
  };
};

export type DatabaseUser = {
  created_at?: string;
  id?: string;
  username: string;
  full_name: string;
  city: string;
  state: string;
  country: string;
  dob: string;
  picture: string;
  response_hash?: string;
  updated_at?: string;
};
