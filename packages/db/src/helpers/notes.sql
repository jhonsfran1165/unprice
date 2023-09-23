



CREATE OR REPLACE FUNCTION debug_update_tenant_data(tenantId text, projectId text)
RETURNS void AS $$
DECLARE
    table_record RECORD;
    sql_statement text;
BEGIN
    -- Loop through all tables in the public schema
    FOR table_record IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        -- Check if the table has columns named "tenantID" and "projectId"
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = table_record.tablename -- Cast tablename as text
            AND column_name = 'tenant_id'
            AND EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = table_record.tablename -- Cast tablename as text
                AND column_name = 'project_id'
            )
        ) THEN
            -- Construct the SQL statement without executing it
            sql_statement := 'UPDATE "' || table_record.tablename || '" SET tenant_id = "' || tenantId|| '" WHERE tenant_id = "' || tenantId || '" AND project_id = "' || projectId || '"';
            select custom_exception(sql_statement::text); -- Print the SQL statement for debugging
        --ELSE
            -- Print a message if the table doesn't have tenantID or projectId
            --RAISE NOTICE 'Table % does not have tenantID or projectId', table_record.tablename;
            --select custom_exception(table_record.tablename::text);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION custom_exception(message text) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
    AS $$
    BEGIN
      RAISE INFO USING
        HINT = 'Please check users permissions',
        MESSAGE = message,
        DETAIL = 'this execption is raise from no_owner_exception()',
        ERRCODE = '10000';
    END;
$$;



CREATE OR REPLACE FUNCTION update_tenant(tenantId text, projectId text)
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
            select custom_exception('UPDATE ' || table_record.tablename || ' SET tenant_id = ' || quote_literal(tenantId) || ' WHERE tenant_id = ' || quote_literal(tenantId) || ' AND project_id = ' || quote_literal(projectId));
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;