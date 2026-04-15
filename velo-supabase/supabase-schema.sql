-- ============================================================
-- VELO — Script SQL para o Supabase
-- Cole TUDO isso no SQL Editor do Supabase e clique "Run"
-- ============================================================

-- 1. TABELAS
-- ============================================================

-- Perfil de instrutores
CREATE TABLE IF NOT EXISTS instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  image_url TEXT,
  bio TEXT,
  location TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  transmission TEXT NOT NULL DEFAULT 'Manual' CHECK (transmission IN ('Manual', 'Automatic')),
  type TEXT NOT NULL DEFAULT 'Credenciado' CHECK (type IN ('Credenciado', 'Autônomo')),
  credential_number TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  vehicle_model TEXT,
  vehicle_plate TEXT,
  vehicle_year TEXT,
  vehicle_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Perfil de alunos
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  image_url TEXT,
  has_ladv BOOLEAN DEFAULT FALSE,
  ladv_file_url TEXT,
  total_hours_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disponibilidade semanal do instrutor
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(instructor_id, day_of_week)
);

-- Bloqueios pontuais de agenda
CREATE TABLE IF NOT EXISTS busy_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aulas agendadas
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'in-progress', 'completed', 'cancelled')),
  price NUMERIC(10,2) NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Avaliações do aluno
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID UNIQUE NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback do instrutor
CREATE TABLE IF NOT EXISTS instructor_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID UNIQUE NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  feedback TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_instructors_user ON instructors(user_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_instructor ON classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classes_student ON classes(student_id);
CREATE INDEX IF NOT EXISTS idx_classes_date ON classes(date);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_availability_instructor ON availability(instructor_id);
CREATE INDEX IF NOT EXISTS idx_busy_slots_date ON busy_slots(instructor_id, date);
CREATE INDEX IF NOT EXISTS idx_reviews_instructor ON reviews(instructor_id);

-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE busy_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_feedback ENABLE ROW LEVEL SECURITY;

-- Instrutores: todos podem ler, dono pode editar
CREATE POLICY "instructors_select" ON instructors FOR SELECT USING (true);
CREATE POLICY "instructors_update" ON instructors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "instructors_insert" ON instructors FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Alunos: dono pode ler/editar, instrutores podem ver dados básicos
CREATE POLICY "students_select_own" ON students FOR SELECT USING (true);
CREATE POLICY "students_update" ON students FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "students_insert" ON students FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Disponibilidade: todos podem ler, dono pode editar
CREATE POLICY "availability_select" ON availability FOR SELECT USING (true);
CREATE POLICY "availability_all" ON availability FOR ALL USING (
  instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
);

-- Busy slots: todos podem ler, dono pode gerenciar
CREATE POLICY "busy_slots_select" ON busy_slots FOR SELECT USING (true);
CREATE POLICY "busy_slots_all" ON busy_slots FOR ALL USING (
  instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
);

-- Aulas: participantes podem ver/gerenciar
CREATE POLICY "classes_select" ON classes FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  OR instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
);
CREATE POLICY "classes_insert" ON classes FOR INSERT WITH CHECK (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "classes_update" ON classes FOR UPDATE USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  OR instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
);

-- Reviews: todos podem ler, aluno da aula pode criar
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- Feedback: todos podem ler, instrutor da aula pode criar
CREATE POLICY "instructor_feedback_select" ON instructor_feedback FOR SELECT USING (true);
CREATE POLICY "instructor_feedback_insert" ON instructor_feedback FOR INSERT WITH CHECK (
  instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
);

-- 4. FUNCTIONS (helpers)
-- ============================================================

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'instructor' THEN
    INSERT INTO public.instructors (user_id, name, email, phone)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', ''),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'phone', '')
    );
  ELSE
    INSERT INTO public.students (user_id, name, email, phone, cpf)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', ''),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      COALESCE(NEW.raw_user_meta_data->>'cpf', '')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que dispara após novo signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para recalcular rating do instrutor
CREATE OR REPLACE FUNCTION public.update_instructor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE instructors SET
    rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE instructor_id = NEW.instructor_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE instructor_id = NEW.instructor_id),
    updated_at = NOW()
  WHERE id = NEW.instructor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_created ON reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_instructor_rating();
