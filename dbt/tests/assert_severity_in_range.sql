-- Fails if any staging GDELT event has a severity value outside the allowed set.

select event_id, severity
from {{ ref('stg_gdelt_events') }}
where severity not in ('low', 'medium', 'high', 'critical')
