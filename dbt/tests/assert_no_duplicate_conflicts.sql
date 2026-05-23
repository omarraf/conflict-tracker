-- Fails if fct_conflicts has more than one row per country_code.
-- A duplicate means int_conflict_deduped didn't work correctly.

select
    country_code,
    count(*) as row_count
from {{ ref('fct_conflicts') }}
group by country_code
having count(*) > 1
