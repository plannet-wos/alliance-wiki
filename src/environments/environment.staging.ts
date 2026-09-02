// Points at plannet-wos-staging — a throwaway Firebase project for verifying the multi-state
// rollout (see the plan) before the real cutover against tal-coordinator. Swapped in via the
// `staging` build configuration (see angular.json's fileReplacements) — never used by default.
// Cloudinary is unrelated to the Firebase project and stays the same real account — image
// uploads during staging verification land there same as prod, which is fine for this.
export const environment = {
  production: false,
  // The floating app-switcher FAB reads this — staging must never point back at prod
  // plannet-wos, see the redirect bug this fixed.
  plannetWosUrl: 'https://plannet-wos-staging.web.app',
  cloudinary: {
    cloudName: 'dc2okiac4',
    uploadPreset: 'ml_default'
  },
  firebase: {
    apiKey: "AIzaSyBI8SXYmf4AbOy-11VQn7qbhDagaxV-Rok",
    authDomain: "plannet-wos-staging.firebaseapp.com",
    projectId: "plannet-wos-staging",
    storageBucket: "plannet-wos-staging.firebasestorage.app",
    messagingSenderId: "305181543070",
    appId: "1:305181543070:web:b0a23d95f84951d201c98f"
  }
};
