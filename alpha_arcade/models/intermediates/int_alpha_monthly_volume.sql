{{ config(materialized='table') }}

WITH daily AS (
    SELECT
        toStartOfMonth(realtime) AS month,
        toDayOfMonth(realtime) AS dom,
        sumIf(amount, asset_id = 31566704) / 1e6 AS vol
    FROM {{ source('mainnet', 'txn') }}
    WHERE snd_addr_id IN (SELECT escrow_account_id FROM {{ ref('stg_escrow_accounts') }})
      AND realtime >= addMonths(toStartOfMonth(today()), -13)
    GROUP BY
        month,
        dom
),

monthly_mtd AS (
    SELECT
        month AS date,
        sum(vol) AS vol
    FROM daily
    WHERE dom <= toDayOfMonth(today())
    GROUP BY month
)

SELECT
    date,
    vol,
    sum(vol) OVER (ORDER BY date) AS cum_vol
FROM monthly_mtd
