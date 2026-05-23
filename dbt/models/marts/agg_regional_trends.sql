-- Weekly rollup of conflict severity and article volume by region.
-- Powers GET /api/analytics/regional-trends.

with events as (
    select * from {{ ref('int_conflict_events_unioned') }}
),

weekly as (
    select
        region,
        date_trunc('week', ingested_at)         as week,
        severity,
        count(*)                                 as event_count,
        round(avg(tone_score)::numeric, 2)       as avg_tone,
        sum(article_count)                       as total_articles
    from events
    group by 1, 2, 3
)

select * from weekly
order by week desc, region
