with source as (
    select * from {{ source('raw', 'raw_rss_articles') }}
),

renamed as (
    select
        id                              as article_id,
        ingested_at,
        published_at,
        title,
        url,
        source_feed,
        raw_payload
    from source
)

select * from renamed
