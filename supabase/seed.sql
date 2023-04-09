--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at) VALUES ('00000000-0000-0000-0000-000000000000', 'bf3cdbbc-4356-4f10-a443-cc253323c58c', 'authenticated', 'authenticated', 'jhoan.franco@correounivalle.edu.co', '', '2023-01-24 06:48:11.0775+00', NULL, '', NULL, '', NULL, '', '', NULL, '2023-01-28 18:35:12.31379+00', '{"provider": "github", "providers": ["github"]}', '{"iss": "https://api.github.com", "sub": "28306808", "name": "Sebastian Franco - Devops Engineer", "email": "jhoan.franco@correounivalle.edu.co", "full_name": "Sebastian Franco - Devops Engineer", "user_name": "jhonsfran1165", "avatar_url": "https://avatars.githubusercontent.com/u/28306808?v=4", "provider_id": "28306808", "email_verified": true, "preferred_username": "jhonsfran1165"}', NULL, '2023-01-24 06:48:11.067899+00', '2023-01-28 23:08:56.037867+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL);
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at) VALUES ('00000000-0000-0000-0000-000000000000', '40d67225-772d-49db-951c-ead06b10f19e', 'authenticated', 'authenticated', 'jhonsfran@gmail.com', '$2a$10$FfF8r73zzfsZ3oD.4Lz4Q.d/PrnblkNRHbkjjp.mOY2IBsysHmw9W', '2023-02-06 06:24:08.07047+00', NULL, '', NULL, '', NULL, '', '', NULL, '2023-03-25 16:06:03.515122+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2023-02-06 06:24:08.05345+00', '2023-03-25 18:05:15.224231+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES ('28306808', 'bf3cdbbc-4356-4f10-a443-cc253323c58c', '{"iss": "https://api.github.com", "sub": "28306808", "name": "Sebastian Franco - Devops Engineer", "email": "jhoan.franco@correounivalle.edu.co", "full_name": "Sebastian Franco - Devops Engineer", "user_name": "jhonsfran1165", "avatar_url": "https://avatars.githubusercontent.com/u/28306808?v=4", "provider_id": "28306808", "email_verified": true, "preferred_username": "jhonsfran1165"}', 'github', '2023-01-24 06:48:11.073732+00', '2023-01-24 06:48:11.07377+00', '2023-01-28 18:35:12.305339+00');
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES ('40d67225-772d-49db-951c-ead06b10f19e', '40d67225-772d-49db-951c-ead06b10f19e', '{"sub": "40d67225-772d-49db-951c-ead06b10f19e"}', 'email', '2023-02-06 06:24:08.066656+00', '2023-02-06 06:24:08.066705+00', '2023-02-06 06:24:08.066711+00');

--
-- Data for Name: organization; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.organization (id, created_at, updated_at, name, slug, image, type) VALUES (2, '2023-03-18 18:00:15+00', '2023-03-18 19:00:15', 'prueba org2', 'prueba-org-2', NULL, 'personal');
INSERT INTO public.organization (id, created_at, updated_at, name, slug, image, type) VALUES (1, '2023-01-24 06:47:35+00', '2023-01-24 07:47:35', 'bigbang', 'bigbang', NULL, 'personal');
INSERT INTO public.organization (id, created_at, updated_at, name, slug, image, type) VALUES (3, '2023-03-25 18:11:54.95367+00', '2023-03-25 18:11:54.95367', 'asdasd as', 'asdasd-as', 'https://github.com/shadcn.png', 'personal');
INSERT INTO public.organization (id, created_at, updated_at, name, slug, image, type) VALUES (7, '2023-03-25 18:13:34.382993+00', '2023-03-25 18:13:34.382993', 'asdaasd q q', 'asdasd-as-asd', 'https://github.com/shadcn.png', 'personal');
INSERT INTO public.organization (id, created_at, updated_at, name, slug, image, type) VALUES (9, '2023-03-25 18:17:46.880602+00', '2023-03-25 18:17:46.880602', 'dasdasdasddas', 'dasdasdasddas', 'https://github.com/shadcn.png', 'bussiness');
INSERT INTO public.organization (id, created_at, updated_at, name, slug, image, type) VALUES (10, '2023-03-25 18:22:01.511765+00', '2023-03-25 18:22:01.511765', 'jhonsfran', 'jhonsfran', 'https://github.com/shadcn.png', 'bussiness');


--
-- Data for Name: profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.profile (id, created_at, updated_at, username, full_name, avatar_url) VALUES ('40d67225-772d-49db-951c-ead06b10f19e', '2023-01-24 06:48:32+00', '2023-01-24 07:48:32', 'jhonsfran', 'jhoan franco', NULL);


--
-- Data for Name: organization_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.organization_profiles (id, created_at, updated_at, role, profile_id, org_id, is_default) VALUES (1, '2023-03-19 18:24:57+00', '2023-03-19 18:24:57+00', 'owner', '40d67225-772d-49db-951c-ead06b10f19e', 1, true);
INSERT INTO public.organization_profiles (id, created_at, updated_at, role, profile_id, org_id, is_default) VALUES (2, '2023-03-19 18:45:41+00', '2023-03-19 18:45:41+00', 'owner', '40d67225-772d-49db-951c-ead06b10f19e', 2, false);
INSERT INTO public.organization_profiles (id, created_at, updated_at, role, profile_id, org_id, is_default) VALUES (3, '2023-03-25 18:22:01.525391+00', '2023-03-25 18:22:01.525391+00', 'owner', '40d67225-772d-49db-951c-ead06b10f19e', 10, false);


--
-- Data for Name: project; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.project (id, logo, name, created_at, updated_at, custom_domain, subdomain, org_id, slug) VALUES (1, NULL, 'site 1 - asdasdasdasd', '2023-01-24 06:48:50+00', '2023-01-24 07:48:50+00', 'jhoan.com', 'site1', 1, 'site1');
INSERT INTO public.project (id, logo, name, created_at, updated_at, custom_domain, subdomain, org_id, slug) VALUES (2, NULL, 'site 2 - asdasdasdasd', '2023-01-24 06:49:34+00', '2023-01-24 07:49:34+00', 'jhoan2.com', 'site2', 1, 'site2');


--
-- Data for Name: page; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.page (id, created_at, title, description, content, image_url, published, org_id, project_id, slug) VALUES (3, '2023-01-24 06:51:07+00', 'page 3', 'eryfgd fgjfhj fgh fghfghfg h', NULL, NULL, false, 1, 2, '90da8e95-906c');
