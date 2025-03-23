export type Bindings = {
    PRIVY_APP_ID: string;
    PRIVY_APP_SECRET: string;
    PINATA_JWT: string;
    PINATA_GATEWAY_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    SUPABASE_URL: string;
}

export interface Variables {
  privyId: string
}

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
  };

  export type Response = {
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