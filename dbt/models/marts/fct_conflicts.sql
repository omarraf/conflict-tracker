-- One row per country representing its current conflict state.
-- This mart is the source of truth for auto-ingested conflicts;
-- curated conflicts remain in the raw `conflicts` table.

with deduped as (
    select * from {{ ref('int_conflict_deduped') }}
),

fct as (
    select
        country_code || '-auto'             as id,
        'Conflict Events in ' || country    as name,
        region,
        country,
        array[country]::jsonb               as countries,
        severity,
        tone_score,
        total_article_count                 as article_count,
        last_seen_at                        as updated_at,
        current_timestamp                   as created_at
    from deduped
)

select * from fct
