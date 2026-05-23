{% macro geo_distance(lat1, lon1, lat2, lon2) %}
    (
        2 * 6371.0 * asin(
            sqrt(
                  power(sin(radians(({{ lat2 }} - {{ lat1 }}) / 2.0)), 2)
                + cos(radians({{ lat1 }}))
                * cos(radians({{ lat2 }}))
                * power(sin(radians(({{ lon2 }} - {{ lon1 }}) / 2.0)), 2)
            )
        )
    )
{% endmacro %}
