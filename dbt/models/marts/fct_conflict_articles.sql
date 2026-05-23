-- One row per article, unnested from raw GDELT payloads and joined to the
-- deduped conflict they belong to.

with gdelt as (
    select
        event_id,
        country_code,
        country,
        region,
        severity,
        ingested_at,
        jsonb_array_elements(raw_payload->'articles') as article
    from {{ ref('stg_gdelt_events') }}
),

exploded as (
    select
        event_id,
        country_code,
        country,
        region,
        severity,
        ingested_at,
        article->>'url'     as url,
        article->>'title'   as title,
        article->>'domain'  as domain,
        article->>'seen_at' as seen_at
    from gdelt
    where article->>'url' is not null
      and article->>'url' != ''
)

select * from exploded
