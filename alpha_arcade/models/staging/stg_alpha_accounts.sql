{{ config(materialized='view') }}

SELECT 
    a.id AS account_id,
    a.app_id AS market_id
FROM mainnet.account a
WHERE a.app_id IN (SELECT market_id FROM {{ ref('stg_alpha_markets') }})