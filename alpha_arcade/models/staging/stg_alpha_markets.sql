{{ config(materialized='view') }}

SELECT id AS market_id
FROM mainnet.app
WHERE creator_addr_id = 8714960533