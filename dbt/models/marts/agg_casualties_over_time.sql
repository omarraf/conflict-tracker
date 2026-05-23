-- Daily fatality rollup from ACLED events by country and region.
-- Powers GET /api/analytics/casualties-timeline.

with acled as (
    select * from {{ ref('stg_acled_events') }}
),

daily as (
    select
        date_trunc('day', event_date::timestamp)    as day,
        country,
        'Other'                                     as region,   -- enriched if region seed is added
        sum(fatalities)                             as total_fatalities,
        count(*)                                    as event_count
    from acled
    group by 1, 2, 3
)

select * from daily
order by day desc
