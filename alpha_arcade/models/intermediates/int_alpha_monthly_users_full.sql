{{ config(materialized='table') }}

SELECT
    toStartOfMonth(realtime) AS date,
    COUNT(DISTINCT snd_addr_id) AS users
FROM {{ source('mainnet', 'txn') }}
WHERE type_ext = 'app_call'
  AND app_id IN (SELECT market_id FROM {{ ref('stg_alpha_markets') }})
  AND JSONExtractString(txn_extra, 'apaa', 1) = '4RryoA=='
GROUP BY date
ORDER BY date
