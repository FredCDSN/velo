import { supabase } from './supabase';

// ══════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════

export async function signUp(
  email: string,
  password: string,
  metadata: { name: string; phone?: string; role: 'student' | 'instructor'; cpf?: string }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ══════════════════════════════════════════
// INSTRUCTORS
// ══════════════════════════════════════════

interface InstructorFilters {
  search?: string;
  maxPrice?: number;
  minRating?: number;
  transmission?: string;
  type?: string;
}

export async function listInstructors(filters: InstructorFilters = {}) {
  let query = supabase
    .from('instructors')
    .select('*')
    .order('rating', { ascending: false });

  if (filters.maxPrice) {
    query = query.lte('price', filters.maxPrice);
  }
  if (filters.minRating) {
    query = query.gte('rating', filters.minRating);
  }
  if (filters.transmission && filters.transmission !== 'Todos') {
    query = query.eq('transmission', filters.transmission);
  }
  if (filters.type && filters.type !== 'Todos') {
    query = query.eq('type', filters.type);
  }
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getInstructor(id: string) {
  const { data, error } = await supabase
    .from('instructors')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getInstructorByUserId(userId: string) {
  const { data, error } = await supabase
    .from('instructors')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateInstructorProfile(userId: string, updates: Record<string, any>) {
  const { error } = await supabase
    .from('instructors')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateInstructorVehicle(
  userId: string,
  vehicle: { vehicle_model?: string; vehicle_plate?: string; vehicle_year?: string }
) {
  const { error } = await supabase
    .from('instructors')
    .update({ ...vehicle, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}

// ══════════════════════════════════════════
// AVAILABILITY
// ══════════════════════════════════════════

export async function getAvailability(instructorId: string) {
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('day_of_week');
  if (error) throw error;
  return data || [];
}

export async function setAvailability(
  instructorId: string,
  slots: { day_of_week: number; start_time: string; end_time: string; is_enabled: boolean }[]
) {
  // Delete existing
  await supabase.from('availability').delete().eq('instructor_id', instructorId);

  // Insert new
  const { error } = await supabase
    .from('availability')
    .insert(slots.map(s => ({ ...s, instructor_id: instructorId })));
  if (error) throw error;
}

// ══════════════════════════════════════════
// BUSY SLOTS
// ══════════════════════════════════════════

export async function getBusySlots(instructorId: string) {
  const { data, error } = await supabase
    .from('busy_slots')
    .select('*')
    .eq('instructor_id', instructorId)
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date');
  if (error) throw error;
  return data || [];
}

export async function addBusySlot(
  instructorId: string,
  slot: { date: string; start_time: string; end_time: string; reason?: string }
) {
  const { data, error } = await supabase
    .from('busy_slots')
    .insert({ ...slot, instructor_id: instructorId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeBusySlot(id: string) {
  const { error } = await supabase.from('busy_slots').delete().eq('id', id);
  if (error) throw error;
}

// ══════════════════════════════════════════
// AVAILABLE TIMES (computed)
// ══════════════════════════════════════════

export async function getAvailableTimes(instructorId: string, dateStr: string) {
  const dateObj = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = dateObj.getDay();

  // Get availability for that day
  const { data: availData } = await supabase
    .from('availability')
    .select('start_time, end_time, is_enabled')
    .eq('instructor_id', instructorId)
    .eq('day_of_week', dayOfWeek)
    .single();

  if (!availData || !availData.is_enabled) return [];

  const startHour = parseInt(availData.start_time.split(':')[0]);
  const endHour = parseInt(availData.end_time.split(':')[0]);

  let slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
  }

  // Filter past times
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

  if (target < today) return [];
  if (target.getTime() === today.getTime()) {
    const currentHour = now.getHours();
    slots = slots.filter(t => parseInt(t.split(':')[0]) > currentHour);
  }

  // Remove busy slots
  const { data: busyData } = await supabase
    .from('busy_slots')
    .select('start_time, end_time')
    .eq('instructor_id', instructorId)
    .eq('date', dateStr);

  const busyTimes: string[] = [];
  for (const b of busyData || []) {
    const s = parseInt(b.start_time.split(':')[0]);
    const e = parseInt(b.end_time.split(':')[0]);
    for (let h = s; h < e; h++) busyTimes.push(`${h.toString().padStart(2, '0')}:00`);
  }

  // Remove booked classes
  const { data: classData } = await supabase
    .from('classes')
    .select('time')
    .eq('instructor_id', instructorId)
    .eq('date', dateStr)
    .in('status', ['upcoming', 'in-progress']);

  const bookedTimes = (classData || []).map(c => c.time.substring(0, 5));
  const allBusy = [...busyTimes, ...bookedTimes];

  return slots.filter(t => !allBusy.includes(t));
}

// ══════════════════════════════════════════
// STUDENTS
// ══════════════════════════════════════════

export async function getStudentByUserId(userId: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateStudentProfile(userId: string, updates: Record<string, any>) {
  const { error } = await supabase
    .from('students')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function uploadLadv(userId: string, file: File) {
  const ext = file.name.split('.').pop();
  const path = `ladv/${userId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);

  await supabase
    .from('students')
    .update({ has_ladv: true, ladv_file_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  return urlData.publicUrl;
}

// ══════════════════════════════════════════
// CLASSES
// ══════════════════════════════════════════

export async function bookClass(
  instructorId: string,
  studentId: string,
  date: string,
  time: string,
  price: number
) {
  // Check for conflicts
  const { data: conflict } = await supabase
    .from('classes')
    .select('id')
    .eq('instructor_id', instructorId)
    .eq('date', date)
    .eq('time', time)
    .in('status', ['upcoming', 'in-progress']);

  if (conflict && conflict.length > 0) {
    throw new Error('Este horário já está ocupado.');
  }

  const { data, error } = await supabase
    .from('classes')
    .insert({
      instructor_id: instructorId,
      student_id: studentId,
      date,
      time,
      price,
      status: 'upcoming',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getClassesForStudent(studentId: string) {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      instructor:instructors(id, name, image_url, vehicle_model),
      review:reviews(rating, comment),
      feedback:instructor_feedback(feedback)
    `)
    .eq('student_id', studentId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getClassesForInstructor(instructorId: string) {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      student:students(id, name, image_url, phone),
      review:reviews(rating, comment),
      feedback:instructor_feedback(feedback)
    `)
    .eq('instructor_id', instructorId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function cancelClass(classId: string) {
  const { error } = await supabase
    .from('classes')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', classId);
  if (error) throw error;
}

export async function checkInClass(classId: string) {
  const { error } = await supabase
    .from('classes')
    .update({
      status: 'in-progress',
      check_in_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', classId);
  if (error) throw error;
}

export async function checkOutClass(classId: string, checkInTime: string) {
  const checkOut = new Date();
  const checkIn = new Date(checkInTime);
  const durationMinutes = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 60000));

  const { error } = await supabase
    .from('classes')
    .update({
      status: 'completed',
      check_out_time: checkOut.toISOString(),
      duration_minutes: durationMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', classId);
  if (error) throw error;

  return { checkOutTime: checkOut, durationMinutes };
}

// ══════════════════════════════════════════
// REVIEWS & FEEDBACK
// ══════════════════════════════════════════

export async function addReview(
  classId: string,
  studentId: string,
  instructorId: string,
  rating: number,
  comment?: string
) {
  const { error } = await supabase
    .from('reviews')
    .insert({ class_id: classId, student_id: studentId, instructor_id: instructorId, rating, comment });
  if (error) throw error;
  // Rating is recalculated automatically by the DB trigger
}

export async function addInstructorFeedback(
  classId: string,
  instructorId: string,
  feedback: string
) {
  const { error } = await supabase
    .from('instructor_feedback')
    .insert({ class_id: classId, instructor_id: instructorId, feedback });
  if (error) throw error;
}

// ══════════════════════════════════════════
// INSTRUCTOR'S STUDENTS LIST
// ══════════════════════════════════════════

export async function getInstructorStudents(instructorId: string) {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      student:students(id, name, image_url, phone, has_ladv, total_hours_completed)
    `)
    .eq('instructor_id', instructorId);
  if (error) throw error;

  // Deduplicate students
  const seen = new Set<string>();
  const students: any[] = [];
  for (const row of data || []) {
    const s = (row as any).student;
    if (s && !seen.has(s.id)) {
      seen.add(s.id);
      students.push(s);
    }
  }
  return students;
}
