-- CRITICAL SECURITY FIX
--
-- The original UPDATE policy on `profiles` (004_profiles.sql) was:
--     USING (auth.uid() = id)
-- with no WITH CHECK and no column restriction. That means any authenticated
-- user can call PATCH /rest/v1/profiles?id=eq.<their_uid> using the public anon
-- key and set is_admin=true, member_status='approved', or is_circle_member=true
-- on their own row — a complete privilege-escalation bypass of the admin and
-- member-approval gates.
--
-- Supabase RLS does not natively support column-level restrictions on UPDATE,
-- so we enforce protection via a BEFORE UPDATE trigger that resets the
-- protected columns back to their OLD values unless the caller is the
-- service_role (server-side admin via supabaseAdmin).

CREATE OR REPLACE FUNCTION public.protect_profile_admin_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Service role (server-side via supabaseAdmin) can change anything.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- For everyone else, revert privilege-bearing columns to their previous
  -- values. We do NOT protect interest_type or full_name — those are
  -- legitimately editable by users during signup/profile update.
  -- We DO protect id and joined_at as defence in depth.
  NEW.is_admin         := OLD.is_admin;
  NEW.is_circle_member := OLD.is_circle_member;
  NEW.member_status    := OLD.member_status;
  NEW.id               := OLD.id;
  NEW.joined_at        := OLD.joined_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS protect_profile_admin_columns_trg ON profiles;

CREATE TRIGGER protect_profile_admin_columns_trg
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_admin_columns();
