-- Migration: Fix Class Schedule Instructor IDs
-- This script uses backup_users to map old IDs to new UUIDs and updates the classes.schedule JSONB column

DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Check if backup_users exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_users') THEN
        RAISE NOTICE 'Skipping fix: backup_users table not found. Please ensure backup was taken before migration.';
        RETURN;
    END IF;

    RAISE NOTICE 'Starting Class Schedule fix...';

    -- 1. Create temporary mapping from backup
    CREATE TEMP TABLE temp_user_mapping AS
    SELECT 
        b.id as old_id,
        u.id::text as new_id
    FROM backup_users b
    JOIN users u ON b.email = u.email
    WHERE b.id != u.id::text; -- Only map changed IDs

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Found % ID mappings to process.', affected_rows;

    -- 2. Update classes using a CTE to reconstruct the JSONB array
    WITH exploded_items AS (
        -- Break down the schedule array for each class
        SELECT 
            c.id as class_id, 
            item.value as item_data,
            item.ordinality as item_idx
        FROM 
            classes c,
            jsonb_array_elements(c.schedule) WITH ORDINALITY as item
    ),
    fixed_items AS (
        -- For each item, fix the instructorIds array
        SELECT 
            ei.class_id,
            ei.item_idx,
            CASE 
                -- Only process if instructorIds is present and is an array
                WHEN jsonb_typeof(ei.item_data->'instructorIds') = 'array' THEN
                    jsonb_set(
                        ei.item_data, 
                        '{instructorIds}',
                        COALESCE(
                            (
                                SELECT jsonb_agg(COALESCE(m.new_id, old_id_val))
                                FROM jsonb_array_elements_text(ei.item_data->'instructorIds') as old_id_val
                                LEFT JOIN temp_user_mapping m ON m.old_id = old_id_val
                            ),
                            '[]'::jsonb
                        )
                    )
                ELSE ei.item_data
            END as new_item_data
        FROM exploded_items ei
    ),
    reconstructed_schedule AS (
        -- Rebuild the schedule array for each class
        SELECT 
            class_id,
            jsonb_agg(new_item_data ORDER BY item_idx) as new_schedule
        FROM fixed_items
        GROUP BY class_id
    )
    -- Perform the update
    UPDATE classes c
    SET schedule = rs.new_schedule
    FROM reconstructed_schedule rs
    WHERE c.id = rs.class_id
    AND c.schedule::text != rs.new_schedule::text; -- Only update if changed

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Updated schedule for % classes.', affected_rows;

    -- Cleanup
    DROP TABLE temp_user_mapping;

END $$;
