{{ config(
    materialized='table',
    order_by='date'
) }}

SELECT 
    dateTrunc('month', realtime) AS date, 
    SUM(CASE WHEN asset_id = 31566704 THEN amount END)/1e6 AS vol,
    SUM(SUM(CASE WHEN asset_id = 31566704 THEN amount END)/1e6) OVER (ORDER BY dateTrunc('month', realtime)) AS cum_vol 
FROM {{ source('mainnet', 'txn') }}
WHERE snd_addr_id IN (SELECT escrow_account_id FROM {{ ref('stg_escrow_accounts') }})
      AND dateTrunc('month', realtime) >= dateTrunc('month', NOW() - INTERVAL 12 MONTH)
GROUP BY date