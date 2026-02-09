{{ config(materialized='table') }}

SELECT
    toStartOfMonth(realtime) AS date,
    SUM(amount) / 1e6 AS volume
FROM {{ source('mainnet', 'txn') }}
WHERE asset_id = 31566704
  AND snd_addr_id IN (SELECT escrow_account_id FROM {{ ref('stg_escrow_accounts') }})
GROUP BY date
ORDER BY date
