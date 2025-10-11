node run.mjs \
  --sheet="https://docs.google.com/spreadsheets/d/$1/export?format=csv" \
  --browser=firefox \
  --replacements-file=replace.txt \
  --outdir=output
