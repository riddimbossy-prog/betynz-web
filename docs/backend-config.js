window.BETYNZ_BACKEND_CONFIG = Object.freeze({
  provider: "supabase",
  enabled: false,
  supabaseUrl: "",
  supabaseAnonKey: "",
  siteUrl: "https://betynz.com",
  authRedirectUrl: "https://betynz.com/#profile",
  functions: {
    checkout: "create-checkout-session",
    cancelSubscription: "cancel-subscription",
    deleteAccount: "delete-account"
  }
});
