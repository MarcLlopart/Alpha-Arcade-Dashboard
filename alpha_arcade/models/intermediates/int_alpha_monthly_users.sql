{{ config(materialized='table') }}

SELECT
    toStartOfMonth(realtime) AS date,
    uniqExact(snd_addr_id) AS users
FROM {{ source('mainnet', 'txn') }}
WHERE type_ext = 'app_call'
  AND app_id IN (SELECT market_id FROM {{ ref('stg_alpha_markets') }})
  AND JSONExtractString(txn_extra, 'apaa', 1) = '4RryoA=='
  AND realtime >= addMonths(toStartOfMonth(today()), -13)
  AND toDayOfMonth(realtime) <= toDayOfMonth(today())
GROUP BY date
