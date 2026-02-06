{{ config(
    materialized='table',
    order_by='date'
) }}

SELECT 
    dateTrunc('month', realtime) AS date, 
    COUNT(DISTINCT snd_addr_id) AS users
FROM {{ source('mainnet', 'txn') }}
WHERE type_ext = 'app_call'
      AND app_id IN (SELECT market_id FROM {{ ref('stg_alpha_markets') }})
      AND JSONExtractString(txn_extra, 'apaa', 1) = '4RryoA=='
      AND dateTrunc('month', realtime) >= dateTrunc('month', NOW() - INTERVAL 12 MONTH)
GROUP BY date