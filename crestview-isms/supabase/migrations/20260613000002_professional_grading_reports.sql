ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS assignment_score NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS quiz_score NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS midterm_score NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS class_assessment_score NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS exam_score NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS total_score NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS subject_name TEXT,
  ADD COLUMN IF NOT EXISTS term_label TEXT,
  ADD COLUMN IF NOT EXISTS analysis JSONB NOT NULL DEFAULT '{}'::JSONB;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_assignment_score_range;
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_quiz_score_range;
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_midterm_score_range;
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_class_assessment_score_range;
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_exam_score_range;
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_total_score_range;

ALTER TABLE public.grades
  ADD CONSTRAINT grades_assignment_score_range CHECK (assignment_score IS NULL OR assignment_score BETWEEN 0 AND 10),
  ADD CONSTRAINT grades_quiz_score_range CHECK (quiz_score IS NULL OR quiz_score BETWEEN 0 AND 10),
  ADD CONSTRAINT grades_midterm_score_range CHECK (midterm_score IS NULL OR midterm_score BETWEEN 0 AND 10),
  ADD CONSTRAINT grades_class_assessment_score_range CHECK (class_assessment_score IS NULL OR class_assessment_score BETWEEN 0 AND 30),
  ADD CONSTRAINT grades_exam_score_range CHECK (exam_score IS NULL OR exam_score BETWEEN 0 AND 70),
  ADD CONSTRAINT grades_total_score_range CHECK (total_score IS NULL OR total_score BETWEEN 0 AND 100);

CREATE INDEX IF NOT EXISTS idx_grades_student_term ON public.grades(student_id, term_label) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_grades_item_total ON public.grades(grade_item_id, total_score DESC) WHERE deleted_at IS NULL;

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS analysis JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS attendance_summary JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS grade_summary JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS attitude TEXT,
  ADD COLUMN IF NOT EXISTS punctuality TEXT,
  ADD COLUMN IF NOT EXISTS next_steps TEXT,
  ADD COLUMN IF NOT EXISTS classroom_id UUID REFERENCES public.classrooms(id),
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB;

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE public.reports
  ADD CONSTRAINT reports_status_check CHECK (status IN ('draft', 'published', 'archived'));

CREATE INDEX IF NOT EXISTS idx_reports_student_year_term ON public.reports(student_id, academic_year_id, term) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reports_classroom_status ON public.reports(classroom_id, status) WHERE deleted_at IS NULL;

UPDATE public.school_settings
SET value = jsonb_build_object(
    'class_score_weight', 30,
    'exam_weight', 70,
    'components', jsonb_build_array(
      jsonb_build_object('key', 'assignment', 'label', 'Assignment', 'max', 10),
      jsonb_build_object('key', 'quiz', 'label', 'Class Quizzes', 'max', 10),
      jsonb_build_object('key', 'midterm', 'label', 'Mid-term Exams', 'max', 10),
      jsonb_build_object('key', 'exam', 'label', 'End of Term Examination', 'max', 70)
    ),
    'total', 100,
    'system', 'Crestview WAEC/GES aligned 30/70'
  ),
  updated_at = NOW()
WHERE key = 'academic_assessment_policy';

INSERT INTO public.grade_items (course_id, title, category, max_score, weight, published_at, metadata)
SELECT
  c.id,
  'End of Term Subject Report',
  'term_report',
  100,
  1,
  NOW(),
  '{"template":"crestview_30_70","assignment_max":10,"quiz_max":10,"midterm_max":10,"class_assessment_max":30,"exam_max":70,"total_max":100}'::JSONB
FROM public.courses c
WHERE c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.grade_items gi
    WHERE gi.course_id = c.id
      AND gi.category = 'term_report'
      AND gi.deleted_at IS NULL
  );
