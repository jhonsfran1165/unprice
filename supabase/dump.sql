--
-- PostgreSQL database dump
--

-- Dumped from database version 14.5 (Debian 14.5-2.pgdg110+2)
-- Dumped by pg_dump version 14.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: tenants; Type: TABLE DATA; Schema: _realtime; Owner: postgres
--

INSERT INTO _realtime.tenants (id, name, external_id, jwt_secret, max_concurrent_users, inserted_at, updated_at, max_events_per_second, postgres_cdc_default, max_bytes_per_second, max_channels_per_client, max_joins_per_second) VALUES ('5609d143-c028-4fb1-9aad-9cd7839c6c3e', 'realtime-dev', 'realtime-dev', 'iNjicxc4+llvc9wovDvqymwfnj9teWMlyOIbJ8Fh6j2WNU8CIJ2ZgjR6MUIKqSmeDmvpsKLsZ9jgXJmQPpwL8w==', 200, '2023-04-12 16:16:21', '2023-04-12 16:16:21', 100, 'postgres_cdc_rls', 100000, 100, 500);


--
-- Data for Name: extensions; Type: TABLE DATA; Schema: _realtime; Owner: postgres
--

INSERT INTO _realtime.extensions (id, type, settings, tenant_external_id, inserted_at, updated_at) VALUES ('5bdc7913-e8af-4a77-9644-133648a9bfc1', 'postgres_cdc_rls', '{"region": "us-east-1", "db_host": "/LHY90vDQQ39bJHBhWgA2Rz6RVC1hOv3fpTUQMq9vZ0=", "db_name": "sWBpZNdjggEPTQVlI52Zfw==", "db_port": "+enMDFi1J/3IrrquHHwUmA==", "db_user": "uxbEq/zz8DXVD53TOI1zmw==", "slot_name": "supabase_realtime_replication_slot", "ip_version": 4, "db_password": "sWBpZNdjggEPTQVlI52Zfw==", "publication": "supabase_realtime", "poll_interval_ms": 100, "poll_max_changes": 100, "poll_max_record_bytes": 1048576}', 'realtime-dev', '2023-04-12 16:16:21', '2023-04-12 16:16:21');


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: _realtime; Owner: postgres
--

INSERT INTO _realtime.schema_migrations (version, inserted_at) VALUES (20210706140551, '2023-03-16 02:25:35');
INSERT INTO _realtime.schema_migrations (version, inserted_at) VALUES (20220329161857, '2023-03-16 02:25:35');
INSERT INTO _realtime.schema_migrations (version, inserted_at) VALUES (20220410212326, '2023-03-16 02:25:35');
INSERT INTO _realtime.schema_migrations (version, inserted_at) VALUES (20220506102948, '2023-03-16 02:25:35');
INSERT INTO _realtime.schema_migrations (version, inserted_at) VALUES (20220527210857, '2023-03-16 02:25:36');
INSERT INTO _realtime.schema_migrations (version, inserted_at) VALUES (20220815211129, '2023-03-16 02:25:36');
INSERT INTO _realtime.schema_migrations (version, inserted_at) VALUES (20220815215024, '2023-03-16 02:25:36');
INSERT INTO _realtime.schema_migrations (version, inserted_at) VALUES (20220818141501, '2023-03-16 02:25:36');
INSERT INTO _realtime.schema_migrations (version, inserted_at) VALUES (20221018173709, '2023-03-16 02:25:36');
INSERT INTO _realtime.schema_migrations (version, inserted_at) VALUES (20221102172703, '2023-03-16 02:25:36');
INSERT INTO _realtime.schema_migrations (version, inserted_at) VALUES (20221223010058, '2023-03-16 02:25:36');
INSERT INTO _realtime.schema_migrations (version, inserted_at) VALUES (20230110180046, '2023-03-16 02:25:36');


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'b86a4d55-7742-44ea-a1cc-694e2095dca2', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-08 18:18:58.852328+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '0038879b-a966-4719-afed-07ee72b35a3f', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-08 19:11:33.506051+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'b54d0772-ad3b-4f35-b0c7-fb6ab7079a48', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-08 20:11:05.441416+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'b411df77-9b2c-46d7-9f4d-a45bf6187258', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-08 20:11:05.441958+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '7cd02d3a-5cc3-4262-8bf2-c17d6f7587f6', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-08 21:10:36.30948+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '997c3f29-8983-44e2-940c-8c83ea42ed4f', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-08 21:10:36.313774+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'ad7846fc-3364-4404-98fa-2edfe445b859', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-09 08:20:48.787566+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '43e0b64d-348d-4db9-9e55-8e279e9755e4', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-09 08:20:48.789208+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '808a97f3-020e-4297-a629-4d7bc95040e4', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-09 08:21:25.018246+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '22f27dc6-ccdf-480c-8ee7-608867d3fdb8', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-09 10:25:52.555676+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '262f677b-833f-4693-a23d-1cf2397cd152', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-09 10:25:52.560056+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'adf34d99-bdb5-438f-97be-d6856c259321', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-09 10:25:52.569453+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '2afc1575-ebdc-4509-a9a5-40e76535d956', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-09 10:25:52.570992+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '09be15d0-29eb-4175-9555-dc2c312236e6', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-09 11:55:23.680915+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'd1721baf-c07e-4f40-a61c-4456bfb059a9', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-09 11:55:23.698469+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'd95d2eaf-dc36-40a1-8f45-3d354a671248', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-09 15:32:45.84814+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '463ba4b3-a495-41bc-b291-ddc7c3d11d3a', '{"action":"logout","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account"}', '2023-04-09 15:43:38.96963+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'f3517c8f-98b7-4cb2-9327-b8d05fc6dd89', '{"action":"user_repeated_signup","actor_id":"bf3cdbbc-4356-4f10-a443-cc253323c58c","actor_name":"Sebastian Franco - Devops Engineer","actor_username":"jhoan.franco@correounivalle.edu.co","log_type":"user","traits":{"provider":"email"}}', '2023-04-09 15:44:08.862286+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '2c02a039-7144-499f-8d5f-d0288732d8c0', '{"action":"user_signedup","actor_id":"cf7c87f6-b055-4f90-a496-de2a688ab1ec","actor_username":"jhoan.franco@correounivalle.edu.co","log_type":"team","traits":{"provider":"email"}}', '2023-04-09 16:15:48.646513+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '0d1422d1-b5a1-4792-95b0-e5786409fc5e', '{"action":"login","actor_id":"cf7c87f6-b055-4f90-a496-de2a688ab1ec","actor_username":"jhoan.franco@correounivalle.edu.co","log_type":"account","traits":{"provider":"email"}}', '2023-04-09 16:15:48.652888+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'ff0cac84-3817-4993-a717-632f35b71779', '{"action":"token_refreshed","actor_id":"cf7c87f6-b055-4f90-a496-de2a688ab1ec","actor_username":"jhoan.franco@correounivalle.edu.co","log_type":"token"}', '2023-04-09 18:11:04.928626+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '27e11181-b261-4dd5-aad3-1f1afbe79414', '{"action":"token_revoked","actor_id":"cf7c87f6-b055-4f90-a496-de2a688ab1ec","actor_username":"jhoan.franco@correounivalle.edu.co","log_type":"token"}', '2023-04-09 18:11:04.966834+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '7f4bca47-134c-4ad8-903a-69ef0459eae0', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-09 18:12:51.876862+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'c0193b9d-b1f6-4998-84e2-a9d4574e97e3', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-09 19:34:36.662331+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '12a8d15d-a8ba-4008-8142-c6f76537fc9d', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-09 19:34:36.662092+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '05a74c05-fbd7-4262-960c-6819b8b4949c', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-09 19:34:36.666076+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '4c05aebc-baf1-4cc1-8e2f-2d336c259bec', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-09 19:34:36.665247+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '38695ce7-b993-4ed9-ba9d-65019f42b637', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-09 19:34:36.730236+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '53aec572-2375-48a0-87b1-cd4cb02f2a53', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-09 19:34:36.733924+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'c1dd2c59-ad66-44c6-98b9-ed71c866920f', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-09 19:34:49.281958+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'c82f5c61-d246-48e2-8796-ecfe720852c6', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-10 08:32:04.289302+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '950c6bd2-b552-48e9-9592-9234e46e9ffd', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-10 08:32:04.291093+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '08c55039-260e-4a60-b89a-638cb0ab132b', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-10 08:34:25.503454+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '6db3cce7-af78-48a9-aed9-3b885a261697', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-10 11:02:39.09944+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'a55d9471-1d9d-443f-b5a2-b84116f86395', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-10 11:02:39.102738+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'bcf6404c-a5fa-4f0b-a26e-7bfb8cff5834', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-10 11:02:39.110179+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '1d0c21d9-588f-48ea-981f-4d4b82e4d659', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-11 07:31:02.420369+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'a2a3b399-1a1e-42f0-b615-ce1dc1a114b9', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-11 07:31:02.428338+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'ce3cd00c-9a8a-4e47-b58d-252e802f88ab', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-10 11:02:39.111327+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '7bc5e82c-cce8-4af6-aa38-339dc69f6650', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-10 11:02:39.138499+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '4efb6f72-bc18-42ea-b534-6c7a51646791', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-10 11:02:39.142952+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '637684e0-b5b8-4a39-8b64-816d15704952', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-11 07:31:02.404165+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'd4ea933d-9a81-4972-b27a-3ccd06e0dc0b', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-11 07:31:02.404936+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '0c5ef817-ad62-4682-a509-019f82df93b6', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-11 07:31:02.45682+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'c7e86006-04a6-4949-8f12-50ec829352de', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-11 07:31:02.458186+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '4d0b57ab-3096-4ef9-983c-f5d7a48a77f3', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 12:22:09.709556+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '0c0dbbd4-2b81-49a0-a928-cd15332df53c', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 12:22:09.717587+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '877bd770-a77b-43c0-a9e9-8259f9526668', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-13 12:22:32.651585+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '226359b0-9288-4413-9433-f99711c66cf8', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 13:22:07.581805+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '394dc02a-ccd3-4971-b8aa-71b06ddf5dc1', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 13:22:07.584556+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '467c766f-3191-43c0-b827-9b93629eae83', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 13:22:07.601109+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'c83f025a-64f2-4d9e-a3ea-c14615f04b7d', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 13:22:07.604188+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '968bc3fe-7419-4ea9-aa6a-83c18333f208', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 14:21:37.69537+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'd0a5501d-5494-4503-b0a5-9d80ebccc866', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 14:21:37.696535+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '6767be29-f78a-4953-be5d-134de0ade8ac', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 14:21:37.697508+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '3b0210d2-473c-434e-863d-ffebd621bcba', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 14:21:37.698257+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '35a3b320-7019-4c52-873c-7fd4bddf4dd4', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 14:21:37.706745+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'e6adbbba-ab41-4f53-b2a1-3fa2fb25edfb', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 14:21:37.707805+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'f07898b7-8a7e-44cc-82d0-767082aee6d4', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 15:21:12.462402+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '3c30a33f-11a2-4ee0-a325-f14975c6471c', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 15:21:12.46332+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '898e6a58-b568-4b44-b797-ea1351279c8d', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 21:47:51.554731+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'b56807b7-0b54-4cb8-9d6c-4e484c349974', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-13 21:47:51.555619+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '634c7c74-d617-4a7e-a4e3-b91f7f133590', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 06:54:13.2105+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '35c932dc-999b-4546-a508-1232fa087de2', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 06:54:13.211291+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'e40b3c26-b29c-420e-828e-d4da2afca706', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 06:54:13.212567+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '1fbb701f-cbd8-44f2-909a-d0e2179fd073', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 06:54:13.212828+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'b49bcbda-4a0b-4ae3-b21a-70504615b8ad', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 06:54:13.230874+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '830703fd-c2e8-4497-8330-892ef8968b1b', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 06:54:13.233373+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '997a4d89-3580-41b8-8c70-b72eb8b9f8da', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-14 07:35:45.034536+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'fbf50017-ea14-46ce-a28e-08d188737826', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 08:35:18.42266+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '8b460278-109d-45ca-a08f-c8769d217b32', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 08:35:18.42303+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'c70b9b64-cb53-47ea-857d-878673780cd4', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 08:35:18.42375+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'a7965842-2aab-4b5f-bb7a-ddbff11ba724', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 08:35:18.424533+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '18b9d684-7fe0-43ca-af56-cb8d9807b0c4', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 08:35:18.435367+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'a6f6a60c-6755-479d-9e44-577283b23737', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 08:35:18.435407+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '7bfa29d1-247f-472c-b26d-f197e15f7dff', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 08:35:18.438365+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '0413a107-08e4-4daf-b4f4-09af9cb6a9e0', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 08:35:18.437985+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '90217289-523e-4741-aa92-fb2543711acd', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 09:42:40.150856+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '9a723ee0-8920-4ca1-a5aa-949de6bf4f8c', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 09:42:40.151244+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '1d0503ca-16ba-4f56-a518-335d0e2e273b', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 11:18:44.848756+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '05de5097-62b2-4d27-9733-eecb332d46a9', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 11:18:44.849802+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '7c9f8f38-b79c-4562-9401-666f7f63bbd0', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-14 11:46:36.151686+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '8973941a-72b4-45c1-b897-159bd342c638', '{"action":"logout","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account"}', '2023-04-14 11:47:03.301984+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '48c20e55-3569-4662-9a7d-6fbb87869fed', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-14 14:39:51.790949+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '4df47b42-66f5-4b30-ae69-3e0135ad7aa7', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 15:39:27.132603+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '85d44770-62f3-4166-bd49-773e5ad064a3', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 15:39:27.134453+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '5b5153be-3172-4cf2-aa80-b69a10ff7cf1', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 11:55:17.08929+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '6d81b42d-9a38-4f85-a014-a15ac8912200', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 11:55:17.092083+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '5f05a2c6-f88a-4955-a439-950d29ae8009', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-15 12:05:27.241038+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'de43ad63-75fb-426a-9cad-d54bb76ad476', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 09:42:40.150374+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '59c0be89-0ad6-4575-9bf0-58513c4403f7', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 09:42:40.154069+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '9312291c-ea5d-410e-bd39-cf6bc2e05a63', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 09:42:40.1724+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'a1237a53-d908-4791-98bc-35b8042ee2d1', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 09:42:40.173902+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '5eaf895d-870e-4595-89ae-997fb36730ea', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 09:42:40.176241+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'bbacb137-345c-4f29-9798-92d9084c40ec', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 09:42:40.17744+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '6dba20ed-7535-4519-8dab-20ba084c7a46', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-14 09:42:53.330409+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '4342ce5e-a982-45ea-aa42-6191830ed836', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 11:18:44.850833+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '7ad5c811-b260-42cb-9004-6f916057745c', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-14 11:18:44.851757+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'f6cf67a5-299c-4d73-b221-516c7f403227', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 13:54:37.972752+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '1a9def7d-c09b-4e64-8fae-7fc0b8ade30e', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 13:54:37.973949+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '0ee8a666-ac86-483f-a292-09775a0d41c5', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 13:54:37.975716+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '181da57a-11ed-4a85-882b-447aa513fb83', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 13:54:37.97617+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '6c5a4d18-3b54-4f0b-90a6-9fefa008e758', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 13:54:37.987664+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '4600f46c-6cab-4a6a-8766-097a9daeec12', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 13:54:37.990101+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'c52bf2d2-fc64-47a7-affc-b9197b51e64e', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 13:54:38.003777+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '02eff24b-e205-4e7b-9328-b134bc70401a', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 13:54:38.004041+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'e571364d-8898-44a8-9277-3ed92b224452', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 13:54:38.005643+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'b4110cfe-a7eb-4609-aca7-1bc7ade54949', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 13:54:38.005688+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '20948c80-e6e6-43c4-9fa0-3f44a4449e2e', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-15 13:55:03.020166+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '6d9c20ae-8f3f-45c9-9976-5c57b5522556', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 14:54:39.970897+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '128bbc8b-fef4-4057-985f-c47fbbb060c2', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 14:54:39.972297+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'ac0dc5be-4cc0-4364-b547-a263fea26893', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 15:54:13.891357+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '798a0ffb-f313-4d7f-a350-a9f79577a501', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 15:54:13.89322+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'bb944243-1006-475b-8d96-b70df0ee4a3a', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 16:43:39.837642+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'e272699a-92f0-4cca-9ee8-543b654546a2', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-15 16:43:39.839254+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'bce3e549-ecf6-4250-b856-3c4faef15a49', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-16 15:12:57.918817+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '04782c79-7d07-467d-aeff-963e6c346f3e', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-16 15:12:57.919728+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'b94ae37e-4215-470e-b1b2-e2919e0af9a4', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-16 15:13:22.221283+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '5d6377fc-9ee3-4445-8ba2-a86b13fa9f6a', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-16 16:12:52.077102+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'ec734565-3932-4b5d-8725-d2bfce36d1ce', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-16 16:12:52.078445+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '486c718e-8b94-4a70-8c50-974544e182aa', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-16 17:40:13.052219+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '862e87a9-de89-47f2-8d4d-1fe5e944e781', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-16 17:40:13.053645+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '8a4ca6f9-c1ee-40e7-9ac8-6b5be27c8268', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-16 21:44:09.044179+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '7d8ef9e3-a539-49ed-a3fb-105796827ffe', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-16 21:44:09.04735+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '70f70fc5-9dc7-4e6f-bab4-3c4559f8706e', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-16 21:44:09.051033+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '15b8eacc-c2cb-4531-8eac-9edfe62ebff0', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-16 21:44:09.05348+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '9b866460-21b2-4602-ab61-dd8c16aa3017', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-16 21:44:31.466906+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '63066933-cf56-4b5f-a374-f82f1f54896c', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 06:17:18.41843+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'ce396432-2f12-4298-a2c4-988efae17181', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 06:17:18.420495+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '5666cc33-02de-4c80-96d5-83c6f57566f7', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-17 06:27:01.48747+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '9b973c35-502d-4e52-9003-66d6fde35cb0', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 07:35:18.948339+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '4b4424b3-adde-4a66-8bcb-434a86013865', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 07:35:18.950927+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'e5c40f03-6277-4b43-9498-f9bc02c419e0', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-17 07:35:33.245317+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '60926938-d060-42df-9d75-bdcbe26ef9bd', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 08:35:06.949727+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '9ee0419e-9247-4f55-97b4-c5273b61c0e5', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 08:35:06.951466+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '882b71e6-cbde-47d0-a702-65f1f36a4210', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 09:50:35.27581+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'c747b20c-f2c4-4c18-9b05-b68fd3873369', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 09:50:35.276653+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'b70eb91c-5fe4-44be-a1b1-65bff16cfaa8', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-17 09:51:49.761876+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'cb84fceb-33c2-49be-93c2-1483270865a3', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 11:30:14.233233+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '9cdaa9b3-6c81-4a2a-93c7-63eca21ec136', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 11:30:14.234453+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '9533027a-359c-4998-95b2-a2f972be0476', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 11:30:14.245467+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '06d45e52-350f-4090-a01a-877b88f4fb5b', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 11:30:14.24667+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'd8fdee40-a6d8-42e5-99ad-e3728fc22428', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 07:35:18.948503+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '77e72b78-c035-45b3-9fbd-5dc86a9847ec', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 07:35:18.950376+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'e411044c-72cf-4524-8310-87b788ec7ab6', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 09:50:35.275949+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '193fc3a8-13fa-40ac-b284-4c009b6f6e2b', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 09:50:35.276824+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '2810f9d5-60b8-4d6f-a4a2-f0f2e0678156', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 11:30:14.23337+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '7e05a4b5-1d37-4829-8113-3bfc40376c24', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-17 11:30:14.2345+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '3e7985bf-faa6-485f-b1a6-035a7d7c0502', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-17 11:30:36.086195+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'af0fa070-e247-417b-831f-b90d49c0053a', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-18 10:49:49.773765+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'c1667bf7-e710-47a5-909e-5ac0994fa349', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-18 10:49:49.774915+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'd95dc501-b73d-4020-b7b9-225bfe9f25cc', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-18 10:54:07.899367+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'fa6480b4-1c63-47f8-bca7-81a8aede171f', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-18 11:53:44.999284+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'c126b422-a254-46ac-bdeb-007f31d42919', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-18 11:53:45.000573+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'c31985ea-ff69-4933-af46-dabeee1ce052', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 09:49:35.309257+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '220fb10e-f6a0-4cb5-a866-39d404d359d4', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 09:49:35.309358+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'deb692e1-7a49-4199-9145-f841a114b1b0', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 09:49:35.310449+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '66910bba-3936-4c53-848f-05d69b32a9bf', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 09:49:35.310514+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'd39f787d-d640-41a9-9be5-08dd3d21ac2f', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-19 09:49:50.167608+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'f971feb8-50a1-4d37-b355-6749c9bf1a13', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 10:54:20.275821+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '0150cae9-fb68-4831-8eab-e9938297b070', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 10:54:20.27761+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'd60056c6-9158-47b5-b6d2-3a69d37a37da', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 10:54:20.284272+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '8683d763-1b60-42a8-ae4e-dd3b4a626232', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 10:54:20.285962+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'ce18f4a2-aefc-4494-b026-6154ac6d58e8', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-19 10:58:01.148502+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'f11d8733-1ea6-432a-b565-b6547a12b1d3', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 11:57:39.691488+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '7cbae739-cdac-47b4-a53c-de2c0fe6b5ec', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 11:57:39.692635+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '25cb6158-a47d-441e-9555-e7854ae1ccb8', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 12:57:10.913462+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '62fe8fa6-f165-4c4c-8a56-a0f882edf03e', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 12:57:10.914799+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '351446d8-ef34-4c9c-856b-46eade0a3a2e', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 14:01:56.203683+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '9f858d55-8e0b-4afb-84f5-525d2c42a621', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 14:01:56.204696+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '8fb1a635-b859-4149-8eb3-b71821e2688e', '{"action":"logout","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account"}', '2023-04-19 14:18:01.641424+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '02f4f308-ab2b-4814-9982-20ba8d12177b', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-19 14:44:19.840435+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '623ff8fd-a94a-4b07-80d3-dc505f44676f', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 15:43:56.407598+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '3d9a149d-6922-4808-9033-590c457d87f6', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-19 15:43:56.408691+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '8de5f6b2-1557-46d2-97df-10c6de6768bb', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-20 08:18:00.994216+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'ad16804d-9e55-4bf9-973c-0e4885a5582b', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-20 08:18:00.99526+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'd740ec43-a627-4c5a-be75-6acd49f6bbe3', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-20 08:18:30.929071+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '2631f994-1746-4dba-85d9-cb4b0fd763df', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-20 09:24:20.607435+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '5920be89-d483-407d-b44a-a2002fc2ca76', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-20 09:24:20.608381+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '4d94df5b-ad5d-4a06-9e25-7d9f57bac7ed', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-20 09:24:20.609591+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '104f7947-06ef-4e32-9964-4d07c3633806', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-20 12:16:56.658238+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '8aa2c314-0ecf-4820-b742-fbbe7f9046e6', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-20 13:38:48.852936+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '480da0fb-e327-4cb3-92a1-aafe95438ffa', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-20 13:38:48.856009+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '9370e708-2a52-4611-ab25-5a80617a3213', '{"action":"login","actor_id":"cf7c87f6-b055-4f90-a496-de2a688ab1ec","actor_username":"jhoan.franco@correounivalle.edu.co","log_type":"account","traits":{"provider":"github"}}', '2023-04-21 10:51:42.47603+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '65b00d16-77e9-4844-b92b-cf08ccc1e48a', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-20 09:24:20.608556+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'ae05dc10-386a-4811-af0e-be90b06f8e62', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-20 09:24:20.624782+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'fad58207-6586-4ea1-88a9-22b438c2deee', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-20 09:24:20.626924+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '041c30c1-445e-43d6-af54-7a087e5afb3a', '{"action":"login","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"account","traits":{"provider":"email"}}', '2023-04-20 14:28:08.485157+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', 'bd411410-c3e7-4a0a-b0be-4b020a4518b0', '{"action":"token_refreshed","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-21 10:49:03.97739+00', '');
INSERT INTO auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) VALUES ('00000000-0000-0000-0000-000000000000', '71f3b463-1357-4de1-b6d5-b9618b720279', '{"action":"token_revoked","actor_id":"40d67225-772d-49db-951c-ead06b10f19e","actor_username":"jhonsfran@gmail.com","log_type":"token"}', '2023-04-21 10:49:03.978618+00', '');


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at) VALUES ('00000000-0000-0000-0000-000000000000', '40d67225-772d-49db-951c-ead06b10f19e', 'authenticated', 'authenticated', 'jhonsfran@gmail.com', '$2a$10$FfF8r73zzfsZ3oD.4Lz4Q.d/PrnblkNRHbkjjp.mOY2IBsysHmw9W', '2023-02-06 06:24:08.07047+00', NULL, '', NULL, '', NULL, '', '', NULL, '2023-04-20 14:28:08.486064+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2023-02-06 06:24:08.05345+00', '2023-04-21 10:49:03.981619+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL);
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at) VALUES ('00000000-0000-0000-0000-000000000000', 'cf7c87f6-b055-4f90-a496-de2a688ab1ec', 'authenticated', 'authenticated', 'jhoan.franco@correounivalle.edu.co', '$2a$10$dC96DoCbF.Q9kwsBoo5Z8.UVOnf7.pVs/0p2ZkVcHi/uLpNuyzoXu', '2023-04-09 16:15:48.648826+00', NULL, '', NULL, '', NULL, '', '', NULL, '2023-04-21 10:51:42.476721+00', '{"provider": "email", "providers": ["email", "github"]}', '{}', NULL, '2023-04-09 16:15:48.628104+00', '2023-04-21 10:51:42.479168+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES ('40d67225-772d-49db-951c-ead06b10f19e', '40d67225-772d-49db-951c-ead06b10f19e', '{"sub": "40d67225-772d-49db-951c-ead06b10f19e"}', 'email', '2023-02-06 06:24:08.066656+00', '2023-02-06 06:24:08.066705+00', '2023-02-06 06:24:08.066711+00');
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES ('cf7c87f6-b055-4f90-a496-de2a688ab1ec', 'cf7c87f6-b055-4f90-a496-de2a688ab1ec', '{"sub": "cf7c87f6-b055-4f90-a496-de2a688ab1ec", "email": "jhoan.franco@correounivalle.edu.co"}', 'email', '2023-04-09 16:15:48.639962+00', '2023-04-09 16:15:48.640032+00', '2023-04-09 16:15:48.640032+00');
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES ('28306808', 'cf7c87f6-b055-4f90-a496-de2a688ab1ec', '{"iss": "https://api.github.com", "sub": "28306808", "name": "Sebastian Franco - Devops Engineer", "email": "jhoan.franco@correounivalle.edu.co", "full_name": "Sebastian Franco - Devops Engineer", "user_name": "jhonsfran1165", "avatar_url": "https://avatars.githubusercontent.com/u/28306808?v=4", "provider_id": "28306808", "email_verified": true, "preferred_username": "jhonsfran1165"}', 'github', '2023-04-21 10:51:42.472953+00', '2023-04-21 10:51:42.472975+00', '2023-04-21 10:51:42.472975+00');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after) VALUES ('200344db-f6a5-4cf5-931d-5c5bee6af4fc', 'cf7c87f6-b055-4f90-a496-de2a688ab1ec', '2023-04-09 16:15:48.654799+00', '2023-04-09 16:15:48.654799+00', NULL, 'aal1', NULL);
INSERT INTO auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after) VALUES ('a58226e7-f8f5-4a61-ba6f-790df2b76ed8', '40d67225-772d-49db-951c-ead06b10f19e', '2023-04-19 14:44:19.841415+00', '2023-04-19 14:44:19.841415+00', NULL, 'aal1', NULL);
INSERT INTO auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after) VALUES ('763a3434-214d-4354-8297-1ec66b1aad8a', '40d67225-772d-49db-951c-ead06b10f19e', '2023-04-20 08:18:30.929955+00', '2023-04-20 08:18:30.929955+00', NULL, 'aal1', NULL);
INSERT INTO auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after) VALUES ('f5fd734b-3c3e-44aa-8f61-776f5e7aeada', '40d67225-772d-49db-951c-ead06b10f19e', '2023-04-20 12:16:56.659028+00', '2023-04-20 12:16:56.659028+00', NULL, 'aal1', NULL);
INSERT INTO auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after) VALUES ('8ef8e489-82da-4ffc-b02f-0ab80b8a53bc', '40d67225-772d-49db-951c-ead06b10f19e', '2023-04-20 14:28:08.486098+00', '2023-04-20 14:28:08.486098+00', NULL, 'aal1', NULL);
INSERT INTO auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after) VALUES ('908c9192-b2ee-44b2-a97d-1863ff09adce', 'cf7c87f6-b055-4f90-a496-de2a688ab1ec', '2023-04-21 10:51:42.476748+00', '2023-04-21 10:51:42.476748+00', NULL, 'aal1', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) VALUES ('200344db-f6a5-4cf5-931d-5c5bee6af4fc', '2023-04-09 16:15:48.659603+00', '2023-04-09 16:15:48.659603+00', 'password', 'd6b706a7-ca43-4ed4-80fe-257b215fdd33');
INSERT INTO auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) VALUES ('a58226e7-f8f5-4a61-ba6f-790df2b76ed8', '2023-04-19 14:44:19.844299+00', '2023-04-19 14:44:19.844299+00', 'password', '9923585a-888f-4b39-aa66-edfb487d2bcd');
INSERT INTO auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) VALUES ('763a3434-214d-4354-8297-1ec66b1aad8a', '2023-04-20 08:18:30.932299+00', '2023-04-20 08:18:30.932299+00', 'password', '1ba62b8a-df18-4926-9282-2458d691c4f4');
INSERT INTO auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) VALUES ('f5fd734b-3c3e-44aa-8f61-776f5e7aeada', '2023-04-20 12:16:56.661308+00', '2023-04-20 12:16:56.661308+00', 'password', '5d78a6a4-1f2e-4fe7-9b3f-88b297ae1217');
INSERT INTO auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) VALUES ('8ef8e489-82da-4ffc-b02f-0ab80b8a53bc', '2023-04-20 14:28:08.489305+00', '2023-04-20 14:28:08.489305+00', 'password', '7c84ba8f-dd03-432e-a98d-2a1f27d63b74');
INSERT INTO auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) VALUES ('908c9192-b2ee-44b2-a97d-1863ff09adce', '2023-04-21 10:51:42.480364+00', '2023-04-21 10:51:42.480364+00', 'oauth', 'd9d88c7b-97c9-4e87-9857-ef21b1feb281');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) VALUES ('00000000-0000-0000-0000-000000000000', 97, '7sTZymClAfEVzkEDcvcNrg', '40d67225-772d-49db-951c-ead06b10f19e', true, '2023-04-19 15:43:56.410386+00', '2023-04-20 08:18:00.996235+00', '7N0LQoxL5CwPI57kr1BT6A', 'a58226e7-f8f5-4a61-ba6f-790df2b76ed8');
INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) VALUES ('00000000-0000-0000-0000-000000000000', 98, 'YWm7vKcdR_TnCSwSU_v8ew', '40d67225-772d-49db-951c-ead06b10f19e', false, '2023-04-20 08:18:00.996736+00', '2023-04-20 08:18:00.996736+00', '7sTZymClAfEVzkEDcvcNrg', 'a58226e7-f8f5-4a61-ba6f-790df2b76ed8');
INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) VALUES ('00000000-0000-0000-0000-000000000000', 101, '07g9FGLMT81TqAasfKoyXg', '40d67225-772d-49db-951c-ead06b10f19e', false, '2023-04-20 09:24:20.618953+00', '2023-04-20 09:24:20.618953+00', 'iVnTLini5dNKGZQjDZyP0A', '763a3434-214d-4354-8297-1ec66b1aad8a');
INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) VALUES ('00000000-0000-0000-0000-000000000000', 102, 'Yz7cs_LheFCRXhJL5DxLew', '40d67225-772d-49db-951c-ead06b10f19e', false, '2023-04-20 09:24:20.630373+00', '2023-04-20 09:24:20.630373+00', 'iVnTLini5dNKGZQjDZyP0A', '763a3434-214d-4354-8297-1ec66b1aad8a');
INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) VALUES ('00000000-0000-0000-0000-000000000000', 103, 'c9ye0rl8_nR4K8-qVv20xQ', '40d67225-772d-49db-951c-ead06b10f19e', true, '2023-04-20 12:16:56.659853+00', '2023-04-20 13:38:48.858351+00', NULL, 'f5fd734b-3c3e-44aa-8f61-776f5e7aeada');
INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) VALUES ('00000000-0000-0000-0000-000000000000', 104, 'R7tZuJrCq-YUqtVcJl-7ew', '40d67225-772d-49db-951c-ead06b10f19e', false, '2023-04-20 13:38:48.858989+00', '2023-04-20 13:38:48.858989+00', 'c9ye0rl8_nR4K8-qVv20xQ', 'f5fd734b-3c3e-44aa-8f61-776f5e7aeada');
INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) VALUES ('00000000-0000-0000-0000-000000000000', 107, '0bhcGdJvW1uID0XzGM4PbA', 'cf7c87f6-b055-4f90-a496-de2a688ab1ec', false, '2023-04-21 10:51:42.478168+00', '2023-04-21 10:51:42.478168+00', NULL, '908c9192-b2ee-44b2-a97d-1863ff09adce');
INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) VALUES ('00000000-0000-0000-0000-000000000000', 11, 'Bxm40r6fJaCDYhFDDfrJxw', 'cf7c87f6-b055-4f90-a496-de2a688ab1ec', true, '2023-04-09 16:15:48.656544+00', '2023-04-09 18:11:05.048438+00', NULL, '200344db-f6a5-4cf5-931d-5c5bee6af4fc');
INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) VALUES ('00000000-0000-0000-0000-000000000000', 12, 'azoWydpQSB0dfcQEVqh4Gg', 'cf7c87f6-b055-4f90-a496-de2a688ab1ec', false, '2023-04-09 18:11:05.066957+00', '2023-04-09 18:11:05.066957+00', 'Bxm40r6fJaCDYhFDDfrJxw', '200344db-f6a5-4cf5-931d-5c5bee6af4fc');
INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) VALUES ('00000000-0000-0000-0000-000000000000', 96, '7N0LQoxL5CwPI57kr1BT6A', '40d67225-772d-49db-951c-ead06b10f19e', true, '2023-04-19 14:44:19.842371+00', '2023-04-19 15:43:56.40994+00', NULL, 'a58226e7-f8f5-4a61-ba6f-790df2b76ed8');
INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) VALUES ('00000000-0000-0000-0000-000000000000', 100, '5QeEAguYmFAWQqJnKryXtg', '40d67225-772d-49db-951c-ead06b10f19e', false, '2023-04-20 09:24:20.611462+00', '2023-04-20 09:24:20.611462+00', 'iVnTLini5dNKGZQjDZyP0A', '763a3434-214d-4354-8297-1ec66b1aad8a');
INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) VALUES ('00000000-0000-0000-0000-000000000000', 99, 'iVnTLini5dNKGZQjDZyP0A', '40d67225-772d-49db-951c-ead06b10f19e', true, '2023-04-20 08:18:30.93071+00', '2023-04-20 09:24:20.629014+00', NULL, '763a3434-214d-4354-8297-1ec66b1aad8a');
INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) VALUES ('00000000-0000-0000-0000-000000000000', 105, 'iQ6pONV_jy-XB5bPzxXC2Q', '40d67225-772d-49db-951c-ead06b10f19e', true, '2023-04-20 14:28:08.486994+00', '2023-04-21 10:49:03.979551+00', NULL, '8ef8e489-82da-4ffc-b02f-0ab80b8a53bc');
INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) VALUES ('00000000-0000-0000-0000-000000000000', 106, 'G9E-AwEk-Ea_SBzZdyFdEA', '40d67225-772d-49db-951c-ead06b10f19e', false, '2023-04-21 10:49:03.980168+00', '2023-04-21 10:49:03.980168+00', 'iQ6pONV_jy-XB5bPzxXC2Q', '8ef8e489-82da-4ffc-b02f-0ab80b8a53bc');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.schema_migrations (version) VALUES ('20171026211738');
INSERT INTO auth.schema_migrations (version) VALUES ('20171026211808');
INSERT INTO auth.schema_migrations (version) VALUES ('20171026211834');
INSERT INTO auth.schema_migrations (version) VALUES ('20180103212743');
INSERT INTO auth.schema_migrations (version) VALUES ('20180108183307');
INSERT INTO auth.schema_migrations (version) VALUES ('20180119214651');
INSERT INTO auth.schema_migrations (version) VALUES ('20180125194653');
INSERT INTO auth.schema_migrations (version) VALUES ('00');
INSERT INTO auth.schema_migrations (version) VALUES ('20210710035447');
INSERT INTO auth.schema_migrations (version) VALUES ('20210722035447');
INSERT INTO auth.schema_migrations (version) VALUES ('20210730183235');
INSERT INTO auth.schema_migrations (version) VALUES ('20210909172000');
INSERT INTO auth.schema_migrations (version) VALUES ('20210927181326');
INSERT INTO auth.schema_migrations (version) VALUES ('20211122151130');
INSERT INTO auth.schema_migrations (version) VALUES ('20211124214934');
INSERT INTO auth.schema_migrations (version) VALUES ('20211202183645');
INSERT INTO auth.schema_migrations (version) VALUES ('20220114185221');
INSERT INTO auth.schema_migrations (version) VALUES ('20220114185340');
INSERT INTO auth.schema_migrations (version) VALUES ('20220224000811');
INSERT INTO auth.schema_migrations (version) VALUES ('20220323170000');
INSERT INTO auth.schema_migrations (version) VALUES ('20220429102000');
INSERT INTO auth.schema_migrations (version) VALUES ('20220531120530');
INSERT INTO auth.schema_migrations (version) VALUES ('20220614074223');
INSERT INTO auth.schema_migrations (version) VALUES ('20220811173540');
INSERT INTO auth.schema_migrations (version) VALUES ('20221003041349');
INSERT INTO auth.schema_migrations (version) VALUES ('20221003041400');
INSERT INTO auth.schema_migrations (version) VALUES ('20221011041400');
INSERT INTO auth.schema_migrations (version) VALUES ('20221020193600');
INSERT INTO auth.schema_migrations (version) VALUES ('20221021073300');
INSERT INTO auth.schema_migrations (version) VALUES ('20221021082433');
INSERT INTO auth.schema_migrations (version) VALUES ('20221027105023');
INSERT INTO auth.schema_migrations (version) VALUES ('20221114143122');
INSERT INTO auth.schema_migrations (version) VALUES ('20221114143410');
INSERT INTO auth.schema_migrations (version) VALUES ('20221125140132');
INSERT INTO auth.schema_migrations (version) VALUES ('20221208132122');
INSERT INTO auth.schema_migrations (version) VALUES ('20221215195500');
INSERT INTO auth.schema_migrations (version) VALUES ('20221215195800');
INSERT INTO auth.schema_migrations (version) VALUES ('20221215195900');
INSERT INTO auth.schema_migrations (version) VALUES ('20230116124310');
INSERT INTO auth.schema_migrations (version) VALUES ('20230116124412');
INSERT INTO auth.schema_migrations (version) VALUES ('20230131181311');


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: key; Type: TABLE DATA; Schema: pgsodium; Owner: postgres
--

INSERT INTO pgsodium.key (id, status, created, expires, key_type, key_id, key_context, comment, user_data) VALUES ('ab242d57-9d4b-48ee-8178-e8b0b1afa28f', 'default', '2023-04-08 17:56:40.355701', NULL, NULL, 1, '\x7067736f6469756d', 'This is the default key used for vault.secrets', NULL);


--
-- Data for Name: organization; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.organization (id, created_at, updated_at, name, slug, image, type, description, stripe_id) VALUES (1, '2023-04-08 19:12:07.80963+00', '2023-04-08 19:12:07.80963', 'bigbang', 'bigbang', 'https://res.cloudinary.com/dadxtc8yf/image/upload/v1680981124/test/h8gvokeoqceajcsrzevg.jpg', 'startup', 'Esta es la primera organizacion.', 'cus_Nj0TFdcKP9GjNr');
INSERT INTO public.organization (id, created_at, updated_at, name, slug, image, type, description, stripe_id) VALUES (7, '2023-04-09 20:03:40.625764+00', '2023-04-09 20:03:40.625764', 'jhonsfran', 'jhonsfran', 'https://avatar.vercel.sh/jhonsfran', 'personal', 'mucho capo papi', NULL);


--
-- Data for Name: profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.profile (id, created_at, updated_at, username, full_name, avatar_url) VALUES ('40d67225-772d-49db-951c-ead06b10f19e', '2023-01-24 06:48:32+00', '2023-01-24 07:48:32', 'jhonsfran', 'jhoan franco', NULL);
INSERT INTO public.profile (id, created_at, updated_at, username, full_name, avatar_url) VALUES ('cf7c87f6-b055-4f90-a496-de2a688ab1ec', '2023-04-09 16:15:48.504201+00', '2023-04-09 16:15:48.504201', 'jhoan.franco@correounivalle.edu.co', 'jhoan.franco@correounivalle.edu.co', 'null');


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


--
-- Data for Name: page; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (0, 'create-migrations-table', 'e18db593bcde2aca2a408c4d1100f6abba2195df', '2023-03-16 02:25:37.548482');
INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (1, 'initialmigration', '6ab16121fbaa08bbd11b712d05f358f9b555d777', '2023-03-16 02:25:37.55595');
INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (2, 'pathtoken-column', '49756be03be4c17bb85fe70d4a861f27de7e49ad', '2023-03-16 02:25:37.560258');
INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (3, 'add-migrations-rls', 'bb5d124c53d68635a883e399426c6a5a25fc893d', '2023-03-16 02:25:37.594153');
INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (4, 'add-size-functions', '6d79007d04f5acd288c9c250c42d2d5fd286c54d', '2023-03-16 02:25:37.599194');
INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (5, 'change-column-name-in-get-size', 'fd65688505d2ffa9fbdc58a944348dd8604d688c', '2023-03-16 02:25:37.604658');
INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (6, 'add-rls-to-buckets', '63e2bab75a2040fee8e3fb3f15a0d26f3380e9b6', '2023-03-16 02:25:37.609563');
INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (7, 'add-public-to-buckets', '82568934f8a4d9e0a85f126f6fb483ad8214c418', '2023-03-16 02:25:37.615929');
INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (8, 'fix-search-function', '1a43a40eddb525f2e2f26efd709e6c06e58e059c', '2023-03-16 02:25:37.620171');
INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (9, 'search-files-search-function', '34c096597eb8b9d077fdfdde9878c88501b2fafc', '2023-03-16 02:25:37.624484');
INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (10, 'add-trigger-to-auto-update-updated_at-column', '37d6bb964a70a822e6d37f22f457b9bca7885928', '2023-03-16 02:25:37.629534');
INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (11, 'add-automatic-avif-detection-flag', 'bd76c53a9c564c80d98d119c1b3a28e16c8152db', '2023-03-16 02:25:37.634022');
INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (12, 'add-bucket-custom-limits', 'cbe0a4c32a0e891554a21020433b7a4423c07ee7', '2023-03-16 02:25:37.639132');
INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (13, 'use-bytes-for-max-size', '7a158ebce8a0c2801c9c65b7e9b2f98f68b3874e', '2023-03-16 02:25:37.643598');
INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (14, 'add-can-insert-object-function', '273193826bca7e0990b458d1ba72f8aa27c0d825', '2023-04-06 09:18:55.232202');
INSERT INTO storage.migrations (id, name, hash, executed_at) VALUES (15, 'add-version', 'e821a779d26612899b8c2dfe20245f904a327c4f', '2023-04-06 09:18:55.239444');


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Data for Name: migrations; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--

INSERT INTO supabase_functions.migrations (version, inserted_at) VALUES ('initial', '2023-03-16 02:25:30.966697+00');
INSERT INTO supabase_functions.migrations (version, inserted_at) VALUES ('20210809183423_update_grants', '2023-03-16 02:25:30.966697+00');


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 107, true);


--
-- Name: organization_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.organization_id_seq', 17, true);


--
-- Name: organization_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.organization_profiles_id_seq', 8, true);


--
-- Name: page_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.page_id_seq', 1, false);


--
-- Name: project_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.project_id_seq', 1, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('supabase_functions.hooks_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

