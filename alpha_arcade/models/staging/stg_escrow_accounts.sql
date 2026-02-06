{{ config(materialized='view') }}

WITH market_accs AS (
    SELECT id AS addr_id 
    FROM mainnet.account
    WHERE app_id IN (SELECT market_id FROM {{ ref('stg_alpha_markets') }})
),
app_escrows AS (
    SELECT id AS contract_id 
    FROM mainnet.app
    WHERE creator_addr_id IN (SELECT addr_id FROM market_accs)
)
SELECT id AS escrow_account_id
FROM mainnet.account
WHERE app_id IN (SELECT contract_id FROM app_escrows)