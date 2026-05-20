-- Add member_status to profiles for admin approval workflow.
-- New signups default to 'pending' and require admin approval before
-- accessing the member portal. Admins can approve or reject from /admin/members.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_status text NOT NULL DEFAULT 'pending'
  CHECK (member_status IN ('pending', 'approved', 'rejected'));

-- Auto-approve all existing users so they don't lose access.
UPDATE profiles SET member_status = 'approved' WHERE member_status = 'pending';
