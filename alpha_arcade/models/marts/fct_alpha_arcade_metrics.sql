{{ config(materialized='table') }}

SELECT 
    COALESCE(t.date, u.date, v.date, f.date) AS date,
    t.transactions,
    t.cum_txns,
    u.users,
    v.vol,
    v.cum_vol,
    f.fees,
    f.cum_fees
FROM {{ ref('int_alpha_monthly_txns') }} t
FULL OUTER JOIN {{ ref('int_alpha_monthly_users') }} u ON t.date = u.date
FULL OUTER JOIN {{ ref('int_alpha_monthly_volume') }} v ON t.date = v.date
FULL OUTER JOIN {{ ref('int_alpha_monthly_fees') }} f ON t.date = f.date
WHERE COALESCE(t.date, u.date, v.date, f.date) >= addMonths(toStartOfMonth(today()), -12)
