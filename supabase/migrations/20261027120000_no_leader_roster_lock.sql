-- Leaders no longer lock or unlock their own roster: once a crew is accepted it can't be joined anyway, and a
-- self-locked crew only confused people. Organisers still lock/unlock any crew from /admin → Crews.

drop function public.set_roster_locked(boolean);
