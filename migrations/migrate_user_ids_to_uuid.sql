-- Migration: Update old short IDs to proper UUIDs
-- This script updates users with old short IDs to use proper UUIDs

-- Step 1: Create a temporary mapping table
DROP TABLE IF EXISTS id_mapping;
CREATE TEMP TABLE id_mapping (
    old_id TEXT,
    new_id UUID DEFAULT uuid_generate_v4()
);

-- Step 2: Insert old IDs that need to be updated (short IDs, not UUIDs)
INSERT INTO id_mapping (old_id)
SELECT id FROM public.users 
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Check how many IDs need updating
SELECT 'Users to update: ' || COUNT(*) as info FROM id_mapping;

-- Step 3: Update all tables that reference users.id

-- Update question_approvers (columns are UUID type)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_approvers') THEN
        UPDATE public.question_approvers qa
        SET user_id = m.new_id
        FROM id_mapping m
        WHERE qa.user_id::text = m.old_id;

        UPDATE public.question_approvers qa
        SET assigned_by = m.new_id
        FROM id_mapping m
        WHERE qa.assigned_by::text = m.old_id;
    END IF;
END $$;

-- Update questions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') THEN
        UPDATE public.questions q
        SET created_by = m.new_id
        FROM id_mapping m
        WHERE q.created_by::text = m.old_id;

        UPDATE public.questions q
        SET reviewer_id = m.new_id
        FROM id_mapping m
        WHERE q.reviewer_id::text = m.old_id;
    END IF;
END $$;

-- Update question_reviews
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_reviews') THEN
        UPDATE public.question_reviews qr
        SET reviewer_id = m.new_id
        FROM id_mapping m
        WHERE qr.reviewer_id::text = m.old_id;
    END IF;
END $$;

-- Update class_photos
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_photos') THEN
        UPDATE public.class_photos cp
        SET uploaded_by = m.new_id
        FROM id_mapping m
        WHERE cp.uploaded_by::text = m.old_id;
    END IF;
END $$;

-- Update tasks (columns are TEXT type)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        UPDATE public.tasks t
        SET creator_id = m.new_id::text
        FROM id_mapping m
        WHERE t.creator_id = m.old_id;

        UPDATE public.tasks t
        SET assignee_id = m.new_id::text
        FROM id_mapping m
        WHERE t.assignee_id = m.old_id;
    END IF;
END $$;

-- Update notifications (columns are TEXT type)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        UPDATE public.notifications n
        SET user_id = m.new_id::text
        FROM id_mapping m
        WHERE n.user_id = m.old_id;
    END IF;
END $$;

-- Update swap_requests
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'swap_requests') THEN
        UPDATE public.swap_requests sr
        SET requester_id = m.new_id::text
        FROM id_mapping m
        WHERE sr.requester_id = m.old_id;

        UPDATE public.swap_requests sr
        SET target_instructor_id = m.new_id::text
        FROM id_mapping m
        WHERE sr.target_instructor_id = m.old_id;
    END IF;
END $$;

-- Update payments (columns are TEXT type)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        UPDATE public.payments p
        SET instructor_id = m.new_id::text
        FROM id_mapping m
        WHERE p.instructor_id = m.old_id;

        UPDATE public.payments p
        SET paid_by = m.new_id::text
        FROM id_mapping m
        WHERE p.paid_by = m.old_id;
    END IF;
END $$;

-- Update firefighter_logs (columns are TEXT type)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'firefighter_logs') THEN
        UPDATE public.firefighter_logs fl
        SET user_id = m.new_id::text
        FROM id_mapping m
        WHERE fl.user_id = m.old_id;
    END IF;
END $$;

-- Update attendance_logs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance_logs') THEN
        UPDATE public.attendance_logs al
        SET taken_by_id = m.new_id::text
        FROM id_mapping m
        WHERE al.taken_by_id = m.old_id;
    END IF;
END $$;

-- Update grade_logs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grade_logs') THEN
        UPDATE public.grade_logs gl
        SET user_id = m.new_id::text
        FROM id_mapping m
        WHERE gl.user_id = m.old_id;
    END IF;
END $$;

-- Update checklist_logs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checklist_logs') THEN
        UPDATE public.checklist_logs cl
        SET user_id = m.new_id::text
        FROM id_mapping m
        WHERE cl.user_id = m.old_id;
    END IF;
END $$;

-- Update folders
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'folders') THEN
        UPDATE public.folders f
        SET created_by = m.new_id::text
        FROM id_mapping m
        WHERE f.created_by = m.old_id;
    END IF;
END $$;

-- Update documents
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
        UPDATE public.documents d
        SET uploaded_by = m.new_id::text
        FROM id_mapping m
        WHERE d.uploaded_by = m.old_id;
    END IF;
END $$;

-- Update setup_teardown_assignments
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'setup_teardown_assignments') THEN
        UPDATE public.setup_teardown_assignments sta
        SET instructor_id = m.new_id::text
        FROM id_mapping m
        WHERE sta.instructor_id = m.old_id;
    END IF;
END $$;

-- Step 4: Finally, update the users table itself
UPDATE public.users u
SET id = m.new_id::text
FROM id_mapping m
WHERE u.id = m.old_id;

-- Step 5: Show results
SELECT 'Migration completed! Updated ' || COUNT(*) || ' user IDs.' as result FROM id_mapping;

-- Cleanup
DROP TABLE IF EXISTS id_mapping;
