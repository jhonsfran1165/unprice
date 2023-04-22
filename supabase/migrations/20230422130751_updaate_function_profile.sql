set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_profile_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN

  IF new.raw_user_meta_data->>'username' IS NOT NULL THEN
    insert into public.profile (id, username, full_name, avatar_url)
    values (
      new.id,
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'avatar_url'
    );
  ELSE
    insert into public.profile (id, username, full_name, avatar_url)
    values (new.id, new.email, new.email, null);
  END IF;

  return new;

END;
$function$
;


