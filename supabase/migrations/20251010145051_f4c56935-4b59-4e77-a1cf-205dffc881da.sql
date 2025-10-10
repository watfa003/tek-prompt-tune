-- Fix search_path security warning by updating auto_cleanup_old_data function
CREATE OR REPLACE FUNCTION auto_cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
  retention_days INTEGER;
  cutoff_date TIMESTAMP WITH TIME ZONE;
  deleted_count INTEGER;
BEGIN
  -- Loop through all users with their retention settings
  FOR user_record IN 
    SELECT DISTINCT u.id as user_id, COALESCE(us.data_retention_days, 30) as retention_days
    FROM auth.users u
    LEFT JOIN public.user_settings us ON us.user_id = u.id
  LOOP
    retention_days := user_record.retention_days;
    
    -- Skip if retention is set to forever (-1)
    IF retention_days = -1 THEN
      CONTINUE;
    END IF;
    
    -- Calculate cutoff date
    cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;
    
    -- Delete old prompts
    DELETE FROM public.prompts
    WHERE user_id = user_record.user_id
      AND created_at < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE 'Deleted % old prompts for user %', deleted_count, user_record.user_id;
    END IF;
    
    -- Delete old optimization history
    DELETE FROM public.optimization_history
    WHERE user_id = user_record.user_id
      AND created_at < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE 'Deleted % old optimization_history for user %', deleted_count, user_record.user_id;
    END IF;
    
    -- Delete old speed optimizations
    DELETE FROM public.speed_optimizations
    WHERE user_id = user_record.user_id
      AND created_at < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE 'Deleted % old speed_optimizations for user %', deleted_count, user_record.user_id;
    END IF;
    
    -- Delete old chat messages (before sessions due to FK)
    DELETE FROM public.chat_messages
    WHERE user_id = user_record.user_id
      AND created_at < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE 'Deleted % old chat_messages for user %', deleted_count, user_record.user_id;
    END IF;
    
    -- Delete old chat sessions
    DELETE FROM public.chat_sessions
    WHERE user_id = user_record.user_id
      AND created_at < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE 'Deleted % old chat_sessions for user %', deleted_count, user_record.user_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Auto cleanup completed successfully';
END;
$$;