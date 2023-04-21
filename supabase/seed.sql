
--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at) VALUES ('00000000-0000-0000-0000-000000000000', '40d67225-772d-49db-951c-ead06b10f19e', 'authenticated', 'authenticated', 'jhonsfran@gmail.com', '$2a$10$FfF8r73zzfsZ3oD.4Lz4Q.d/PrnblkNRHbkjjp.mOY2IBsysHmw9W', '2023-02-06 06:24:08.07047+00', NULL, '', NULL, '', NULL, '', '', NULL, '2023-04-20 14:28:08.486064+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2023-02-06 06:24:08.05345+00', '2023-04-21 10:49:03.981619+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES ('40d67225-772d-49db-951c-ead06b10f19e', '40d67225-772d-49db-951c-ead06b10f19e', '{"sub": "40d67225-772d-49db-951c-ead06b10f19e"}', 'email', '2023-02-06 06:24:08.066656+00', '2023-02-06 06:24:08.066705+00', '2023-02-06 06:24:08.066711+00');

--
-- Data for Name: organization; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.organization (id, created_at, updated_at, name, slug, image, type, description, stripe_id) VALUES (1, '2023-04-08 19:12:07.80963+00', '2023-04-08 19:12:07.80963', 'bigbang', 'bigbang', 'https://res.cloudinary.com/dadxtc8yf/image/upload/v1680981124/test/h8gvokeoqceajcsrzevg.jpg', 'startup', 'Esta es la primera organizacion.', 'cus_Nj0TFdcKP9GjNr');
INSERT INTO public.organization (id, created_at, updated_at, name, slug, image, type, description, stripe_id) VALUES (7, '2023-04-09 20:03:40.625764+00', '2023-04-09 20:03:40.625764', 'jhonsfran', 'jhonsfran', 'https://avatar.vercel.sh/jhonsfran', 'personal', 'mucho capo papi', NULL);

--
-- Data for Name: organization_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.organization_profiles (id, created_at, updated_at, role, profile_id, org_id, is_default) VALUES (7, '2023-04-09 20:03:40.640325+00', '2023-04-09 20:03:40.640325+00', 'owner', '40d67225-772d-49db-951c-ead06b10f19e', 7, false);
INSERT INTO public.organization_profiles (id, created_at, updated_at, role, profile_id, org_id, is_default) VALUES (1, '2023-04-08 19:12:07.833558+00', '2023-04-08 19:12:07.833558+00', 'owner', '40d67225-772d-49db-951c-ead06b10f19e', 1, true);


--
-- Data for Name: organization_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.organization_subscriptions (id, status, metadata, price_id, quantity, cancel_at_period_end, currency, created, current_period_start, current_period_end, ended_at, cancel_at, canceled_at, trial_start, trial_end, org_id, "interval", interval_count) VALUES ('sub_1MxZhrD66VcNFN5vKs86aLIs', 'active', '{"orgId": "1", "userIdMakePayment": "40d67225-772d-49db-951c-ead06b10f19e"}', 'price_1MBbPRD66VcNFN5v3Hdoxmu8', 1, false, 'usd', '2023-04-16 17:19:43+00', '2023-04-16 17:19:43+00', '2023-05-16 17:19:43+00', NULL, NULL, NULL, NULL, NULL, 1, 'month', 1);


--
-- Data for Name: project; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.project (id, logo, name, created_at, updated_at, custom_domain, subdomain, org_id, slug, description) VALUES (1, NULL, 'testing', '2023-04-19 16:05:55+00', '2023-04-19 16:05:55+00', NULL, 'pongaler.com', 1, 'pongale', 'asdasd asd asdas das das dasd asd asdas dasdasdasd asd asdasd as das d');

