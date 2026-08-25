--
-- PostgreSQL database dump
--

\restrict 3k4oWUw2weIdtqCLjJvK3tmFPYXGqLwNQeGvyXM18T3uusdxPDBwqF7TEMbloZA

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-08-24 10:19:59

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 25143)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 5329 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 2 (class 3079 OID 32808)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5331 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 261 (class 1255 OID 25144)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 257 (class 1259 OID 25616)
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id bigint NOT NULL,
    class_id bigint NOT NULL,
    student_id bigint NOT NULL,
    marked_by bigint NOT NULL,
    session_date date NOT NULL,
    status text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT attendance_status_check CHECK ((status = ANY (ARRAY['present'::text, 'absent'::text, 'late'::text])))
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 25615)
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO postgres;

--
-- TOC entry 5332 (class 0 OID 0)
-- Dependencies: 256
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- TOC entry 258 (class 1259 OID 32846)
-- Name: class_combinations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.class_combinations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id integer NOT NULL,
    academic_year character varying(9) NOT NULL,
    education_level character varying(20) NOT NULL,
    level_code character varying(10) NOT NULL,
    pathway character varying(30),
    stream character varying(2),
    capacity integer,
    display_name character varying(60) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.class_combinations OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 25444)
-- Name: class_teachers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.class_teachers (
    id bigint NOT NULL,
    class_id bigint NOT NULL,
    teacher_id bigint NOT NULL,
    subject character varying(100) NOT NULL,
    is_class_teacher boolean DEFAULT false NOT NULL
);


ALTER TABLE public.class_teachers OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 25443)
-- Name: class_teachers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.class_teachers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.class_teachers_id_seq OWNER TO postgres;

--
-- TOC entry 5333 (class 0 OID 0)
-- Dependencies: 242
-- Name: class_teachers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.class_teachers_id_seq OWNED BY public.class_teachers.id;


--
-- TOC entry 234 (class 1259 OID 25318)
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    id bigint NOT NULL,
    school_id bigint NOT NULL,
    school_year_id bigint NOT NULL,
    combination_id bigint NOT NULL,
    section_label character varying(10) DEFAULT 'A'::character varying NOT NULL
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 25317)
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.classes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.classes_id_seq OWNER TO postgres;

--
-- TOC entry 5334 (class 0 OID 0)
-- Dependencies: 233
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- TOC entry 232 (class 1259 OID 25303)
-- Name: combinations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.combinations (
    id bigint NOT NULL,
    school_id bigint NOT NULL,
    name character varying(100) NOT NULL,
    level_label character varying(60)
);


ALTER TABLE public.combinations OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 25302)
-- Name: combinations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.combinations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.combinations_id_seq OWNER TO postgres;

--
-- TOC entry 5335 (class 0 OID 0)
-- Dependencies: 231
-- Name: combinations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.combinations_id_seq OWNED BY public.combinations.id;


--
-- TOC entry 239 (class 1259 OID 25378)
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    id bigint NOT NULL,
    student_id bigint NOT NULL,
    class_id bigint NOT NULL,
    school_year_id bigint NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT enrollments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'promoted'::text, 'withdrawn'::text])))
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 25377)
-- Name: enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enrollments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enrollments_id_seq OWNER TO postgres;

--
-- TOC entry 5336 (class 0 OID 0)
-- Dependencies: 238
-- Name: enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enrollments_id_seq OWNED BY public.enrollments.id;


--
-- TOC entry 236 (class 1259 OID 25346)
-- Name: extracurriculars; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.extracurriculars (
    id bigint NOT NULL,
    school_id bigint NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.extracurriculars OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 25345)
-- Name: extracurriculars_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.extracurriculars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.extracurriculars_id_seq OWNER TO postgres;

--
-- TOC entry 5337 (class 0 OID 0)
-- Dependencies: 235
-- Name: extracurriculars_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.extracurriculars_id_seq OWNED BY public.extracurriculars.id;


--
-- TOC entry 245 (class 1259 OID 25469)
-- Name: notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notes (
    id bigint NOT NULL,
    teacher_id bigint NOT NULL,
    class_id bigint NOT NULL,
    subject character varying(100) NOT NULL,
    title character varying(190) NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT notes_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
);


ALTER TABLE public.notes OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 25468)
-- Name: notes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notes_id_seq OWNER TO postgres;

--
-- TOC entry 5338 (class 0 OID 0)
-- Dependencies: 244
-- Name: notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notes_id_seq OWNED BY public.notes.id;


--
-- TOC entry 260 (class 1259 OID 32903)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id integer NOT NULL,
    type character varying(40) NOT NULL,
    message text NOT NULL,
    meta jsonb,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 25198)
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_codes (
    id bigint NOT NULL,
    email character varying(190) NOT NULL,
    code_hash character varying(255) NOT NULL,
    purpose text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    consumed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT otp_codes_purpose_check CHECK ((purpose = ANY (ARRAY['school_email_verify'::text, 'school_admin_login'::text])))
);


ALTER TABLE public.otp_codes OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 25197)
-- Name: otp_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.otp_codes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.otp_codes_id_seq OWNER TO postgres;

--
-- TOC entry 5339 (class 0 OID 0)
-- Dependencies: 223
-- Name: otp_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.otp_codes_id_seq OWNED BY public.otp_codes.id;


--
-- TOC entry 226 (class 1259 OID 25216)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id bigint NOT NULL,
    school_id bigint NOT NULL,
    provider text NOT NULL,
    payer_phone character varying(20),
    amount numeric(12,2) NOT NULL,
    currency character varying(8) DEFAULT 'RWF'::character varying NOT NULL,
    transaction_ref character varying(100) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT payments_provider_check CHECK ((provider = ANY (ARRAY['mtn'::text, 'airtel'::text, 'paypal'::text]))),
    CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'success'::text, 'failed'::text])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 25215)
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- TOC entry 5340 (class 0 OID 0)
-- Dependencies: 225
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- TOC entry 241 (class 1259 OID 25411)
-- Name: promotions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotions (
    id bigint NOT NULL,
    student_id bigint NOT NULL,
    from_class_id bigint,
    to_class_id bigint NOT NULL,
    promoted_by bigint NOT NULL,
    promoted_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.promotions OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 25410)
-- Name: promotions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promotions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promotions_id_seq OWNER TO postgres;

--
-- TOC entry 5341 (class 0 OID 0)
-- Dependencies: 240
-- Name: promotions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promotions_id_seq OWNED BY public.promotions.id;


--
-- TOC entry 255 (class 1259 OID 25591)
-- Name: quiz_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_answers (
    id bigint NOT NULL,
    attempt_id bigint NOT NULL,
    question_id bigint NOT NULL,
    selected_option_id bigint
);


ALTER TABLE public.quiz_answers OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 25590)
-- Name: quiz_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quiz_answers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_answers_id_seq OWNER TO postgres;

--
-- TOC entry 5342 (class 0 OID 0)
-- Dependencies: 254
-- Name: quiz_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quiz_answers_id_seq OWNED BY public.quiz_answers.id;


--
-- TOC entry 253 (class 1259 OID 25567)
-- Name: quiz_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_attempts (
    id bigint NOT NULL,
    quiz_id bigint NOT NULL,
    student_id bigint NOT NULL,
    score numeric(5,2),
    started_at timestamp without time zone DEFAULT now() NOT NULL,
    submitted_at timestamp without time zone
);


ALTER TABLE public.quiz_attempts OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 25566)
-- Name: quiz_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quiz_attempts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_attempts_id_seq OWNER TO postgres;

--
-- TOC entry 5343 (class 0 OID 0)
-- Dependencies: 252
-- Name: quiz_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quiz_attempts_id_seq OWNED BY public.quiz_attempts.id;


--
-- TOC entry 251 (class 1259 OID 25550)
-- Name: quiz_options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_options (
    id bigint NOT NULL,
    question_id bigint NOT NULL,
    option_text character varying(255) NOT NULL,
    is_correct boolean DEFAULT false NOT NULL
);


ALTER TABLE public.quiz_options OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 25549)
-- Name: quiz_options_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quiz_options_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_options_id_seq OWNER TO postgres;

--
-- TOC entry 5344 (class 0 OID 0)
-- Dependencies: 250
-- Name: quiz_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quiz_options_id_seq OWNED BY public.quiz_options.id;


--
-- TOC entry 249 (class 1259 OID 25531)
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_questions (
    id bigint NOT NULL,
    quiz_id bigint NOT NULL,
    order_index smallint DEFAULT 0 NOT NULL,
    question text NOT NULL
);


ALTER TABLE public.quiz_questions OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 25530)
-- Name: quiz_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quiz_questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_questions_id_seq OWNER TO postgres;

--
-- TOC entry 5345 (class 0 OID 0)
-- Dependencies: 248
-- Name: quiz_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quiz_questions_id_seq OWNED BY public.quiz_questions.id;


--
-- TOC entry 247 (class 1259 OID 25502)
-- Name: quizzes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quizzes (
    id bigint NOT NULL,
    teacher_id bigint NOT NULL,
    class_id bigint NOT NULL,
    subject character varying(100) NOT NULL,
    title character varying(190) NOT NULL,
    time_limit_minutes smallint,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT quizzes_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'closed'::text])))
);


ALTER TABLE public.quizzes OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 25501)
-- Name: quizzes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quizzes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quizzes_id_seq OWNER TO postgres;

--
-- TOC entry 5346 (class 0 OID 0)
-- Dependencies: 246
-- Name: quizzes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quizzes_id_seq OWNED BY public.quizzes.id;


--
-- TOC entry 222 (class 1259 OID 25182)
-- Name: school_levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.school_levels (
    school_id bigint NOT NULL,
    level text NOT NULL,
    CONSTRAINT school_levels_level_check CHECK ((level = ANY (ARRAY['nursery'::text, 'primary'::text, 'secondary'::text, 'university'::text])))
);


ALTER TABLE public.school_levels OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 25284)
-- Name: school_years; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.school_years (
    id bigint NOT NULL,
    school_id bigint NOT NULL,
    label character varying(20) NOT NULL,
    is_current boolean DEFAULT false NOT NULL
);


ALTER TABLE public.school_years OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 25283)
-- Name: school_years_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.school_years_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.school_years_id_seq OWNER TO postgres;

--
-- TOC entry 5347 (class 0 OID 0)
-- Dependencies: 229
-- Name: school_years_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.school_years_id_seq OWNED BY public.school_years.id;


--
-- TOC entry 221 (class 1259 OID 25146)
-- Name: schools; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schools (
    id bigint NOT NULL,
    registering_as text DEFAULT 'school'::text NOT NULL,
    name character varying(190) NOT NULL,
    email character varying(190) NOT NULL,
    phone character varying(20) NOT NULL,
    province character varying(80) NOT NULL,
    district character varying(80) NOT NULL,
    sector character varying(80) NOT NULL,
    cell character varying(80) NOT NULL,
    village character varying(80) NOT NULL,
    ownership text NOT NULL,
    residence_type text NOT NULL,
    email_verified_at timestamp without time zone,
    school_code character varying(12),
    status text DEFAULT 'pending_payment'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT schools_ownership_check CHECK ((ownership = ANY (ARRAY['public'::text, 'private'::text]))),
    CONSTRAINT schools_registering_as_check CHECK ((registering_as = ANY (ARRAY['school'::text, 'other'::text]))),
    CONSTRAINT schools_residence_type_check CHECK ((residence_type = ANY (ARRAY['day'::text, 'boarding'::text, 'both'::text]))),
    CONSTRAINT schools_status_check CHECK ((status = ANY (ARRAY['pending_payment'::text, 'active'::text, 'suspended'::text])))
);


ALTER TABLE public.schools OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 25145)
-- Name: schools_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schools_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schools_id_seq OWNER TO postgres;

--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 220
-- Name: schools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schools_id_seq OWNED BY public.schools.id;


--
-- TOC entry 237 (class 1259 OID 25360)
-- Name: student_extracurriculars; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_extracurriculars (
    student_id bigint NOT NULL,
    extracurricular_id bigint NOT NULL
);


ALTER TABLE public.student_extracurriculars OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 32879)
-- Name: teacher_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    teacher_id integer NOT NULL,
    class_combination_id uuid NOT NULL,
    subject character varying(60) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.teacher_assignments OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 25245)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    role text NOT NULL,
    full_name character varying(190) NOT NULL,
    email character varying(190) NOT NULL,
    google_sub character varying(190),
    password_hash character varying(255),
    username character varying(60),
    school_id bigint,
    status text DEFAULT 'pending_approval'::text NOT NULL,
    approved_by bigint,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    class_combination_id uuid,
    student_number character varying(20),
    requested_class_id uuid,
    requested_subject character varying(60),
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['student'::text, 'teacher'::text, 'schoolAdmin'::text, 'superAdmin'::text]))),
    CONSTRAINT users_status_check CHECK ((status = ANY (ARRAY['pending_approval'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 25244)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5349 (class 0 OID 0)
-- Dependencies: 227
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4995 (class 2604 OID 25619)
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- TOC entry 4979 (class 2604 OID 25447)
-- Name: class_teachers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_teachers ALTER COLUMN id SET DEFAULT nextval('public.class_teachers_id_seq'::regclass);


--
-- TOC entry 4971 (class 2604 OID 25321)
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- TOC entry 4970 (class 2604 OID 25306)
-- Name: combinations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combinations ALTER COLUMN id SET DEFAULT nextval('public.combinations_id_seq'::regclass);


--
-- TOC entry 4974 (class 2604 OID 25381)
-- Name: enrollments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN id SET DEFAULT nextval('public.enrollments_id_seq'::regclass);


--
-- TOC entry 4973 (class 2604 OID 25349)
-- Name: extracurriculars id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extracurriculars ALTER COLUMN id SET DEFAULT nextval('public.extracurriculars_id_seq'::regclass);


--
-- TOC entry 4981 (class 2604 OID 25472)
-- Name: notes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes ALTER COLUMN id SET DEFAULT nextval('public.notes_id_seq'::regclass);


--
-- TOC entry 4958 (class 2604 OID 25201)
-- Name: otp_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes ALTER COLUMN id SET DEFAULT nextval('public.otp_codes_id_seq'::regclass);


--
-- TOC entry 4960 (class 2604 OID 25219)
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- TOC entry 4977 (class 2604 OID 25414)
-- Name: promotions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions ALTER COLUMN id SET DEFAULT nextval('public.promotions_id_seq'::regclass);


--
-- TOC entry 4994 (class 2604 OID 25594)
-- Name: quiz_answers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_answers ALTER COLUMN id SET DEFAULT nextval('public.quiz_answers_id_seq'::regclass);


--
-- TOC entry 4992 (class 2604 OID 25570)
-- Name: quiz_attempts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_attempts ALTER COLUMN id SET DEFAULT nextval('public.quiz_attempts_id_seq'::regclass);


--
-- TOC entry 4990 (class 2604 OID 25553)
-- Name: quiz_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_options ALTER COLUMN id SET DEFAULT nextval('public.quiz_options_id_seq'::regclass);


--
-- TOC entry 4988 (class 2604 OID 25534)
-- Name: quiz_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_questions ALTER COLUMN id SET DEFAULT nextval('public.quiz_questions_id_seq'::regclass);


--
-- TOC entry 4985 (class 2604 OID 25505)
-- Name: quizzes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quizzes ALTER COLUMN id SET DEFAULT nextval('public.quizzes_id_seq'::regclass);


--
-- TOC entry 4968 (class 2604 OID 25287)
-- Name: school_years id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_years ALTER COLUMN id SET DEFAULT nextval('public.school_years_id_seq'::regclass);


--
-- TOC entry 4953 (class 2604 OID 25149)
-- Name: schools id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools ALTER COLUMN id SET DEFAULT nextval('public.schools_id_seq'::regclass);


--
-- TOC entry 4964 (class 2604 OID 25248)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5320 (class 0 OID 25616)
-- Dependencies: 257
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, class_id, student_id, marked_by, session_date, status, created_at) FROM stdin;
\.


--
-- TOC entry 5321 (class 0 OID 32846)
-- Dependencies: 258
-- Data for Name: class_combinations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.class_combinations (id, school_id, academic_year, education_level, level_code, pathway, stream, capacity, display_name, created_at) FROM stdin;
\.


--
-- TOC entry 5306 (class 0 OID 25444)
-- Dependencies: 243
-- Data for Name: class_teachers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.class_teachers (id, class_id, teacher_id, subject, is_class_teacher) FROM stdin;
\.


--
-- TOC entry 5297 (class 0 OID 25318)
-- Dependencies: 234
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classes (id, school_id, school_year_id, combination_id, section_label) FROM stdin;
\.


--
-- TOC entry 5295 (class 0 OID 25303)
-- Dependencies: 232
-- Data for Name: combinations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.combinations (id, school_id, name, level_label) FROM stdin;
\.


--
-- TOC entry 5302 (class 0 OID 25378)
-- Dependencies: 239
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (id, student_id, class_id, school_year_id, status, created_at) FROM stdin;
\.


--
-- TOC entry 5299 (class 0 OID 25346)
-- Dependencies: 236
-- Data for Name: extracurriculars; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.extracurriculars (id, school_id, name) FROM stdin;
\.


--
-- TOC entry 5308 (class 0 OID 25469)
-- Dependencies: 245
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notes (id, teacher_id, class_id, subject, title, content, status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5323 (class 0 OID 32903)
-- Dependencies: 260
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, school_id, type, message, meta, read_at, created_at) FROM stdin;
\.


--
-- TOC entry 5287 (class 0 OID 25198)
-- Dependencies: 224
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_codes (id, email, code_hash, purpose, expires_at, consumed_at, created_at) FROM stdin;
\.


--
-- TOC entry 5289 (class 0 OID 25216)
-- Dependencies: 226
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, school_id, provider, payer_phone, amount, currency, transaction_ref, status, created_at) FROM stdin;
2	1	mtn	0782227222	5000.00	RWF	PAY-REF-1787045463205	success	2026-08-18 11:31:03.311824
3	2	mtn	0728282822	5000.00	RWF	PAY-REF-1787136539544	success	2026-08-19 12:48:59.559227
4	3	airtel	0782872722	5000.00	RWF	PAY-REF-1787149466997	success	2026-08-19 16:24:27.004742
5	4	mtn	0782272222	5000.00	RWF	PAY-REF-1787299756423	success	2026-08-21 10:09:16.425589
\.


--
-- TOC entry 5304 (class 0 OID 25411)
-- Dependencies: 241
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotions (id, student_id, from_class_id, to_class_id, promoted_by, promoted_at) FROM stdin;
\.


--
-- TOC entry 5318 (class 0 OID 25591)
-- Dependencies: 255
-- Data for Name: quiz_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz_answers (id, attempt_id, question_id, selected_option_id) FROM stdin;
\.


--
-- TOC entry 5316 (class 0 OID 25567)
-- Dependencies: 253
-- Data for Name: quiz_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz_attempts (id, quiz_id, student_id, score, started_at, submitted_at) FROM stdin;
\.


--
-- TOC entry 5314 (class 0 OID 25550)
-- Dependencies: 251
-- Data for Name: quiz_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz_options (id, question_id, option_text, is_correct) FROM stdin;
\.


--
-- TOC entry 5312 (class 0 OID 25531)
-- Dependencies: 249
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz_questions (id, quiz_id, order_index, question) FROM stdin;
\.


--
-- TOC entry 5310 (class 0 OID 25502)
-- Dependencies: 247
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quizzes (id, teacher_id, class_id, subject, title, time_limit_minutes, status, created_at) FROM stdin;
\.


--
-- TOC entry 5285 (class 0 OID 25182)
-- Dependencies: 222
-- Data for Name: school_levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.school_levels (school_id, level) FROM stdin;
1	primary
1	secondary
2	nursery
2	primary
2	secondary
3	secondary
4	secondary
\.


--
-- TOC entry 5293 (class 0 OID 25284)
-- Dependencies: 230
-- Data for Name: school_years; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.school_years (id, school_id, label, is_current) FROM stdin;
\.


--
-- TOC entry 5284 (class 0 OID 25146)
-- Dependencies: 221
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schools (id, registering_as, name, email, phone, province, district, sector, cell, village, ownership, residence_type, email_verified_at, school_code, status, created_at, updated_at) FROM stdin;
2	school	Gs Amahoro	honorgenius001@gmail.com	0728282822	Northern Province	Musanze	Musanze Sector B	Musanze Sector B Cell B	Musanze Sector B Cell B Village B	public	day	2026-08-19 12:48:54.356917	MUS-7481	active	2026-08-19 12:48:54.356917	2026-08-19 15:16:31.61633
1	school	GS Rubona Rwamagana	mock.user@gmail.com	0782227222	Northern Province	Gakenke	Gakenke Sector A	Gakenke Sector A Cell B	Gakenke Sector A Cell B Village B	public	day	2026-08-18 11:29:20.575667	GAK-5017	active	2026-08-18 11:29:20.575667	2026-08-19 15:16:57.01857
3	school	Agahozo Shaloom Youth Village	ernesteitangishaka31@gmail.com	0782872722	Northern Province	Gakenke	Gakenke Sector B	Gakenke Sector B Cell B	Gakenke Sector B Cell B Village C	private	boarding	2026-08-19 16:24:21.270035	GAK-7730	active	2026-08-19 16:24:21.270035	2026-08-19 16:25:46.483419
4	school	Gs kwiyandikisha	erneste9022@gmail.com	0782272222	Eastern Province	Gatsibo	Gatsibo Sector B	Gatsibo Sector B Cell B	Gatsibo Sector B Cell B Village B	private	day	2026-08-21 10:09:10.972292	GAT-7856	pending_payment	2026-08-21 10:09:10.972292	2026-08-21 10:09:10.972292
\.


--
-- TOC entry 5300 (class 0 OID 25360)
-- Dependencies: 237
-- Data for Name: student_extracurriculars; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_extracurriculars (student_id, extracurricular_id) FROM stdin;
\.


--
-- TOC entry 5322 (class 0 OID 32879)
-- Dependencies: 259
-- Data for Name: teacher_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_assignments (id, teacher_id, class_combination_id, subject, created_at) FROM stdin;
\.


--
-- TOC entry 5291 (class 0 OID 25245)
-- Dependencies: 228
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, role, full_name, email, google_sub, password_hash, username, school_id, status, approved_by, approved_at, created_at, updated_at, class_combination_id, student_number, requested_class_id, requested_subject) FROM stdin;
1	teacher	erneste itangishaka	itangishaka446@gmail.com	iLclClpbLVNOVVxpafbJDtaChnF3	\N	\N	2	pending_approval	\N	\N	2026-08-19 15:43:48.958295	2026-08-19 15:43:48.958295	\N	\N	\N	\N
2	teacher	erneste itangishaka	ernesteitangishaka448@gmail.com	uUlXLPhjhTMMJjKuqU8RCQ07glI3	\N	\N	2	pending_approval	\N	\N	2026-08-19 16:44:40.386832	2026-08-19 16:44:40.386832	\N	\N	\N	\N
\.


--
-- TOC entry 5350 (class 0 OID 0)
-- Dependencies: 256
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 1, false);


--
-- TOC entry 5351 (class 0 OID 0)
-- Dependencies: 242
-- Name: class_teachers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.class_teachers_id_seq', 1, false);


--
-- TOC entry 5352 (class 0 OID 0)
-- Dependencies: 233
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.classes_id_seq', 1, false);


--
-- TOC entry 5353 (class 0 OID 0)
-- Dependencies: 231
-- Name: combinations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.combinations_id_seq', 1, false);


--
-- TOC entry 5354 (class 0 OID 0)
-- Dependencies: 238
-- Name: enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enrollments_id_seq', 1, false);


--
-- TOC entry 5355 (class 0 OID 0)
-- Dependencies: 235
-- Name: extracurriculars_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.extracurriculars_id_seq', 1, false);


--
-- TOC entry 5356 (class 0 OID 0)
-- Dependencies: 244
-- Name: notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notes_id_seq', 1, false);


--
-- TOC entry 5357 (class 0 OID 0)
-- Dependencies: 223
-- Name: otp_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.otp_codes_id_seq', 1, false);


--
-- TOC entry 5358 (class 0 OID 0)
-- Dependencies: 225
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 5, true);


--
-- TOC entry 5359 (class 0 OID 0)
-- Dependencies: 240
-- Name: promotions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promotions_id_seq', 1, false);


--
-- TOC entry 5360 (class 0 OID 0)
-- Dependencies: 254
-- Name: quiz_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_answers_id_seq', 1, false);


--
-- TOC entry 5361 (class 0 OID 0)
-- Dependencies: 252
-- Name: quiz_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_attempts_id_seq', 1, false);


--
-- TOC entry 5362 (class 0 OID 0)
-- Dependencies: 250
-- Name: quiz_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_options_id_seq', 1, false);


--
-- TOC entry 5363 (class 0 OID 0)
-- Dependencies: 248
-- Name: quiz_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_questions_id_seq', 1, false);


--
-- TOC entry 5364 (class 0 OID 0)
-- Dependencies: 246
-- Name: quizzes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quizzes_id_seq', 1, false);


--
-- TOC entry 5365 (class 0 OID 0)
-- Dependencies: 229
-- Name: school_years_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.school_years_id_seq', 1, false);


--
-- TOC entry 5366 (class 0 OID 0)
-- Dependencies: 220
-- Name: schools_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schools_id_seq', 4, true);


--
-- TOC entry 5367 (class 0 OID 0)
-- Dependencies: 227
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- TOC entry 5078 (class 2606 OID 25634)
-- Name: attendance attendance_class_id_student_id_session_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_class_id_student_id_session_date_key UNIQUE (class_id, student_id, session_date);


--
-- TOC entry 5080 (class 2606 OID 25632)
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- TOC entry 5082 (class 2606 OID 32859)
-- Name: class_combinations class_combinations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_combinations
    ADD CONSTRAINT class_combinations_pkey PRIMARY KEY (id);


--
-- TOC entry 5060 (class 2606 OID 25457)
-- Name: class_teachers class_teachers_class_id_teacher_id_subject_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_teachers
    ADD CONSTRAINT class_teachers_class_id_teacher_id_subject_key UNIQUE (class_id, teacher_id, subject);


--
-- TOC entry 5062 (class 2606 OID 25455)
-- Name: class_teachers class_teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_teachers
    ADD CONSTRAINT class_teachers_pkey PRIMARY KEY (id);


--
-- TOC entry 5050 (class 2606 OID 25329)
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- TOC entry 5048 (class 2606 OID 25311)
-- Name: combinations combinations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combinations
    ADD CONSTRAINT combinations_pkey PRIMARY KEY (id);


--
-- TOC entry 5056 (class 2606 OID 25394)
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- TOC entry 5052 (class 2606 OID 25354)
-- Name: extracurriculars extracurriculars_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extracurriculars
    ADD CONSTRAINT extracurriculars_pkey PRIMARY KEY (id);


--
-- TOC entry 5064 (class 2606 OID 25489)
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- TOC entry 5091 (class 2606 OID 32916)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5027 (class 2606 OID 25213)
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- TOC entry 5029 (class 2606 OID 25236)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5031 (class 2606 OID 25238)
-- Name: payments payments_transaction_ref_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_transaction_ref_key UNIQUE (transaction_ref);


--
-- TOC entry 5058 (class 2606 OID 25422)
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- TOC entry 5076 (class 2606 OID 25599)
-- Name: quiz_answers quiz_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT quiz_answers_pkey PRIMARY KEY (id);


--
-- TOC entry 5072 (class 2606 OID 25577)
-- Name: quiz_attempts quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);


--
-- TOC entry 5074 (class 2606 OID 25579)
-- Name: quiz_attempts quiz_attempts_quiz_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_quiz_id_student_id_key UNIQUE (quiz_id, student_id);


--
-- TOC entry 5070 (class 2606 OID 25560)
-- Name: quiz_options quiz_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_options
    ADD CONSTRAINT quiz_options_pkey PRIMARY KEY (id);


--
-- TOC entry 5068 (class 2606 OID 25543)
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 5066 (class 2606 OID 25519)
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- TOC entry 5024 (class 2606 OID 25191)
-- Name: school_levels school_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_levels
    ADD CONSTRAINT school_levels_pkey PRIMARY KEY (school_id, level);


--
-- TOC entry 5044 (class 2606 OID 25294)
-- Name: school_years school_years_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_years
    ADD CONSTRAINT school_years_pkey PRIMARY KEY (id);


--
-- TOC entry 5046 (class 2606 OID 25296)
-- Name: school_years school_years_school_id_label_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_years
    ADD CONSTRAINT school_years_school_id_label_key UNIQUE (school_id, label);


--
-- TOC entry 5018 (class 2606 OID 25178)
-- Name: schools schools_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_email_key UNIQUE (email);


--
-- TOC entry 5020 (class 2606 OID 25176)
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- TOC entry 5022 (class 2606 OID 25180)
-- Name: schools schools_school_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_school_code_key UNIQUE (school_code);


--
-- TOC entry 5054 (class 2606 OID 25366)
-- Name: student_extracurriculars student_extracurriculars_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_extracurriculars
    ADD CONSTRAINT student_extracurriculars_pkey PRIMARY KEY (student_id, extracurricular_id);


--
-- TOC entry 5086 (class 2606 OID 32890)
-- Name: teacher_assignments teacher_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_assignments
    ADD CONSTRAINT teacher_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 5088 (class 2606 OID 32892)
-- Name: teacher_assignments teacher_assignments_teacher_id_class_combination_id_subject_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_assignments
    ADD CONSTRAINT teacher_assignments_teacher_id_class_combination_id_subject_key UNIQUE (teacher_id, class_combination_id, subject);


--
-- TOC entry 5034 (class 2606 OID 25266)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5036 (class 2606 OID 25268)
-- Name: users users_google_sub_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_sub_key UNIQUE (google_sub);


--
-- TOC entry 5038 (class 2606 OID 25264)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5040 (class 2606 OID 32868)
-- Name: users users_student_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_student_number_key UNIQUE (student_number);


--
-- TOC entry 5042 (class 2606 OID 25270)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5083 (class 1259 OID 32865)
-- Name: idx_class_combinations_school_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_class_combinations_school_year ON public.class_combinations USING btree (school_id, academic_year);


--
-- TOC entry 5089 (class 1259 OID 32922)
-- Name: idx_notifications_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_school ON public.notifications USING btree (school_id, created_at DESC);


--
-- TOC entry 5025 (class 1259 OID 25214)
-- Name: idx_otp_email_purpose; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otp_email_purpose ON public.otp_codes USING btree (email, purpose);


--
-- TOC entry 5032 (class 1259 OID 25281)
-- Name: idx_users_school_role_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_school_role_status ON public.users USING btree (school_id, role, status);


--
-- TOC entry 5084 (class 1259 OID 32866)
-- Name: ux_class_combinations_identity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_class_combinations_identity ON public.class_combinations USING btree (school_id, academic_year, level_code, COALESCE(pathway, ''::character varying), COALESCE(stream, ''::character varying));


--
-- TOC entry 5135 (class 2620 OID 25500)
-- Name: notes trg_notes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5133 (class 2620 OID 25181)
-- Name: schools trg_schools_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5134 (class 2620 OID 25282)
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5126 (class 2606 OID 25635)
-- Name: attendance attendance_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 5127 (class 2606 OID 25645)
-- Name: attendance attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5128 (class 2606 OID 25640)
-- Name: attendance attendance_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5129 (class 2606 OID 32860)
-- Name: class_combinations class_combinations_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_combinations
    ADD CONSTRAINT class_combinations_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- TOC entry 5113 (class 2606 OID 25458)
-- Name: class_teachers class_teachers_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_teachers
    ADD CONSTRAINT class_teachers_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 5114 (class 2606 OID 25463)
-- Name: class_teachers class_teachers_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_teachers
    ADD CONSTRAINT class_teachers_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5100 (class 2606 OID 25340)
-- Name: classes classes_combination_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_combination_id_fkey FOREIGN KEY (combination_id) REFERENCES public.combinations(id) ON DELETE CASCADE;


--
-- TOC entry 5101 (class 2606 OID 25330)
-- Name: classes classes_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- TOC entry 5102 (class 2606 OID 25335)
-- Name: classes classes_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;


--
-- TOC entry 5099 (class 2606 OID 25312)
-- Name: combinations combinations_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combinations
    ADD CONSTRAINT combinations_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- TOC entry 5106 (class 2606 OID 25400)
-- Name: enrollments enrollments_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 5107 (class 2606 OID 25405)
-- Name: enrollments enrollments_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;


--
-- TOC entry 5108 (class 2606 OID 25395)
-- Name: enrollments enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5103 (class 2606 OID 25355)
-- Name: extracurriculars extracurriculars_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extracurriculars
    ADD CONSTRAINT extracurriculars_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- TOC entry 5094 (class 2606 OID 25276)
-- Name: users fk_users_approved_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_approved_by FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5115 (class 2606 OID 25495)
-- Name: notes notes_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 5116 (class 2606 OID 25490)
-- Name: notes notes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5132 (class 2606 OID 32917)
-- Name: notifications notifications_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- TOC entry 5093 (class 2606 OID 25239)
-- Name: payments payments_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- TOC entry 5109 (class 2606 OID 25428)
-- Name: promotions promotions_from_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_from_class_id_fkey FOREIGN KEY (from_class_id) REFERENCES public.classes(id) ON DELETE SET NULL;


--
-- TOC entry 5110 (class 2606 OID 25438)
-- Name: promotions promotions_promoted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_promoted_by_fkey FOREIGN KEY (promoted_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5111 (class 2606 OID 25423)
-- Name: promotions promotions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5112 (class 2606 OID 25433)
-- Name: promotions promotions_to_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_to_class_id_fkey FOREIGN KEY (to_class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 5123 (class 2606 OID 25600)
-- Name: quiz_answers quiz_answers_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT quiz_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.quiz_attempts(id) ON DELETE CASCADE;


--
-- TOC entry 5124 (class 2606 OID 25605)
-- Name: quiz_answers quiz_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT quiz_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE;


--
-- TOC entry 5125 (class 2606 OID 25610)
-- Name: quiz_answers quiz_answers_selected_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT quiz_answers_selected_option_id_fkey FOREIGN KEY (selected_option_id) REFERENCES public.quiz_options(id) ON DELETE SET NULL;


--
-- TOC entry 5121 (class 2606 OID 25580)
-- Name: quiz_attempts quiz_attempts_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- TOC entry 5122 (class 2606 OID 25585)
-- Name: quiz_attempts quiz_attempts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5120 (class 2606 OID 25561)
-- Name: quiz_options quiz_options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_options
    ADD CONSTRAINT quiz_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE;


--
-- TOC entry 5119 (class 2606 OID 25544)
-- Name: quiz_questions quiz_questions_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- TOC entry 5117 (class 2606 OID 25525)
-- Name: quizzes quizzes_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 5118 (class 2606 OID 25520)
-- Name: quizzes quizzes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5092 (class 2606 OID 25192)
-- Name: school_levels school_levels_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_levels
    ADD CONSTRAINT school_levels_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- TOC entry 5098 (class 2606 OID 25297)
-- Name: school_years school_years_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_years
    ADD CONSTRAINT school_years_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- TOC entry 5104 (class 2606 OID 25372)
-- Name: student_extracurriculars student_extracurriculars_extracurricular_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_extracurriculars
    ADD CONSTRAINT student_extracurriculars_extracurricular_id_fkey FOREIGN KEY (extracurricular_id) REFERENCES public.extracurriculars(id) ON DELETE CASCADE;


--
-- TOC entry 5105 (class 2606 OID 25367)
-- Name: student_extracurriculars student_extracurriculars_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_extracurriculars
    ADD CONSTRAINT student_extracurriculars_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5130 (class 2606 OID 32898)
-- Name: teacher_assignments teacher_assignments_class_combination_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_assignments
    ADD CONSTRAINT teacher_assignments_class_combination_id_fkey FOREIGN KEY (class_combination_id) REFERENCES public.class_combinations(id) ON DELETE CASCADE;


--
-- TOC entry 5131 (class 2606 OID 32893)
-- Name: teacher_assignments teacher_assignments_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_assignments
    ADD CONSTRAINT teacher_assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5095 (class 2606 OID 32869)
-- Name: users users_class_combination_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_class_combination_id_fkey FOREIGN KEY (class_combination_id) REFERENCES public.class_combinations(id) ON DELETE SET NULL;


--
-- TOC entry 5096 (class 2606 OID 32874)
-- Name: users users_requested_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_requested_class_id_fkey FOREIGN KEY (requested_class_id) REFERENCES public.class_combinations(id);


--
-- TOC entry 5097 (class 2606 OID 25271)
-- Name: users users_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;


--
-- TOC entry 5330 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2026-08-24 10:20:01

--
-- PostgreSQL database dump complete
--

\unrestrict 3k4oWUw2weIdtqCLjJvK3tmFPYXGqLwNQeGvyXM18T3uusdxPDBwqF7TEMbloZA

