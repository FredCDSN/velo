import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Search, Filter, Star, Calendar, MessageCircle, CheckCircle2, Car, User, Home, 
  TrendingUp, Users, Settings, ChevronRight, Clock, DollarSign, LogOut, Mail, Lock, 
  ArrowLeft, AlertTriangle, Upload, Loader2, ChevronLeft, Calendar as CalendarIcon, Trash2, X
} from 'lucide-react';
import { cn } from './lib/utils';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from './lib/supabase';

type UserRole = 'student' | 'instructor' | null;
type Screen = 'splash' | 'onboarding' | 'auth' | 'register' | 'student-home' | 'student-schedule' | 'student-progress' | 'student-profile' | 'instructor-profile-view' | 'instructor-dashboard' | 'instructor-schedule' | 'instructor-students' | 'instructor-profile';

interface Instructor { id: string; user_id: string; name: string; email?: string; phone?: string; image_url: string; vehicle_image_url: string; vehicle_model: string; vehicle_plate?: string; vehicle_year?: string; rating: number; total_reviews: number; price: number; location: string; bio: string; transmission: 'Manual' | 'Automatic'; type: 'Credenciado' | 'Autônomo'; }
interface StudentProfile { id: string; user_id: string; name: string; email: string; phone: string; cpf: string; image_url: string; has_ladv: boolean; }
interface ScheduledClass { id: string; instructor_id: string; student_id: string; date: string; time: string; status: string; price: number; check_in_time?: string; instructor_name?: string; instructor_image?: string; student_name?: string; student_image?: string; instructor_feedback?: string; student_rating?: number; }

const Button = ({ className, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }) => {
  const v: any = { primary: 'bg-velo-blue text-white hover:bg-velo-blue-dark shadow-md', secondary: 'bg-velo-green text-white hover:bg-velo-green-dark shadow-md', outline: 'border-2 border-velo-blue text-velo-blue hover:bg-velo-blue-light', ghost: 'text-slate-600 hover:bg-slate-100' };
  return <button className={cn("px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none", v[variant], className)} {...props} />;
};
const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-100 p-4", className)} {...props}>{children}</div>;
const Input = ({ className, icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) => (
  <div className="relative">{icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</div>}<input className={cn("w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-velo-blue/20", icon && "pl-10", className)} {...props} /></div>
);
const Toast = ({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={cn("fixed top-4 left-4 right-4 z-[100] p-4 rounded-xl text-white font-medium text-sm text-center max-w-md mx-auto shadow-lg", type === 'success' ? 'bg-velo-green' : 'bg-red-500')}>{message}</motion.div>;
};

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-velo-blue flex flex-col items-center justify-center text-white z-50" onClick={onFinish}>
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl"><Car size={48} className="text-velo-blue" /></div>
      <h1 className="text-4xl font-bold tracking-tight">Velo</h1>
      <p className="mt-2 text-velo-blue-light text-lg">Direção segura, futuro certo.</p>
    </motion.div>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-10 text-sm opacity-70">Toque para começar</motion.p>
  </motion.div>
);

const OnboardingScreen = ({ onSelectRole }: { onSelectRole: (r: UserRole) => void }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen flex flex-col p-6 bg-white">
    <div className="flex-1 flex flex-col justify-center items-center text-center">
      <div className="w-20 h-20 bg-velo-blue-light rounded-full flex items-center justify-center mb-8"><User size={40} className="text-velo-blue" /></div>
      <h2 className="text-3xl font-bold text-slate-900 mb-4">Bem-vindo ao Velo</h2>
      <p className="text-slate-500 mb-12 max-w-xs">Conectamos você aos melhores instrutores ou aos alunos que precisam da sua experiência.</p>
      <div className="w-full space-y-4 max-w-sm">
        <Button className="w-full text-lg py-4" onClick={() => onSelectRole('student')}>Sou Aluno</Button>
        <Button variant="outline" className="w-full text-lg py-4" onClick={() => onSelectRole('instructor')}>Sou Instrutor</Button>
      </div>
    </div>
  </motion.div>
);

const AuthScreen = ({ role, onLogin, onRegister, onBack }: { role: UserRole; onLogin: (e: string, p: string) => Promise<void>; onRegister: () => void; onBack: () => void }) => {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setError(''); setLoading(true); try { await onLogin(email, password); } catch (err: any) { setError(err.message); } setLoading(false); };
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen bg-white p-6 flex flex-col">
      <button onClick={onBack} className="self-start p-2 -ml-2 text-slate-400"><ArrowLeft size={24} /></button>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="mb-8"><h1 className="text-3xl font-bold text-slate-900 mb-2">Login {role === 'student' ? 'Aluno' : 'Instrutor'}</h1><p className="text-slate-500">Entre para continuar sua jornada.</p></div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input type="email" placeholder="Seu e-mail" icon={<Mail size={20} />} value={email} onChange={e => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Sua senha" icon={<Lock size={20} />} value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
          <Button className="w-full py-4 text-lg mt-4" disabled={loading}>{loading ? <Loader2 size={20} className="animate-spin" /> : 'Entrar'}</Button>
        </form>
        <div className="mt-8 text-center"><p className="text-slate-500">Não tem uma conta?{' '}<button onClick={onRegister} className="text-velo-blue font-bold hover:underline">Cadastre-se</button></p></div>
      </div>
    </motion.div>
  );
};

const RegisterScreen = ({ role, onRegister, onBack }: { role: UserRole; onRegister: (d: any) => Promise<void>; onBack: () => void }) => {
  const isStudent = role === 'student';
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [cpf, setCpf] = useState('');
  const [iType, setIType] = useState<'Credenciado' | 'Autônomo'>('Credenciado'); const [vehicleModel, setVehicleModel] = useState('');
  const [credential, setCredential] = useState(''); const [bio, setBio] = useState(''); const [location, setLocation] = useState('');
  const [price, setPrice] = useState(''); const [transmission, setTransmission] = useState<'Manual' | 'Automatic'>('Manual');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (password !== confirmPassword) { setError('Senhas não conferem.'); return; }
    if (password.length < 6) { setError('Senha mínimo 6 caracteres.'); return; }
    setLoading(true);
    try { await onRegister({ email, password, name, phone, cpf, role, type: iType, vehicleModel, credential, bio, location, price: parseFloat(price) || 0, transmission }); }
    catch (err: any) { setError(err.message); }
    setLoading(false);
  };
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen bg-white p-6 flex flex-col overflow-y-auto">
      <button onClick={onBack} className="self-start p-2 -ml-2 text-slate-400"><ArrowLeft size={24} /></button>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-8">
        <div className="mb-8"><h1 className="text-3xl font-bold text-slate-900 mb-2">Criar Conta {isStudent ? 'Aluno' : 'Instrutor'}</h1><p className="text-slate-500">Preencha seus dados.</p></div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input placeholder="Nome completo" icon={<User size={20} />} value={name} onChange={e => setName(e.target.value)} required />
          <Input type="email" placeholder="Seu e-mail" icon={<Mail size={20} />} value={email} onChange={e => setEmail(e.target.value)} required />
          <Input type="tel" placeholder="Celular (WhatsApp)" icon={<MessageCircle size={20} />} value={phone} onChange={e => setPhone(e.target.value)} />
          {isStudent && <Input placeholder="CPF" value={cpf} onChange={e => setCpf(e.target.value)} />}
          {!isStudent && (<>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">{(['Credenciado','Autônomo'] as const).map(t=><button key={t} type="button" onClick={()=>setIType(t)} className={cn("flex-1 py-2 rounded-lg text-sm font-medium",iType===t?"bg-white text-velo-blue shadow-sm":"text-slate-500")}>{t}</button>)}</div>
            <Input placeholder="Modelo do Veículo" icon={<Car size={20} />} value={vehicleModel} onChange={e=>setVehicleModel(e.target.value)} required />
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">{(['Manual','Automatic'] as const).map(t=><button key={t} type="button" onClick={()=>setTransmission(t)} className={cn("flex-1 py-2 rounded-lg text-sm font-medium",transmission===t?"bg-white text-velo-blue shadow-sm":"text-slate-500")}>{t==='Manual'?'Manual':'Automático'}</button>)}</div>
            <Input type="number" placeholder="Preço por hora (R$)" icon={<DollarSign size={20} />} value={price} onChange={e=>setPrice(e.target.value)} required />
            <Input placeholder="Localização (ex: Centro, SP)" icon={<MapPin size={20} />} value={location} onChange={e=>setLocation(e.target.value)} required />
            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-velo-blue/20 min-h-[80px]" placeholder="Sua bio" value={bio} onChange={e=>setBio(e.target.value)} />
            {iType==='Credenciado' && <Input placeholder="Credencial CFC" icon={<CheckCircle2 size={20} />} value={credential} onChange={e=>setCredential(e.target.value)} />}
          </>)}
          <Input type="password" placeholder="Crie uma senha" icon={<Lock size={20} />} value={password} onChange={e=>setPassword(e.target.value)} required />
          <Input type="password" placeholder="Confirme a senha" icon={<Lock size={20} />} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />
          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
          <Button className="w-full py-4 text-lg mt-6" disabled={loading}>{loading ? <Loader2 size={20} className="animate-spin" /> : 'Cadastrar'}</Button>
        </form>
        <div className="mt-8 text-center"><p className="text-slate-500">Já tem conta?{' '}<button onClick={onBack} className="text-velo-blue font-bold hover:underline">Faça Login</button></p></div>
      </div>
    </motion.div>
  );
};

const StudentHome = ({ onSelectInstructor, userImg }: { onSelectInstructor: (i: Instructor) => void; userImg?: string }) => {
  const [q, setQ] = useState(''); const [instructors, setInstructors] = useState<Instructor[]>([]); const [loading, setLoading] = useState(true);
  const fetch2 = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('instructors').select('*').order('rating', { ascending: false });
    if (q) query = query.or(`name.ilike.%${q}%,location.ilike.%${q}%`);
    const { data } = await query;
    setInstructors((data || []) as Instructor[]);
    setLoading(false);
  }, [q]);
  useEffect(() => { fetch2(); }, [fetch2]);
  return (
    <div className="pb-24 pt-6 px-4 space-y-8 bg-white min-h-screen">
      <header className="flex justify-between items-center pt-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vamos dirigir<br/>hoje?</h1>
        <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden border border-slate-100 flex items-center justify-center">
          {userImg ? <img src={userImg} alt="" className="w-full h-full object-cover" /> : <User size={24} className="text-slate-400" />}
        </div>
      </header>
      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="text" placeholder="Buscar por nome ou local..." value={q} onChange={e=>setQ(e.target.value)} className="w-full bg-slate-50 border-0 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-velo-blue/10" /></div>
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Instrutores Disponíveis</h2>
        {loading ? <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-velo-blue" /></div> : instructors.length > 0 ? instructors.map(i => (
          <div key={i.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]" onClick={() => onSelectInstructor(i)}>
            <div className="relative"><div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-slate-200 flex items-center justify-center">{i.image_url ? <img src={i.image_url} alt={i.name} className="w-full h-full object-cover" /> : <User size={28} className="text-slate-400" />}</div><div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm"><div className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Star size={8} fill="currentColor" />{Number(i.rating).toFixed(1)}</div></div></div>
            <div className="flex-1 min-w-0"><h3 className="font-bold text-slate-900 text-lg truncate">{i.name}</h3><p className="text-slate-500 text-sm truncate">{i.vehicle_model || 'Veículo não informado'}</p><div className="flex gap-2 mt-1"><span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{i.transmission==='Automatic'?'Automático':'Manual'}</span><span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{i.type}</span></div></div>
            <div className="text-right"><p className="text-lg font-bold text-slate-900">R$ {Number(i.price).toFixed(0)}</p><p className="text-xs text-slate-400">/hora</p></div>
          </div>
        )) : <div className="text-center py-12"><Search size={24} className="mx-auto text-slate-300 mb-4" /><p className="text-slate-500 font-medium">Nenhum instrutor encontrado</p><p className="text-slate-400 text-sm mt-1">Ainda não há instrutores cadastrados</p></div>}
      </section>
    </div>
  );
};

const CalendarWidget = ({ selectedDate, onSelectDate }: { selectedDate: Date | null; onSelectDate: (d: Date) => void }) => {
  const [cm, setCm] = useState(new Date());
  const ms = startOfMonth(cm); const days = eachDayOfInterval({ start: startOfWeek(ms), end: endOfWeek(endOfMonth(ms)) });
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={()=>setCm(subMonths(cm,1))} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
        <h3 className="font-bold text-slate-900 capitalize">{format(cm,'MMMM yyyy',{locale:ptBR})}</h3>
        <button onClick={()=>setCm(addMonths(cm,1))} className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight size={20} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">{['D','S','T','Q','Q','S','S'].map((d,i)=><div key={i} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">{days.map((day,i)=>{
        const sel=selectedDate&&isSameDay(day,selectedDate); const cur=isSameMonth(day,cm); const td=isToday(day); const past=isBefore(day,startOfDay(new Date()));
        return <button key={i} onClick={()=>!past&&onSelectDate(day)} disabled={past} className={cn("h-9 w-9 rounded-full flex items-center justify-center text-sm",!cur&&"text-slate-300",past&&"text-slate-200",cur&&!sel&&!past&&"text-slate-700 hover:bg-slate-100",sel&&"bg-velo-blue text-white font-medium shadow-md",td&&!sel&&"text-velo-blue font-bold bg-blue-50")}>{format(day,'d')}</button>;
      })}</div>
    </div>
  );
};

const InstructorProfileView = ({ instructor, onBack, onBookClass }: { instructor: Instructor; onBack: () => void; onBookClass: (d: string, t: string) => Promise<void> }) => {
  const [selTime, setSelTime] = useState<string|null>(null); const [selDate, setSelDate] = useState(new Date()); const [times, setTimes] = useState<string[]>([]); const [lt, setLt] = useState(false);
  const [showBook, setShowBook] = useState(false); const [showOk, setShowOk] = useState(false); const [booking, setBooking] = useState(false);
  const fetchT = useCallback(async()=>{
    setLt(true); const ds=format(selDate,'yyyy-MM-dd'); const dow=selDate.getDay();
    const {data:av, error:avErr}=await supabase.from('availability').select('start_time,end_time,is_enabled').eq('instructor_id',instructor.id).eq('day_of_week',dow).maybeSingle();
    if(avErr || !av || !av.is_enabled){setTimes([]);setLt(false);return;}
    const sh=parseInt(av.start_time.split(':')[0]),eh=parseInt(av.end_time.split(':')[0]);
    if(sh>=eh){setTimes([]);setLt(false);return;}
    let sl:string[]=[]; for(let h=sh;h<eh;h++)sl.push(`${h.toString().padStart(2,'0')}:00`);
    const now=new Date(); if(isBefore(selDate,startOfDay(now))){setTimes([]);setLt(false);return;}
    if(isSameDay(selDate,now))sl=sl.filter(t=>parseInt(t)>now.getHours());
    const {data:busy}=await supabase.from('busy_slots').select('start_time,end_time').eq('instructor_id',instructor.id).eq('date',ds);
    const bt:string[]=[]; for(const b of busy||[]){const s2=parseInt(b.start_time.split(':')[0]),e2=parseInt(b.end_time.split(':')[0]);for(let h=s2;h<e2;h++)bt.push(`${h.toString().padStart(2,'0')}:00`);}
    const {data:cls}=await supabase.from('classes').select('time').eq('instructor_id',instructor.id).eq('date',ds).in('status',['upcoming','in-progress']);
    const bk=(cls||[]).map(c=>c.time.substring(0,5)); sl=sl.filter(t=>!bt.includes(t)&&!bk.includes(t)); setTimes(sl); setLt(false);
  },[selDate,instructor.id]);
  useEffect(()=>{fetchT();},[fetchT]);
  const doBook=async()=>{if(!selTime)return;setBooking(true);try{await onBookClass(format(selDate,'yyyy-MM-dd'),selTime);setShowBook(false);setShowOk(true);}catch(e:any){alert(e.message);}setBooking(false);};
  return (
    <div className="bg-white min-h-screen pb-32">
      <div className="pt-6 px-4"><button onClick={onBack} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600"><ChevronLeft size={24} /></button></div>
      <div className="px-6">
        <div className="flex flex-col items-center text-center mb-8 mt-4">
          <div className="w-28 h-28 rounded-full border-2 border-slate-100 bg-slate-200 overflow-hidden mb-4 flex items-center justify-center">{instructor.image_url?<img src={instructor.image_url} alt="" className="w-full h-full object-cover"/>:<User size={48} className="text-slate-400"/>}</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{instructor.name}</h1>
          <p className="text-slate-500 text-sm flex items-center gap-1 mb-3"><MapPin size={14}/>{instructor.location||'—'}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className={cn("text-xs px-3 py-1.5 rounded-full font-medium border",instructor.type==='Credenciado'?"bg-blue-50 text-velo-blue border-blue-100":"bg-orange-50 text-orange-600 border-orange-100")}>{instructor.type}</span>
            <span className="text-xs px-3 py-1.5 rounded-full font-medium border border-slate-100 bg-slate-50 text-slate-600">{instructor.vehicle_model||'—'}</span>
            <span className="text-xs px-3 py-1.5 rounded-full font-medium border border-slate-100 bg-slate-50 text-slate-600">{instructor.transmission==='Automatic'?'Automático':'Manual'}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-slate-50 rounded-2xl p-4 border text-center"><span className="text-slate-400 text-[10px] font-bold uppercase">Valor/Hora</span><br/><span className="text-xl font-bold text-slate-900">R$ {Number(instructor.price).toFixed(0)}</span></div>
          <div className="bg-slate-50 rounded-2xl p-4 border text-center"><span className="text-slate-400 text-[10px] font-bold uppercase">Avaliações</span><br/><span className="text-xl font-bold text-slate-900">{instructor.total_reviews}</span></div>
        </div>
        {instructor.bio&&<div className="mb-8"><h3 className="font-bold text-slate-900 mb-2">Sobre</h3><p className="text-slate-600 text-sm">{instructor.bio}</p></div>}
        <h3 className="font-bold text-slate-900 mb-4">Disponibilidade</h3>
        <CalendarWidget selectedDate={selDate} onSelectDate={d=>{setSelDate(d);setSelTime(null);}} />
        <div className="mt-6">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Horários para {format(selDate,"dd 'de' MMMM",{locale:ptBR})}</h4>
          {lt?<div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-velo-blue"/></div>:times.length>0?<div className="grid grid-cols-4 gap-2">{times.map(t=><button key={t} onClick={()=>setSelTime(t)} className={cn("py-2 rounded-lg border text-sm font-medium",selTime===t?"bg-velo-blue text-white border-velo-blue":"border-slate-200 hover:border-velo-blue bg-white")}>{t}</button>)}</div>:<div className="bg-slate-50 rounded-xl p-8 text-center border"><CalendarIcon className="mx-auto text-slate-300 mb-2" size={32}/><p className="text-slate-500 text-sm">Sem horários nesta data.</p></div>}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t z-20 max-w-md mx-auto"><Button className="w-full text-lg py-4" onClick={()=>{if(!selTime)return;setShowBook(true);}} disabled={!selTime}>Agendar {selTime?`(${selTime})`:''}</Button></div>
      <AnimatePresence>
        {showBook&&<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/50" onClick={()=>setShowBook(false)}/><motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}} className="bg-white rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-2xl"><h3 className="text-xl font-bold mb-2">Confirmar</h3><p className="text-slate-600 mb-4">Agendar com <b>{instructor.name}</b> às <b>{selTime}</b>?</p><div className="bg-slate-50 p-4 rounded-xl mb-6 flex justify-between"><span className="text-slate-600">Valor</span><span className="text-xl font-bold text-velo-blue">R$ {Number(instructor.price).toFixed(0)}</span></div><div className="flex gap-3"><Button variant="ghost" className="flex-1" onClick={()=>setShowBook(false)}>Cancelar</Button><Button className="flex-1" onClick={doBook} disabled={booking}>{booking?<Loader2 size={20} className="animate-spin"/>:'Confirmar'}</Button></div></motion.div></div>}
        {showOk&&<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute inset-0 bg-black/50"/><motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="bg-white rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-2xl text-center"><CheckCircle2 size={32} className="text-velo-green mx-auto mb-4"/><h3 className="text-xl font-bold mb-2">Aula Agendada!</h3><p className="text-slate-600 mb-6">{format(selDate,"dd/MM/yyyy")} às {selTime}</p><Button className="w-full" onClick={()=>{setShowOk(false);onBack();}}>Voltar</Button></motion.div></div>}
      </AnimatePresence>
    </div>
  );
};

const StudentSchedule = ({ classes, onCancel, onRefresh }: { classes: ScheduledClass[]; onCancel: (id: string) => Promise<void>; onRefresh: () => void }) => {
  const up = classes.filter(c => c.status === 'upcoming').sort((a, b) => a.date.localeCompare(b.date));
  const past = classes.filter(c => c.status === 'completed' || c.status === 'cancelled').sort((a, b) => b.date.localeCompare(a.date));
  const [confirmId, setConfirmId] = useState<string|null>(null);
  const [cancelling, setCancelling] = useState(false);
  const doCancel = async () => { if(!confirmId) return; setCancelling(true); await onCancel(confirmId); setCancelling(false); setConfirmId(null); onRefresh(); };
  return (
    <div className="pb-24 pt-6 px-4 space-y-6">
      <header><h1 className="text-2xl font-bold text-slate-900">Minhas Aulas</h1></header>
      <section><h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Calendar size={20} className="text-velo-blue"/>Próximas</h2>
        {up.length>0?up.map(c=><Card key={c.id} className="border-l-4 border-l-velo-blue mb-3">
          <div className="flex justify-between items-start">
            <div><p className="font-bold text-slate-900">{c.instructor_name||'Instrutor'}</p><p className="text-sm text-slate-500 flex items-center gap-1"><Clock size={14}/>{format(new Date(c.date+'T12:00:00'),"dd 'de' MMM",{locale:ptBR})} às {c.time?.substring(0,5)}</p></div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-50 text-velo-blue">Agendada</span>
              <button onClick={()=>setConfirmId(c.id)} className="text-xs text-red-500 font-medium px-2 py-1 rounded-md hover:bg-red-50 flex items-center gap-1"><X size={12}/>Cancelar</button>
            </div>
          </div>
        </Card>):<div className="text-center py-8 bg-slate-50 rounded-xl border-dashed border"><p className="text-slate-500">Nenhuma aula agendada.</p><p className="text-xs text-slate-400 mt-1">Busque um instrutor para agendar</p></div>}
      </section>
      <section><h2 className="text-lg font-bold text-slate-900 mb-4">Histórico</h2>
        {past.length>0?past.map(c=><Card key={c.id} className={cn("mb-3", c.status==='cancelled'?"bg-red-50/50 border-l-4 border-l-red-300":"bg-slate-50")}>
          <div className="flex justify-between items-start">
            <div><p className="font-bold text-slate-900">{c.instructor_name}</p><p className="text-sm text-slate-500">{c.date} às {c.time?.substring(0,5)}</p></div>
            <span className={cn("text-xs font-bold px-2 py-1 rounded-full",c.status==='completed'?"bg-green-100 text-green-700":"bg-red-100 text-red-700")}>{c.status==='completed'?'Concluída':'Cancelada'}</span>
          </div>
          {c.status==='cancelled'&&<p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertTriangle size={12}/>Esta aula foi cancelada</p>}
          {c.instructor_feedback&&<div className="mt-3 bg-blue-50 p-3 rounded-lg text-xs"><b className="text-velo-blue">Feedback:</b> {c.instructor_feedback}</div>}
        </Card>):<p className="text-sm text-slate-400 text-center py-4">Sem histórico.</p>}
      </section>
      <AnimatePresence>
        {confirmId&&<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setConfirmId(null)}/>
          <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}} className="bg-white rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32}/></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Cancelar Aula?</h3>
            <p className="text-slate-600 mb-6">O instrutor será notificado sobre o cancelamento. Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={()=>setConfirmId(null)}>Manter</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={doCancel} disabled={cancelling}>{cancelling?<Loader2 size={20} className="animate-spin"/>:'Sim, cancelar'}</Button>
            </div>
          </motion.div>
        </div>}
      </AnimatePresence>
    </div>
  );
};

const StudentProgress = ({ classes }: { classes: ScheduledClass[] }) => {
  const done = classes.filter(c => c.status === 'completed'); const tot = 20; const pct = Math.min((done.length / tot) * 100, 100);
  return (
    <div className="pb-24 pt-6 px-4 space-y-6">
      <header><h1 className="text-2xl font-bold text-slate-900">Meu Progresso</h1></header>
      <Card className="bg-gradient-to-br from-velo-blue to-velo-blue-dark text-white border-none p-6">
        <p className="text-velo-blue-light text-sm mb-1">Aulas Realizadas</p>
        <div className="flex items-baseline gap-2 mb-4"><span className="text-4xl font-bold">{done.length}</span><span className="text-lg text-velo-blue-light/70">/ {tot}</span></div>
        <div className="h-3 bg-black/20 rounded-full overflow-hidden"><motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:1}} className="h-full bg-velo-green"/></div>
      </Card>
    </div>
  );
};

const InstructorDashboard = ({ classes, name }: { classes: ScheduledClass[]; name: string }) => {
  const today = classes.filter(c => c.date === format(new Date(), 'yyyy-MM-dd') && c.status === 'upcoming');
  const earn = classes.filter(c => c.status === 'completed').reduce((a, c) => a + Number(c.price), 0);
  const activeClasses = classes.filter(c => c.status === 'upcoming' || c.status === 'completed').length;
  return (
    <div className="pb-24 pt-6 px-4 space-y-6">
      <header><p className="text-slate-500 text-sm">Bem-vindo,</p><h1 className="text-2xl font-bold text-slate-900">{name}</h1></header>
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-velo-blue text-white border-none"><DollarSign size={24} className="text-velo-blue-light mb-2"/><p className="text-3xl font-bold">R$ {earn}</p><p className="text-xs text-velo-blue-light mt-1">Ganhos</p></Card>
        <Card><Users size={24} className="text-velo-blue mb-2"/><p className="text-3xl font-bold text-slate-900">{activeClasses}</p><p className="text-xs text-slate-500 mt-1">Aulas</p></Card>
      </div>
      <section><h2 className="text-lg font-bold text-slate-900 mb-4">Hoje</h2>
        {today.length>0?today.map(c=><Card key={c.id} className="mb-3 border-l-4 border-l-velo-blue"><div className="flex justify-between items-center"><div><p className="font-bold">{c.student_name||'Aluno'}</p><p className="text-sm text-slate-500">{c.time?.substring(0,5)}</p></div><span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-50 text-velo-blue">Agendada</span></div></Card>):<p className="text-slate-400 text-sm text-center py-4">Sem aulas hoje.</p>}
      </section>
    </div>
  );
};

const dayNames = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

interface AvailSlot { id?: string; instructor_id: string; day_of_week: number; start_time: string; end_time: string; is_enabled: boolean; }

const InstructorScheduleScreen = ({ instructorId, classes, onCancelClass, onRefresh }: { instructorId: string; classes: ScheduledClass[]; onCancelClass: (id: string) => Promise<void>; onRefresh: () => void }) => {
  const [tab, setTab] = useState<'agenda'|'disponibilidade'>('agenda');
  const [availability, setAvailability] = useState<AvailSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cancellingId, setCancellingId] = useState<string|null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string|null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from('availability').select('*').eq('instructor_id', instructorId).order('day_of_week');
      if (data && data.length > 0) {
        setAvailability(data as AvailSlot[]);
      } else {
        const defaults: AvailSlot[] = [];
        for (let d = 0; d <= 6; d++) defaults.push({ instructor_id: instructorId, day_of_week: d, start_time: d === 0 ? '00:00' : '08:00', end_time: d === 0 ? '00:00' : (d === 6 ? '13:00' : '18:00'), is_enabled: d !== 0 });
        setAvailability(defaults);
      }
      setLoading(false);
    };
    load();
  }, [instructorId]);

  const toggleDay = (day: number) => { setAvailability(prev => prev.map(a => a.day_of_week === day ? { ...a, is_enabled: !a.is_enabled } : a)); setSaved(false); };
  const updateTime = (day: number, field: 'start_time' | 'end_time', value: string) => { setAvailability(prev => prev.map(a => a.day_of_week === day ? { ...a, [field]: value } : a)); setSaved(false); };

  const saveAvailability = async () => {
    setSaving(true);
    // Use individual upserts to avoid RLS issues with delete
    let hasError = false;
    for (const a of availability) {
      // Try to find existing record
      const { data: existing } = await supabase.from('availability')
        .select('id').eq('instructor_id', instructorId).eq('day_of_week', a.day_of_week).maybeSingle();
      
      if (existing) {
        // Update existing
        const { error } = await supabase.from('availability')
          .update({ start_time: a.start_time, end_time: a.end_time, is_enabled: a.is_enabled })
          .eq('id', existing.id);
        if (error) { console.error('Update error:', error); hasError = true; }
      } else {
        // Insert new
        const { error } = await supabase.from('availability')
          .insert({ instructor_id: instructorId, day_of_week: a.day_of_week, start_time: a.start_time, end_time: a.end_time, is_enabled: a.is_enabled });
        if (error) { console.error('Insert error:', error); hasError = true; }
      }
    }
    setSaving(false);
    if (!hasError) setSaved(true);
  };

  const doCancel = async (id: string) => {
    setCancellingId(id);
    await onCancelClass(id);
    setCancellingId(null);
    setConfirmCancelId(null);
    onRefresh();
  };

  const upcoming = classes.filter(c => c.status === 'upcoming').sort((a, b) => a.date.localeCompare(b.date));
  const cancelled = classes.filter(c => c.status === 'cancelled').sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="pb-24 pt-6 px-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Minha Agenda</h1>
        <p className="text-slate-500 text-sm">{tab === 'agenda' ? 'Aulas e calendário' : 'Configure seus horários'}</p>
      </header>

      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button onClick={() => setTab('agenda')} className={cn("flex-1 py-2.5 text-sm font-bold rounded-lg transition-all", tab === 'agenda' ? "bg-white text-velo-blue shadow-sm" : "text-slate-500")}>Aulas</button>
        <button onClick={() => setTab('disponibilidade')} className={cn("flex-1 py-2.5 text-sm font-bold rounded-lg transition-all", tab === 'disponibilidade' ? "bg-white text-velo-blue shadow-sm" : "text-slate-500")}>Disponibilidade</button>
      </div>

      {tab === 'agenda' ? (
        <div className="space-y-6">
          {upcoming.length > 0 ? (
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Próximas aulas</h2>
              {upcoming.map(c => (
                <Card key={c.id} className="border-l-4 border-l-velo-blue mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900">{c.student_name || 'Aluno'}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1"><Clock size={14} />{format(new Date(c.date + 'T12:00:00'), "dd 'de' MMM", { locale: ptBR })} às {c.time?.substring(0, 5)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-bold text-velo-blue">R$ {Number(c.price).toFixed(0)}</span>
                      <button onClick={() => setConfirmCancelId(c.id)} className="text-xs text-red-500 font-medium px-2 py-1 rounded-md hover:bg-red-50 flex items-center gap-1">
                        <X size={12} /> Cancelar
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </section>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CalendarIcon size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Sem aulas agendadas</p>
              <p className="text-slate-400 text-sm mt-1">Quando um aluno agendar, aparecerá aqui</p>
            </div>
          )}

          {cancelled.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Canceladas</h2>
              {cancelled.slice(0, 5).map(c => (
                <Card key={c.id} className="bg-red-50/50 border-l-4 border-l-red-300 mb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-700">{c.student_name || 'Aluno'}</p>
                      <p className="text-xs text-slate-500">{c.date} às {c.time?.substring(0, 5)}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-600">Cancelada</span>
                  </div>
                </Card>
              ))}
            </section>
          )}
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-velo-blue" /></div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Configure os dias e horários em que você está disponível. Os alunos só poderão agendar nos horários definidos aqui.</p>
          {(() => {
            return [1, 2, 3, 4, 5, 6, 0].map(day => {
              const slot = availability.find(a => a.day_of_week === day);
              if (!slot) return null;
              return (
                <div key={day} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-slate-700">{dayNames[day]}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={slot.is_enabled} onChange={() => toggleDay(day)} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-velo-blue"></div>
                    </label>
                  </div>
                  {slot.is_enabled && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 mb-1 block">Início</label>
                        <select value={slot.start_time} onChange={e => updateTime(day, 'start_time', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white">
                          {Array.from({ length: 15 }, (_, i) => i + 6).map(h => <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>{`${h.toString().padStart(2, '0')}:00`}</option>)}
                        </select>
                      </div>
                      <span className="text-slate-400 mt-5">até</span>
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 mb-1 block">Fim</label>
                        <select value={slot.end_time} onChange={e => updateTime(day, 'end_time', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white">
                          {Array.from({ length: 15 }, (_, i) => i + 7).map(h => <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>{`${h.toString().padStart(2, '0')}:00`}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()}
          <Button className="w-full py-4 text-lg" onClick={saveAvailability} disabled={saving}>
            {saving ? <Loader2 size={20} className="animate-spin" /> : saved ? <><CheckCircle2 size={20} /> Salvo!</> : 'Salvar Disponibilidade'}
          </Button>
        </div>
      )}

      <AnimatePresence>
        {confirmCancelId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmCancelId(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Cancelar Aula?</h3>
              <p className="text-slate-600 mb-6">O aluno será notificado sobre o cancelamento.</p>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setConfirmCancelId(null)}>Manter</Button>
                <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={() => doCancel(confirmCancelId)} disabled={cancellingId === confirmCancelId}>
                  {cancellingId === confirmCancelId ? <Loader2 size={20} className="animate-spin" /> : 'Sim, cancelar'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavButton = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={cn("flex flex-col items-center gap-1", active ? "text-velo-blue" : "text-slate-400")}>{icon}<span className="text-[10px] font-medium">{label}</span></button>
);

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string|null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile|null>(null);
  const [instructorProfile, setInstructorProfile] = useState<Instructor|null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor|null>(null);
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [toast, setToast] = useState<{message:string;type:'success'|'error'}|null>(null);
  const nav = (s: Screen) => { setScreen(s); window.scrollTo(0, 0); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { const r = session.user.user_metadata?.role as UserRole; setUserId(session.user.id); setUserRole(r); loadProfile(session.user.id, r); }
    });
  }, []);

  const loadProfile = async (uid: string, role: UserRole) => {
    if (role === 'student') {
      const { data } = await supabase.from('students').select('*').eq('user_id', uid).single();
      if (data) { setStudentProfile(data as any); nav('student-home'); loadStudentClasses(data.id); }
    } else {
      const { data } = await supabase.from('instructors').select('*').eq('user_id', uid).single();
      if (data) { setInstructorProfile(data as any); nav('instructor-dashboard'); loadInstructorClasses(data.id); }
    }
  };

  const loadStudentClasses = async (sid: string) => {
    const { data } = await supabase.from('classes').select('*, instructor:instructors(name,image_url), feedback:instructor_feedback(feedback)').eq('student_id', sid).order('date', { ascending: false });
    setClasses((data || []).map((c: any) => ({ ...c, instructor_name: c.instructor?.name, instructor_feedback: Array.isArray(c.feedback) ? c.feedback[0]?.feedback : c.feedback?.feedback })));
  };

  const loadInstructorClasses = async (iid: string) => {
    const { data } = await supabase.from('classes').select('*, student:students(name,image_url), feedback:instructor_feedback(feedback)').eq('instructor_id', iid).order('date', { ascending: false });
    setClasses((data || []).map((c: any) => ({ ...c, student_name: c.student?.name, instructor_feedback: Array.isArray(c.feedback) ? c.feedback[0]?.feedback : c.feedback?.feedback })));
  };

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('E-mail ou senha inválidos.');
    const role = data.user?.user_metadata?.role as UserRole;
    if (role !== userRole) throw new Error(`Esta conta é de ${role === 'student' ? 'aluno' : 'instrutor'}.`);
    setUserId(data.user!.id); await loadProfile(data.user!.id, role);
  };

  const handleRegister = async (fd: any) => {
    const { data, error } = await supabase.auth.signUp({ email: fd.email, password: fd.password, options: { data: { role: fd.role, name: fd.name, phone: fd.phone, cpf: fd.cpf } } });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Erro ao criar conta.');
    await new Promise(r => setTimeout(r, 1500));
    if (fd.role === 'instructor') {
      await supabase.from('instructors').update({ bio: fd.bio, location: fd.location, price: fd.price, transmission: fd.transmission, type: fd.type, vehicle_model: fd.vehicleModel, credential_number: fd.credential }).eq('user_id', data.user.id);
      const { data: idata } = await supabase.from('instructors').select('id').eq('user_id', data.user.id).single();
      if (idata) { const slots: any[] = []; for (let d = 1; d <= 5; d++) slots.push({ instructor_id: idata.id, day_of_week: d, start_time: '08:00', end_time: '18:00', is_enabled: true }); slots.push({ instructor_id: idata.id, day_of_week: 6, start_time: '09:00', end_time: '13:00', is_enabled: true }); slots.push({ instructor_id: idata.id, day_of_week: 0, start_time: '00:00', end_time: '00:00', is_enabled: false }); await supabase.from('availability').insert(slots); }
    }
    setUserId(data.user.id); setUserRole(fd.role); setToast({ message: 'Conta criada com sucesso!', type: 'success' }); await loadProfile(data.user.id, fd.role);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setUserId(null); setUserRole(null); setStudentProfile(null); setInstructorProfile(null); setClasses([]); nav('onboarding'); };

  const handleBookClass = async (date: string, time: string) => {
    if (!studentProfile || !selectedInstructor) return;
    const { error } = await supabase.from('classes').insert({ instructor_id: selectedInstructor.id, student_id: studentProfile.id, date, time, price: selectedInstructor.price, status: 'upcoming' });
    if (error) throw new Error(error.message);
    await loadStudentClasses(studentProfile.id);
  };

  const handleCancel = async (id: string) => { await supabase.from('classes').update({ status: 'cancelled' }).eq('id', id); };

  const showNav = !['splash', 'onboarding', 'auth', 'register', 'instructor-profile-view'].includes(screen);

  return (
    <div className="bg-slate-50 min-h-screen font-sans max-w-md mx-auto shadow-2xl relative overflow-hidden">
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>
      <AnimatePresence mode="wait"><motion.div key={screen} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="min-h-screen">{
        screen === 'splash' ? <SplashScreen onFinish={() => nav('onboarding')} /> :
        screen === 'onboarding' ? <OnboardingScreen onSelectRole={r => { setUserRole(r); nav('auth'); }} /> :
        screen === 'auth' ? <AuthScreen role={userRole} onLogin={handleLogin} onRegister={() => nav('register')} onBack={() => { setUserRole(null); nav('onboarding'); }} /> :
        screen === 'register' ? <RegisterScreen role={userRole} onRegister={handleRegister} onBack={() => nav('auth')} /> :
        screen === 'student-home' ? <StudentHome onSelectInstructor={i => { setSelectedInstructor(i); nav('instructor-profile-view'); }} userImg={studentProfile?.image_url} /> :
        screen === 'student-schedule' ? <StudentSchedule classes={classes} onCancel={handleCancel} onRefresh={() => studentProfile && loadStudentClasses(studentProfile.id)} /> :
        screen === 'student-progress' ? <StudentProgress classes={classes} /> :
        screen === 'student-profile' ? (
          <div className="pb-24 pt-6 px-4 space-y-6">
            <header className="flex flex-col items-center pt-8 pb-6">
              <div className="w-24 h-24 bg-slate-200 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md flex items-center justify-center">{studentProfile?.image_url?<img src={studentProfile.image_url} alt="" className="w-full h-full object-cover"/>:<User size={40} className="text-slate-400"/>}</div>
              <h2 className="text-xl font-bold text-slate-900">{studentProfile?.name}</h2><p className="text-slate-500">Aluno</p>
            </header>
            <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50" onClick={handleLogout}><LogOut size={18}/> Sair</Button>
          </div>
        ) :
        screen === 'instructor-profile-view' && selectedInstructor ? <InstructorProfileView instructor={selectedInstructor} onBack={() => nav('student-home')} onBookClass={handleBookClass} /> :
        screen === 'instructor-dashboard' ? <InstructorDashboard classes={classes} name={instructorProfile?.name||''} /> :
        screen === 'instructor-schedule' ? (
          <InstructorScheduleScreen instructorId={instructorProfile?.id||''} classes={classes} onCancelClass={handleCancel} onRefresh={() => instructorProfile && loadInstructorClasses(instructorProfile.id)} />
        ) :
        screen === 'instructor-students' ? (
          <div className="pb-24 pt-6 px-4"><h1 className="text-2xl font-bold text-slate-900 mb-6">Meus Alunos</h1>
            {[...new Map(classes.map(c=>[c.student_name,c])).values()].map((c,i)=><Card key={i} className="flex items-center gap-4 mb-3"><div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">{c.student_name?.charAt(0)||'A'}</div><p className="font-bold text-slate-900">{c.student_name||'Aluno'}</p></Card>)}
            {classes.length===0&&<p className="text-center text-slate-400 py-8">Nenhum aluno.</p>}
          </div>
        ) :
        screen === 'instructor-profile' ? (
          <div className="pb-24 pt-6 px-4 space-y-6">
            <header className="flex flex-col items-center pt-8 pb-6">
              <div className="w-24 h-24 bg-slate-200 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md flex items-center justify-center">{instructorProfile?.image_url?<img src={instructorProfile.image_url} alt="" className="w-full h-full object-cover"/>:<User size={40} className="text-slate-400"/>}</div>
              <h2 className="text-xl font-bold text-slate-900">{instructorProfile?.name}</h2>
              <p className="text-slate-500">Instrutor {instructorProfile?.type}</p>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin size={14}/>{instructorProfile?.location||'—'}</p>
              <p className="mt-1"><span className="text-velo-blue font-bold">R$ {Number(instructorProfile?.price||0).toFixed(0)}</span><span className="text-slate-400 text-xs"> /hora</span></p>
            </header>
            {instructorProfile?.bio&&<p className="text-slate-600 text-sm text-center">{instructorProfile.bio}</p>}
            <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50" onClick={handleLogout}><LogOut size={18}/> Sair</Button>
          </div>
        ) : null
      }</motion.div></AnimatePresence>
      {showNav && <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40 max-w-md mx-auto">
        {userRole === 'student' ? <>
          <NavButton icon={<Search size={24}/>} label="Buscar" active={screen==='student-home'} onClick={()=>nav('student-home')} />
          <NavButton icon={<Calendar size={24}/>} label="Aulas" active={screen==='student-schedule'} onClick={()=>{if(studentProfile)loadStudentClasses(studentProfile.id);nav('student-schedule');}} />
          <NavButton icon={<TrendingUp size={24}/>} label="Progresso" active={screen==='student-progress'} onClick={()=>nav('student-progress')} />
          <NavButton icon={<User size={24}/>} label="Perfil" active={screen==='student-profile'} onClick={()=>nav('student-profile')} />
        </> : <>
          <NavButton icon={<Home size={24}/>} label="Início" active={screen==='instructor-dashboard'} onClick={()=>nav('instructor-dashboard')} />
          <NavButton icon={<Calendar size={24}/>} label="Agenda" active={screen==='instructor-schedule'} onClick={()=>nav('instructor-schedule')} />
          <NavButton icon={<Users size={24}/>} label="Alunos" active={screen==='instructor-students'} onClick={()=>nav('instructor-students')} />
          <NavButton icon={<User size={24}/>} label="Perfil" active={screen==='instructor-profile'} onClick={()=>nav('instructor-profile')} />
        </>}
      </div>}
    </div>
  );
}
