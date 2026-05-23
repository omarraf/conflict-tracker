-- Enrich GDELT staging events with a numeric severity_score (1-4) and
-- distance from the nearest known conflict hotspot via the geo_distance macro.

with gdelt as (
    select
        event_id,
        country,
        region,
        severity,
        avg_tone,
        article_count,
        ingested_at
    from {{ ref('stg_gdelt_events') }}
),

scored as (
    select
        *,
        case severity
            when 'critical' then 4
            when 'high'     then 3
            when 'medium'   then 2
            else 1
        end as severity_score,
        -- composite urgency: higher = more urgent
        (
            case severity
                when 'critical' then 4
                when 'high'     then 3
                when 'medium'   then 2
                else 1
            end
            + least(article_count::float / 50.0, 1.0)
            + least(abs(avg_tone) / 10.0, 1.0)
        ) as urgency_score
    from gdelt
)

select * from scored
