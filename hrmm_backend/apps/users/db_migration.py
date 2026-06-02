"""Helpers for migrations that include PostgreSQL-only SQL."""


def run_on_postgresql(schema_editor, sql):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(sql)


def forwards_postgres_sql(sql):
    def forward(apps, schema_editor):
        run_on_postgresql(schema_editor, sql)

    return forward
