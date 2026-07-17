# Install Betynz v2.0 in `betynz-web`

1. Extract `Betynz_Production_v2_Real_Product.zip`.
2. Open the extracted `Betynz_Production_v2_Real_Product` folder.
3. In GitHub, open `riddimbossy-prog/betynz-web`.
4. Upload **everything inside the folder** to the repository root.
5. Replace files with the same names and commit directly to `main`.
6. Wait for **Deploy Betynz Product** to complete.
7. Open **Actions → Update Betynz Product Data → Run workflow**.
8. When it succeeds, open `https://betynz.com` and hard-refresh.

The first page included in the package is clearly marked **Demo Data**. The data workflow replaces it with a live API snapshot.

Required repository secrets:

- `API_FOOTBALL_KEY`
- `STATS_API_KEY`
- `DAYS_BACK` = `1`
- `DAYS_FWD` = `6`

Required workflow setting:

`Settings → Actions → General → Workflow permissions → Read and write permissions`
