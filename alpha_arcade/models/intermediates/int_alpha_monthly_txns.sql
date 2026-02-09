{{ config(materialized='table') }}

WITH daily AS (
    SELECT
        toStartOfMonth(realtime) AS month,
        toDayOfMonth(realtime) AS dom,
        countIf(app_id IN (SELECT market_id FROM {{ ref('stg_alpha_markets') }})) AS markets,
        countIf(snd_addr_id IN (SELECT account_id FROM {{ ref('stg_alpha_accounts') }})) AS accounts,
        countIf(snd_addr_id IN (8714960533, 8604447110, 8879667549)) AS creators
    FROM {{ source('mainnet', 'txn') }}
    WHERE realtime >= addMonths(toStartOfMonth(today()), -13)
    GROUP BY
        month,
        dom
),

monthly_mtd AS (
    SELECT
        month AS date,
        sum(markets + accounts + creators) AS transactions
    FROM daily
    WHERE dom <= toDayOfMonth(today())
    GROUP BY month
)

SELECT
    date,
    transactions,
    sum(transactions) OVER (ORDER BY date) AS cum_txns
FROM monthly_mtd
