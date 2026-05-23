with source as (
    select * from {{ source('raw', 'raw_gdelt_events') }}
),

renamed as (
    select
        id                              as event_id,
        ingested_at,
        country_code,
        country,
        region,
        severity,
        avg_tone,
        article_count,
        raw_payload
    from source
)

select * from renamed
