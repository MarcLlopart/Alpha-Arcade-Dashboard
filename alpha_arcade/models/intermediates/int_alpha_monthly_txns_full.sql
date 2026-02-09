{{ config(materialized='table') }}

WITH daily AS (
    SELECT
        toStartOfMonth(realtime) AS month,

        countIf(app_id IN (
            SELECT market_id FROM {{ ref('stg_alpha_markets') }}
        )) AS markets,

        countIf(snd_addr_id IN (
            SELECT account_id FROM {{ ref('stg_alpha_accounts') }}
        )) AS accounts,

        countIf(snd_addr_id IN (
            8714960533, 8604447110, 8879667549
        )) AS creators
    FROM {{ source('mainnet', 'txn') }}
    GROUP BY month
)

SELECT
    month AS date,
    sum(markets + accounts + creators) AS transactions
FROM daily
GROUP BY month
ORDER BY date
