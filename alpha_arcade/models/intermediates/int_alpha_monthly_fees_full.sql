{{ config(materialized='table') }}

SELECT
    toStartOfMonth(realtime) AS date,
    SUM(amount) / 1e6 AS fees
FROM {{ source('mainnet', 'txn') }}
WHERE rcv_addr_id = 8604447110
  AND asset_id = 31566704
GROUP BY date
ORDER BY date
