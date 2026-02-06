{{ config(
    materialized='table',
    order_by='date'
) }}

SELECT 
    dateTrunc('month', realtime) AS date,
    COUNT(CASE WHEN app_id IN (SELECT market_id FROM {{ ref('stg_alpha_markets') }}) THEN 1 END) AS markets,
    COUNT(CASE WHEN snd_addr_id IN (SELECT account_id FROM {{ ref('stg_alpha_accounts') }}) THEN 1 END) AS accounts,
    COUNT(CASE WHEN snd_addr_id IN (8714960533, 8604447110, 8879667549) THEN 1 END) AS creators
FROM {{ source('mainnet', 'txn') }}
WHERE dateTrunc('month', realtime) >= dateTrunc('month', NOW() - INTERVAL 12 MONTH)
GROUP BY date