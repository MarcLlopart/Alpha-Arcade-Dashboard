{{ config(materialized='table') }}

WITH base AS (
    SELECT
        COALESCE(f.date, u.date, v.date, fe.date) AS date,
        -- FULL month values (charts)
        f.transactions,
        u.users,
        v.volume AS volume,
        fe.fees as fees,

        -- MTD values (KPIs)
        fm.transactions AS transactions_mtd,
        um.users        AS users_mtd,
        vm.vol          AS volume_mtd,
        fem.fees        AS fees_mtd

    FROM {{ ref('int_alpha_monthly_txns_full') }} f
    LEFT JOIN {{ ref('int_alpha_monthly_users_full') }}  u
        ON f.date = u.date
    LEFT JOIN {{ ref('int_alpha_monthly_volume_full') }} v
        ON f.date = v.date
    LEFT JOIN {{ ref('int_alpha_monthly_fees_full') }}   fe
        ON f.date = fe.date

    LEFT JOIN {{ ref('int_alpha_monthly_txns') }}   fm
        ON f.date = fm.date
    LEFT JOIN {{ ref('int_alpha_monthly_users') }}  um
        ON f.date = um.date
    LEFT JOIN {{ ref('int_alpha_monthly_volume') }} vm
        ON f.date = vm.date
    LEFT JOIN {{ ref('int_alpha_monthly_fees') }}   fem
        ON f.date = fem.date
),

with_cumulative AS (
    SELECT
        *,
        sum(volume) OVER (
            ORDER BY date
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS cum_volume,
        sum(fees) OVER (
            ORDER BY date
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS cum_fees
    FROM base
)

SELECT *
FROM with_cumulative
WHERE date >= addMonths(toStartOfMonth(today()), -12)
ORDER BY date