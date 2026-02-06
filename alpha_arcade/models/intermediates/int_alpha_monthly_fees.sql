{{ config(
    materialized='table',
    order_by='date'
) }}

SELECT 
    dateTrunc('month', realtime) AS date, 
    SUM(amount)/1e6 AS fees,
    SUM(SUM(amount)/1e6) OVER (ORDER BY dateTrunc('month', realtime)) AS cum_fees
FROM {{ source('mainnet', 'txn') }}
WHERE rcv_addr_id = 8604447110
      AND asset_id = 31566704
      AND dateTrunc('month', realtime) >= dateTrunc('month', NOW() - INTERVAL 12 MONTH)
GROUP BY date