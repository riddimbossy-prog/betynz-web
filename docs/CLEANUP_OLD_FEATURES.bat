@echo off
setlocal
for %%F in (backend-client.js backend-config.js monetization-config.js community-features.js FUTURE_MONETIZATION.md LAUNCH_COMMUNITY_SETUP.md MONETIZATION_SETUP.md PAYSTACK_SUBSCRIPTION_SETUP.md SECURE_BACKEND_SETUP.md PRESERVE_LIVE_DATA_v5.9.1.txt) do if exist "%%F" del /q "%%F"
if exist supabase rmdir /s /q supabase
if exist assets\splash rmdir /s /q assets\splash
for %%F in (CHANGELOG_v2*.md CHANGELOG_v3*.md CHANGELOG_v4*.md CHANGELOG_v5*.md INSTALL_v2*.txt INSTALL_v3*.txt INSTALL_v4*.txt INSTALL_v5*.txt) do if exist "%%F" del /q "%%F"
if exist tests\instant-data-boot-tests.js del /q tests\instant-data-boot-tests.js
echo Betynz legacy startup features removed. data.js was preserved.
endlocal
