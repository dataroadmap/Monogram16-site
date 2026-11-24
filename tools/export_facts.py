"""
tools/export_facts.py  —  PostgreSQL  ->  data/facts.json

The dashboard on the website is static: it reads one JSON file and draws it in the
browser. This script writes that file from the MarketLens database.

Run it from the website folder, with DATABASE_URL set (same value as MarketLens):

    python tools/export_facts.py

Then commit data/facts.json and push. The dashboard updates when GitHub rebuilds.
"""

import json
import os
from datetime import date
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

load_dotenv()

OUT = Path(__file__).resolve().parent.parent / "data" / "facts.json"

# Company names shown on the dashboard, keyed by ticker.
COMPANIES = {
    "AAPL": "Apple",
    "MSFT": "Microsoft",
    "GOOGL": "Alphabet",
    "AMZN": "Amazon",
    "META": "Meta",
    "NVDA": "Nvidia",
    "TSLA": "Tesla",
}

# Friendly names for the tags in financial_facts. Add a row here and the measure
# appears in the dropdown; leave one out and it still appears, under its raw tag.
LABELS = {
    "Revenues": "Revenue",
    "NetIncomeLoss": "Net income",
    "OperatingIncomeLoss": "Operating income",
    "Assets": "Total assets",
    "Liabilities": "Total liabilities",
    "StockholdersEquity": "Shareholders’ equity",
    "ResearchAndDevelopmentExpense": "R&D spending",
    "CashAndCashEquivalentsAtCarryingValue": "Cash",
}

QUERY = """
    SELECT ticker, tag, fiscal_year, value, unit
    FROM financial_facts
    WHERE fiscal_period = 'FY'
      AND value IS NOT NULL
    ORDER BY tag, ticker, fiscal_year
"""


def main() -> None:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise SystemExit(
            "DATABASE_URL is not set.\n"
            "Put it in a .env file next to this script, the same value MarketLens uses."
        )

    with psycopg2.connect(url) as conn, conn.cursor() as cur:
        cur.execute(QUERY)
        rows = [
            {
                "ticker": ticker,
                "tag": tag,
                "fiscal_year": int(fiscal_year),
                "value": float(value),
                "unit": unit,
            }
            for ticker, tag, fiscal_year, value, unit in cur.fetchall()
        ]

    if not rows:
        raise SystemExit("The query returned no rows — is financial_facts loaded?")

    payload = {
        "generated": date.today().isoformat(),
        "companies": COMPANIES,
        "labels": LABELS,
        "rows": rows,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=1), encoding="utf-8")

    tickers = {r["ticker"] for r in rows}
    tags = {r["tag"] for r in rows}
    print(f"Wrote {OUT}")
    print(f"  {len(rows)} rows · {len(tickers)} companies · {len(tags)} measures")


if __name__ == "__main__":
    main()
