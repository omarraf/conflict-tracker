with source as (
    select * from {{ source('raw', 'raw_acled_events') }}
),

renamed as (
    select
        id                              as event_id,
        ingested_at,
        event_date,
        country,
        location,
        event_type,
        fatalities,
        raw_payload
    from source
)

select * from renamed
