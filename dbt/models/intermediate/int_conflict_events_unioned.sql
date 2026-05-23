-- Union GDELT and ACLED into a common event shape.
-- GDELT tone is negative = bad; ACLED fatalities are converted to equivalent tone.

with gdelt as (
    select
        'gdelt'         as source,
        country_code,
        country,
        region,
        severity,
        avg_tone        as tone_score,
        article_count,
        ingested_at
    from {{ ref('stg_gdelt_events') }}
),

acled as (
    select
        'acled'         as source,
        left(country, 2) as country_code,   -- approximate; ACLED has no ISO field
        country,
        'Other'         as region,           -- enriched in int_conflict_deduped
        case
            when fatalities > 100 then 'critical'
            when fatalities > 20  then 'high'
            when fatalities > 5   then 'medium'
            else 'low'
        end             as severity,
        cast(-fatalities as float) / 10.0 as tone_score,
        1               as article_count,
        ingested_at
    from {{ ref('stg_acled_events') }}
),

unioned as (
    select * from gdelt
    union all
    select * from acled
)

select * from unioned
