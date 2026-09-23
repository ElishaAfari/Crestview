type ClassroomLabelInput = {
  name?: string | null;
  gradeLevel?: string | null;
  grade_level?: string | null;
};

function clean(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

/** Use one class name when grade level and class name describe the same class. */
export function formatClassroomLabel(classroom: ClassroomLabelInput | null | undefined, fallback = "Class") {
  const name = clean(classroom?.name);
  const gradeLevel = clean(classroom?.gradeLevel ?? classroom?.grade_level);
  if (!name) return gradeLevel || fallback;
  if (!gradeLevel || name.localeCompare(gradeLevel, undefined, { sensitivity: "accent" }) === 0) return name;
  return `${gradeLevel} - ${name}`;
}
