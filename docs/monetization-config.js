window.BETYNZ_MONETIZATION = Object.freeze({
  mode: "production",
  freeLaunch: true,
  subscriptionsEnabled: false,
  currency: "USD",
  supportEmail: "",
  authUrl: "",
  accountPortalUrl: "",
  plans: {
    free: {
      name: "Free Full Access",
      monthly: 0,
      annual: 0,
      level: 3,
      description: "Every Betynz engine, board and explanation is free during the launch phase."
    },
    pro: {
      name: "Olympian Pro",
      monthly: 8.99,
      annual: 79,
      level: 2,
      description: "Reserved for a future monetization phase."
    },
    supreme: {
      name: "Zeus Supreme",
      monthly: 17.99,
      annual: 159,
      level: 3,
      description: "Reserved for a future monetization phase."
    },
    day: {
      name: "Day Pass",
      oneTime: 2.99,
      level: 3,
      durationHours: 24,
      description: "Reserved for a future monetization phase."
    }
  },
  checkoutUrls: {
    pro_monthly: "",
    pro_annual: "",
    supreme_monthly: "",
    supreme_annual: "",
    day: ""
  }
});
