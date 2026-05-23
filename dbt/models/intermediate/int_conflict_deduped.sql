-- Deduplicate events to one row per country, keeping the most-recent/worst entry.
-- Window functions aggregate article counts and last-seen timestamps across all
-- events for the same country before the DISTINCT ON picks the representative row.

with events as (
    select * from {{ ref('int_conflict_events_unioned') }}
),

aggregated as (
    select
        source,
        country_code,
        country,
        region,
        severity,
        tone_score,
        ingested_at,
        sum(article_count) over (partition by country_code) as total_article_count,
        max(ingested_at)   over (partition by country_code) as last_seen_at
    from events
),

deduped as (
    select distinct on (country_code)
        source,
        country_code,
        country,
        region,
        severity,
        tone_score,
        total_article_count,
        last_seen_at
    from aggregated
    -- Worst severity first, then most recent
    order by
        country_code,
        case severity
            when 'critical' then 1
            when 'high'     then 2
            when 'medium'   then 3
            else 4
        end,
        ingested_at desc
)

select * from deduped
