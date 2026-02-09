{{ config(materialized='table') }}

WITH daily AS (
    SELECT
        toStartOfMonth(realtime) AS month,
        toDayOfMonth(realtime) AS dom,
        sum(amount) / 1e6 AS fees
    FROM {{ source('mainnet', 'txn') }}
    WHERE rcv_addr_id = 8604447110
      AND asset_id = 31566704
      AND realtime >= addMonths(toStartOfMonth(today()), -13)
    GROUP BY
        month,
        dom
),

monthly_mtd AS (
    SELECT
        month AS date,
        sum(fees) AS fees
    FROM daily
    WHERE dom <= toDayOfMonth(today())
    GROUP BY month
)

SELECT
    date,
    fees,
    sum(fees) OVER (ORDER BY date) AS cum_fees
FROM monthly_mtd
