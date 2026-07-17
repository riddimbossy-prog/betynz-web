#!/usr/bin/env sh
set -eu
rm -f backend-client.js backend-config.js monetization-config.js community-features.js \
  FUTURE_MONETIZATION.md LAUNCH_COMMUNITY_SETUP.md MONETIZATION_SETUP.md \
  PAYSTACK_SUBSCRIPTION_SETUP.md SECURE_BACKEND_SETUP.md PRESERVE_LIVE_DATA_v5.9.1.txt
rm -rf supabase assets/splash
rm -f CHANGELOG_v2*.md CHANGELOG_v3*.md CHANGELOG_v4*.md CHANGELOG_v5*.md
rm -f INSTALL_v2*.txt INSTALL_v3*.txt INSTALL_v4*.txt INSTALL_v5*.txt
rm -f tests/instant-data-boot-tests.js
printf '%s\n' 'Betynz legacy startup features removed. data.js was preserved.'
