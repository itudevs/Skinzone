-- Create trigger to automatically delete auth user when User record is deleted
-- This ensures referential integrity between User table and auth.users

CREATE OR REPLACE FUNCTION delete_user_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the corresponding auth user
  -- auth.users is managed by Supabase, but we can use the extension function
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger on the User table
DROP TRIGGER IF EXISTS on_user_delete ON "User";
CREATE TRIGGER on_user_delete
BEFORE DELETE ON "User"
FOR EACH ROW
EXECUTE FUNCTION delete_user_trigger();
