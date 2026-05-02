CREATE TABLE IF NOT EXISTS profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        text,
  interest_type    text,
  is_circle_member boolean NOT NULL DEFAULT false,
  is_admin         boolean NOT NULL DEFAULT false,
  joined_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_developments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  development_id   uuid NOT NULL REFERENCES developments(id) ON DELETE CASCADE,
  saved_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, development_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_developments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own saved developments"
  ON saved_developments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save developments"
  ON saved_developments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave developments"
  ON saved_developments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to profiles"
  ON profiles FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to saved"
  ON saved_developments FOR ALL USING (auth.role() = 'service_role');
