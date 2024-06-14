-- first connect to neon with:  psql -h pg.neon.tech

DO $$
DECLARE
    table_record RECORD;
    policy_record RECORD;
BEGIN
    -- Get all tables in the public schema
    FOR table_record IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        -- Get all policies on the current table
        FOR policy_record IN (SELECT policyname FROM pg_policies WHERE tablename = table_record.tablename)
        LOOP
            -- Check if the policy exists and then drop it
            BEGIN
                EXECUTE 'DROP POLICY "' || policy_record.policyname || '" ON ' || table_record.tablename;
            EXCEPTION
                WHEN OTHERS THEN
                    -- Policy does not exist, continue to the next one
                    CONTINUE;
            END;
        END LOOP;
    END LOOP;
END $$;
