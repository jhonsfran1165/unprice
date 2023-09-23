-- Custom SQL migration file, put you code below! --

-- create tenant update
CREATE OR REPLACE FUNCTION update_tenant(oldTenantId text, newTenantId text, projectId text)
RETURNS void AS $$
DECLARE
    table_record RECORD;
BEGIN
    -- Loop through all tables in the public schema
    FOR table_record IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        -- Check if the table has columns named "tenant_id" and "project_id"
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = table_record.tablename::text
            AND column_name = 'tenant_id'
            AND EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = table_record.tablename::text
                AND column_name = 'project_id'
            )
        ) THEN
            -- Update the table with the given tenant_id and project_id if both match
            EXECUTE 'UPDATE ' || table_record.tablename || ' SET tenant_id = $1 WHERE tenant_id = $2 AND project_id = $3' USING newTenantId, oldTenantId, projectId;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
