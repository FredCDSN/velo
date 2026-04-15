import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Search, 
  Filter, 
  Star, 
  Calendar, 
  MessageCircle, 
  CheckCircle2, 
  Car, 
  User, 
  Home, 
  TrendingUp, 
  Users, 
  Settings,
  ChevronRight,
  Clock,
  DollarSign,
  LogOut,
  Mail,
  Lock,
  ArrowLeft,
  AlertTriangle,
  Upload,
  Loader2,
  ChevronLeft,
  Calendar as CalendarIcon,
  Trash2,
  X
} from 'lucide-react';
import { cn } from './lib/utils';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addDays,
  isBefore,
  startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Types ---

type UserRole = 'student' | 'instructor' | null;
type Screen = 'splash' | 'onboarding' | 'auth' | 'register' | 'student-home' | 'student-schedule' | 'student-progress' | 'student-profile' | 'student-settings' | 'student-payments' | 'student-personal-data' | 'instructor-profile-view' | 'instructor-dashboard' | 'instructor-schedule' | 'instructor-students' | 'instructor-student-detail' | 'instructor-profile' | 'instructor-edit-profile' | 'instructor-vehicle';

interface Availability {
  dayOfWeek: number; // 0-6 (Sun-Sat)
  startTime: string; // "08:00"
  endTime: string; // "18:00"
  isEnabled: boolean;
}

interface BusySlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  reason?: string;
}

interface Instructor {
  id: string;
  name: string;
  image: string;
  vehicleImage: string;
  vehicleModel: string;
  rating: number;
  reviews: number;
  price: number;
  location: string;
  bio: string;
  transmission: 'Manual' | 'Automatic';
  type: 'Credenciado' | 'Autônomo';
  // Extended details
  vehiclePlate?: string;
  vehicleYear?: string;
  availability?: Availability[];
  busySlots?: BusySlot[];
}

interface Student {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  image: string;
}

interface ScheduledClass {
  id: string;
  instructorId: string;
  instructorName: string;
  date: Date;
  time: string;
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  price: number;
  studentFeedback?: {
    rating: number;
    text: string;
  };
  instructorFeedback?: string;
  studentName?: string;
  studentImage?: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  durationMinutes?: number;
}

// --- Mock Data ---

const MOCK_INSTRUCTORS: Instructor[] = [
  {
    id: '1',
    name: 'Carlos Silva',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    vehicleImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
    vehicleModel: 'Hyundai HB20 (2023)',
    rating: 4.9,
    reviews: 124,
    price: 60,
    location: 'Centro, São Paulo',
    bio: 'Instrutor credenciado há 10 anos. Especialista em baliza e direção defensiva. Paciente e didático.',
    transmission: 'Manual',
    type: 'Credenciado',
    vehiclePlate: 'ABC-1234',
    vehicleYear: '2023',
    availability: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '18:00', isEnabled: true },
      { dayOfWeek: 2, startTime: '08:00', endTime: '18:00', isEnabled: true },
      { dayOfWeek: 3, startTime: '08:00', endTime: '18:00', isEnabled: true },
      { dayOfWeek: 4, startTime: '08:00', endTime: '18:00', isEnabled: true },
      { dayOfWeek: 5, startTime: '08:00', endTime: '18:00', isEnabled: true },
      { dayOfWeek: 6, startTime: '09:00', endTime: '14:00', isEnabled: true },
      { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isEnabled: false },
    ],
    busySlots: []
  },
  {
    id: '2',
    name: 'Fernanda Oliveira',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    vehicleImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop',
    vehicleModel: 'Honda City (Automatic)',
    rating: 5.0,
    reviews: 89,
    price: 75,
    location: 'Vila Mariana, São Paulo',
    bio: 'Aulas focadas em quem tem medo de dirigir. Metodologia calma e progressiva.',
    transmission: 'Automatic',
    type: 'Autônomo',
    vehiclePlate: 'XYZ-9876',
    vehicleYear: '2022'
  },
  {
    id: '3',
    name: 'Roberto Santos',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    vehicleImage: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&h=600&fit=crop',
    vehicleModel: 'Chevrolet Onix',
    rating: 4.7,
    reviews: 56,
    price: 55,
    location: 'Pinheiros, São Paulo',
    bio: 'Instrutor jovem e dinâmico. Horários flexíveis inclusive aos finais de semana.',
    transmission: 'Manual',
    type: 'Credenciado',
    vehiclePlate: 'DEF-5678',
    vehicleYear: '2021'
  },
  {
    id: '4',
    name: 'Juliana Lima',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    vehicleImage: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    vehicleModel: 'Volkswagen Polo',
    rating: 4.8,
    reviews: 42,
    price: 65,
    location: 'Moema, São Paulo',
    bio: 'Especialista em trânsito pesado e rodovias. Aulas práticas e seguras.',
    transmission: 'Manual',
    type: 'Autônomo',
    vehiclePlate: 'GHI-1234',
    vehicleYear: '2022'
  },
  {
    id: '5',
    name: 'Ricardo Alves',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    vehicleImage: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop',
    vehicleModel: 'Toyota Corolla',
    rating: 4.6,
    reviews: 31,
    price: 90,
    location: 'Itaim Bibi, São Paulo',
    bio: 'Foco em direção executiva e conforto. Veículo premium para melhor aprendizado.',
    transmission: 'Automatic',
    type: 'Credenciado',
    vehiclePlate: 'JKL-5678',
    vehicleYear: '2023'
  },
  {
    id: '6',
    name: 'Beatriz Costa',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    vehicleImage: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&h=600&fit=crop',
    vehicleModel: 'Fiat Argo',
    rating: 4.9,
    reviews: 75,
    price: 50,
    location: 'Santana, São Paulo',
    bio: 'Aulas econômicas e eficientes. Ótima taxa de aprovação dos alunos.',
    transmission: 'Manual',
    type: 'Autônomo',
    vehiclePlate: 'MNO-9012',
    vehicleYear: '2021'
  }
];

// --- Components ---

const Button = ({ className, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }) => {
  const variants = {
    primary: 'bg-velo-blue text-white hover:bg-velo-blue-dark shadow-md',
    secondary: 'bg-velo-green text-white hover:bg-velo-green-dark shadow-md',
    outline: 'border-2 border-velo-blue text-velo-blue hover:bg-velo-blue-light',
    ghost: 'text-slate-600 hover:bg-slate-100'
  };
  
  return (
    <button 
      className={cn(
        "px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-100 p-4", className)} {...props}>
    {children}
  </div>
);

const Input = ({ className, icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) => (
  <div className="relative">
    {icon && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        {icon}
      </div>
    )}
    <input 
      className={cn(
        "w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-velo-blue/20 transition-all",
        icon && "pl-10",
        className
      )}
      {...props}
    />
  </div>
);

// --- Screens ---

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-velo-blue flex flex-col items-center justify-center text-white z-50"
      onClick={onFinish}
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl">
          <Car size={48} className="text-velo-blue" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Velo</h1>
        <p className="mt-2 text-velo-blue-light text-lg">Direção segura, futuro certo.</p>
      </motion.div>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 text-sm opacity-70"
      >
        Toque para começar
      </motion.p>
    </motion.div>
  );
};

const OnboardingScreen = ({ onSelectRole }: { onSelectRole: (role: UserRole) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex flex-col p-6 bg-white"
    >
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className="w-20 h-20 bg-velo-blue-light rounded-full flex items-center justify-center mb-8">
          <User size={40} className="text-velo-blue" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Bem-vindo ao Velo</h2>
        <p className="text-slate-500 mb-12 max-w-xs">
          Conectamos você aos melhores instrutores ou aos alunos que precisam da sua experiência.
        </p>

        <div className="w-full space-y-4 max-w-sm">
          <Button 
            className="w-full text-lg py-4" 
            onClick={() => onSelectRole('student')}
          >
            Sou Aluno
          </Button>
          <Button 
            variant="outline" 
            className="w-full text-lg py-4" 
            onClick={() => onSelectRole('instructor')}
          >
            Sou Instrutor
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const AuthScreen = ({ role, onLogin, onRegister, onBack }: { role: UserRole, onLogin: () => void, onRegister: () => void, onBack: () => void }) => {
  const isStudent = role === 'student';

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-white p-6 flex flex-col"
    >
      <button onClick={onBack} className="self-start p-2 -ml-2 text-slate-400 hover:text-slate-600">
        <ArrowLeft size={24} />
      </button>
      
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Login {isStudent ? 'Aluno' : 'Instrutor'}
          </h1>
          <p className="text-slate-500">Entre para continuar sua jornada.</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <Input 
            type="email" 
            placeholder="Seu e-mail" 
            icon={<Mail size={20} />} 
          />
          <Input 
            type="password" 
            placeholder="Sua senha" 
            icon={<Lock size={20} />} 
          />
          
          <div className="text-right">
            <button type="button" className="text-sm text-velo-blue font-medium hover:underline">
              Esqueceu a senha?
            </button>
          </div>

          <Button className="w-full py-4 text-lg mt-4">
            Entrar
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500">
            Não tem uma conta?{' '}
            <button onClick={onRegister} className="text-velo-blue font-bold hover:underline">
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const RegisterScreen = ({ role, onRegister, onBack }: { role: UserRole, onRegister: (hasLadv?: boolean) => void, onBack: () => void }) => {
  const isStudent = role === 'student';
  const [instructorType, setInstructorType] = useState<'Credenciado' | 'Autônomo'>('Credenciado');
  const [ladvFile, setLadvFile] = useState<File | null>(null);

  const handleRegister = () => {
    onRegister(!!ladvFile);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-white p-6 flex flex-col"
    >
      <button onClick={onBack} className="self-start p-2 -ml-2 text-slate-400 hover:text-slate-600">
        <ArrowLeft size={24} />
      </button>
      
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Criar Conta {isStudent ? 'Aluno' : 'Instrutor'}
          </h1>
          <p className="text-slate-500">Preencha seus dados para começar.</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
          <Input 
            type="text" 
            placeholder="Nome completo" 
            icon={<User size={20} />} 
          />
          <Input 
            type="email" 
            placeholder="Seu e-mail" 
            icon={<Mail size={20} />} 
          />
          <Input 
            type="tel" 
            placeholder="Celular (WhatsApp)" 
            icon={<MessageCircle size={20} />} 
          />
          
          {isStudent ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">LADV (Opcional)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  accept=".pdf,.jpg,.png" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setLadvFile(e.target.files?.[0] || null)}
                />
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  {ladvFile ? (
                    <>
                      <CheckCircle2 className="text-velo-green" size={24} />
                      <span className="text-sm font-medium text-slate-900">{ladvFile.name}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <User size={20} />
                      </div>
                      <span className="text-sm">Toque para enviar foto ou PDF</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400">Necessário apenas para agendar aulas.</p>
            </div>
          ) : (
            <>
              <div className="flex gap-4 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setInstructorType('Credenciado')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    instructorType === 'Credenciado' ? "bg-white text-velo-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Credenciado
                </button>
                <button
                  type="button"
                  onClick={() => setInstructorType('Autônomo')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    instructorType === 'Autônomo' ? "bg-white text-velo-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Autônomo
                </button>
              </div>

              <Input 
                type="text" 
                placeholder="Modelo do Veículo" 
                icon={<Car size={20} />} 
              />
              
              {instructorType === 'Credenciado' && (
                <Input 
                  type="text" 
                  placeholder="Número da Credencial (CFC)" 
                  icon={<CheckCircle2 size={20} />} 
                />
              )}
            </>
          )}

          <Input 
            type="password" 
            placeholder="Crie uma senha" 
            icon={<Lock size={20} />} 
          />
          <Input 
            type="password" 
            placeholder="Confirme a senha" 
            icon={<Lock size={20} />} 
          />

          <Button className="w-full py-4 text-lg mt-6">
            Cadastrar
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500">
            Já tem uma conta?{' '}
            <button onClick={onBack} className="text-velo-blue font-bold hover:underline">
              Faça Login
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// --- Student Flow ---

const FilterModal = ({ 
  isOpen, 
  onClose, 
  filters, 
  onApply 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  filters: any, 
  onApply: (filters: any) => void 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-lg relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900">Filtros Avançados</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-8">
          {/* Price Range */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-900">Preço Máximo (R$)</label>
              <span className="text-velo-blue font-bold">Até R$ {localFilters.maxPrice}</span>
            </div>
            <input 
              type="range" 
              min="40" 
              max="150" 
              step="5"
              value={localFilters.maxPrice}
              onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-velo-blue"
            />
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>R$ 40</span>
              <span>R$ 150</span>
            </div>
          </div>

          {/* Min Rating */}
          <div className="space-y-4">
            <label className="font-bold text-slate-900 block">Avaliação Mínima</label>
            <div className="flex gap-2">
              {[0, 3, 3.5, 4, 4.5, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setLocalFilters({ ...localFilters, minRating: rating })}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-1",
                    localFilters.minRating === rating
                      ? "bg-slate-900 text-white border-slate-900 shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {rating === 0 ? 'Todas' : (
                    <>
                      <Star size={14} className={cn(localFilters.minRating === rating ? "fill-white" : "fill-yellow-400 text-yellow-400")} />
                      {rating}+
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Transmission */}
          <div className="space-y-4">
            <label className="font-bold text-slate-900 block">Câmbio</label>
            <div className="flex gap-3">
              {['Todos', 'Manual', 'Automatic'].map((t) => (
                <button
                  key={t}
                  onClick={() => setLocalFilters({ ...localFilters, transmission: t })}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-bold border transition-all",
                    localFilters.transmission === t
                      ? "bg-velo-blue text-white border-velo-blue shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {t === 'Todos' ? 'Todos' : t === 'Manual' ? 'Manual' : 'Automático'}
                </button>
              ))}
            </div>
          </div>

          {/* Instructor Type */}
          <div className="space-y-4">
            <label className="font-bold text-slate-900 block">Tipo de Instrutor</label>
            <div className="flex gap-3">
              {['Todos', 'Credenciado', 'Autônomo'].map((type) => (
                <button
                  key={type}
                  onClick={() => setLocalFilters({ ...localFilters, type: type })}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-bold border transition-all",
                    localFilters.type === type
                      ? "bg-velo-green text-white border-velo-green shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-3">
          <Button 
            variant="ghost" 
            className="flex-1" 
            onClick={() => {
              const reset = { maxPrice: 150, minRating: 0, transmission: 'Todos', type: 'Todos' };
              setLocalFilters(reset);
              onApply(reset);
            }}
          >
            Limpar
          </Button>
          <Button 
            className="flex-1" 
            onClick={() => {
              onApply(localFilters);
              onClose();
            }}
          >
            Aplicar Filtros
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const StudentHome = ({ onSelectInstructor }: { onSelectInstructor: (id: string) => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: 150,
    minRating: 0,
    transmission: 'Todos',
    type: 'Todos'
  });

  const filteredInstructors = MOCK_INSTRUCTORS.filter(instructor => {
    const matchesSearch = instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          instructor.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (instructor.price > filters.maxPrice) return false;
    if (instructor.rating < filters.minRating) return false;
    if (filters.transmission !== 'Todos' && instructor.transmission !== filters.transmission) return false;
    if (filters.type !== 'Todos' && instructor.type !== filters.type) return false;

    return true;
  });

  const activeFilterCount = (filters.maxPrice < 150 ? 1 : 0) + 
                            (filters.minRating > 0 ? 1 : 0) + 
                            (filters.transmission !== 'Todos' ? 1 : 0) + 
                            (filters.type !== 'Todos' ? 1 : 0);

  return (
    <div className="pb-24 pt-6 px-4 space-y-8 bg-white min-h-screen">
      <header className="flex justify-between items-center pt-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vamos dirigir<br/>hoje?</h1>
        <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
          <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </header>

      {/* Search & Filter */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-velo-blue transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou local..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-0 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-velo-blue/10 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsFilterModalOpen(true)}
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative",
              activeFilterCount > 0 
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            )}
          >
            <Filter size={24} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-velo-blue text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {filters.maxPrice < 150 && (
              <span className="px-3 py-1.5 bg-blue-50 text-velo-blue text-xs font-bold rounded-full border border-blue-100 whitespace-nowrap">
                Até R$ {filters.maxPrice}
              </span>
            )}
            {filters.minRating > 0 && (
              <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full border border-yellow-100 flex items-center gap-1 whitespace-nowrap">
                <Star size={12} className="fill-yellow-400" /> {filters.minRating}+
              </span>
            )}
            {filters.transmission !== 'Todos' && (
              <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200 whitespace-nowrap">
                {filters.transmission === 'Manual' ? 'Manual' : 'Automático'}
              </span>
            )}
            {filters.type !== 'Todos' && (
              <span className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 whitespace-nowrap">
                {filters.type}
              </span>
            )}
            <button 
              onClick={() => setFilters({ maxPrice: 150, minRating: 0, transmission: 'Todos', type: 'Todos' })}
              className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              Limpar Tudo
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isFilterModalOpen && (
          <FilterModal 
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            filters={filters}
            onApply={setFilters}
          />
        )}
      </AnimatePresence>

      {/* Instructors List */}
      <section className="space-y-4">
        {filteredInstructors.length > 0 ? (
          filteredInstructors.map((instructor) => (
            <div 
              key={instructor.id} 
              className="group flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/40 transition-all cursor-pointer active:scale-[0.99]"
              onClick={() => onSelectInstructor(instructor.id)}
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                  <img src={instructor.image} alt={instructor.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                  <div className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Star size={8} fill="currentColor" />
                    {instructor.rating}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">{instructor.name}</h3>
                <p className="text-slate-500 text-sm truncate">{instructor.vehicleModel}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                    {instructor.transmission}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">
                  R$ {instructor.price}
                </p>
                <p className="text-xs text-slate-400 font-medium">/hora</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Search size={24} />
            </div>
            <p className="text-slate-500 font-medium">Nenhum instrutor encontrado</p>
            <p className="text-slate-400 text-sm mt-1">Tente mudar os filtros</p>
          </div>
        )}
      </section>
    </div>
  );
};

const StudentSchedule = ({ classes, onCancelClass, onRateClass }: { classes: ScheduledClass[], onCancelClass: (id: string) => void, onRateClass: (id: string, rating: number, text: string) => void }) => {
  const [classToCancel, setClassToCancel] = useState<string | null>(null);
  const [classToRate, setClassToRate] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  const upcomingClasses = classes.filter(c => c.status === 'upcoming' || c.status === 'in-progress').sort((a, b) => a.date.getTime() - b.date.getTime());
  const pastClasses = classes.filter(c => c.status === 'completed' || c.status === 'cancelled').sort((a, b) => b.date.getTime() - a.date.getTime());

  const handleRateSubmit = () => {
    if (classToRate && rating > 0) {
      onRateClass(classToRate, rating, feedbackText);
      setClassToRate(null);
      setRating(0);
      setFeedbackText('');
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Minhas Aulas</h1>
        <p className="text-slate-500 text-sm">Gerencie seus agendamentos</p>
      </header>

      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-velo-blue" />
          Próximas Aulas
        </h2>
        <div className="space-y-3">
          {upcomingClasses.length > 0 ? (
            upcomingClasses.map((cls) => (
              <Card key={cls.id} className={cn("border-l-4 flex justify-between items-center", cls.status === 'in-progress' ? "border-l-orange-500" : "border-l-velo-blue")}>
                <div>
                  <p className="font-bold text-slate-900">{cls.instructorName}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Clock size={14} />
                    {format(cls.date, "dd 'de' MMM", { locale: ptBR })} às {cls.time}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                   <span className={cn(
                     "text-xs font-bold px-2 py-1 rounded-full",
                     cls.status === 'in-progress' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-velo-blue"
                   )}>
                     {cls.status === 'in-progress' ? 'Em andamento' : 'Agendada'}
                   </span>
                   {cls.status === 'upcoming' && (
                     <button 
                       onClick={() => setClassToCancel(cls.id)}
                       className="text-xs text-red-500 font-medium hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                     >
                       <LogOut size={12} /> Cancelar
                     </button>
                   )}
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
              <p className="text-slate-500">Nenhuma aula agendada.</p>
              <p className="text-xs text-slate-400 mt-1">Que tal buscar um instrutor?</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Histórico</h2>
        <div className="space-y-3">
          {pastClasses.length > 0 ? (
            pastClasses.map((cls) => (
              <Card key={cls.id} className="bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-slate-900">{cls.instructorName}</p>
                    <p className="text-sm text-slate-500">
                      {format(cls.date, "dd/MM/yyyy", { locale: ptBR })} • {cls.time}
                    </p>
                  </div>
                  <span className={cn(
                    "text-xs font-bold px-2 py-1 rounded-full",
                    cls.status === 'completed' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {cls.status === 'completed' ? 'Concluída' : 'Cancelada'}
                  </span>
                </div>
                
                {cls.status === 'completed' && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    {cls.studentFeedback ? (
                      <div className="bg-white p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              className={i < cls.studentFeedback!.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"} 
                            />
                          ))}
                          <span className="text-xs font-bold text-slate-700 ml-1">Sua avaliação</span>
                        </div>
                        <p className="text-xs text-slate-600 italic">"{cls.studentFeedback.text}"</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setClassToRate(cls.id)}
                        className="w-full py-2 text-sm font-medium text-velo-blue bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Star size={16} /> Avaliar Aula
                      </button>
                    )}

                    {cls.instructorFeedback && (
                      <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-xs font-bold text-velo-blue mb-1 flex items-center gap-1">
                          <MessageCircle size={12} /> Feedback do Instrutor
                        </p>
                        <p className="text-xs text-slate-700">"{cls.instructorFeedback}"</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">Nenhum histórico disponível.</p>
          )}
        </div>
      </section>

      <AnimatePresence>
        {classToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setClassToCancel(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">Cancelar Aula?</h3>
              <p className="text-slate-600 mb-6 text-center">
                Tem certeza que deseja cancelar esta aula? Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setClassToCancel(null)}>
                  Não, manter
                </Button>
                <Button 
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white shadow-red-200" 
                  onClick={() => {
                    if (classToCancel) {
                      onCancelClass(classToCancel);
                      setClassToCancel(null);
                    }
                  }}
                >
                  Sim, cancelar
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {classToRate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setClassToRate(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">Avaliar Aula</h3>
              
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star 
                      size={32} 
                      className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"} 
                    />
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Comentário (Opcional)</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-velo-blue focus:border-transparent outline-none resize-none text-sm"
                  rows={3}
                  placeholder="Como foi a aula?"
                />
              </div>
              
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setClassToRate(null)}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-velo-blue hover:bg-velo-blue-dark text-white" 
                  onClick={handleRateSubmit}
                  disabled={rating === 0}
                >
                  Enviar Avaliação
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Calendar Component ---

const CalendarWidget = ({ 
  selectedDate, 
  onSelectDate,
  availableDates = []
}: { 
  selectedDate: Date | null, 
  onSelectDate: (date: Date) => void,
  availableDates?: Date[]
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-600">
          <ChevronLeft size={20} />
        </button>
        <h3 className="font-bold text-slate-900 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-600">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-slate-400 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isDayToday = isToday(day);
          
          return (
            <button
              key={i}
              onClick={() => onSelectDate(day)}
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center text-sm transition-colors relative",
                !isCurrentMonth && "text-slate-300",
                isCurrentMonth && !isSelected && "text-slate-700 hover:bg-slate-100",
                isSelected && "bg-velo-blue text-white font-medium shadow-md",
                isDayToday && !isSelected && "text-velo-blue font-bold bg-blue-50"
              )}
            >
              {format(day, 'd')}
              {isDayToday && !isSelected && (
                <div className="absolute bottom-1 w-1 h-1 bg-velo-blue rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const InstructorProfileView = ({ instructorId, onBack, hasLadv, onUploadLadv, onBookClass, busySlots }: { instructorId: string, onBack: () => void, hasLadv: boolean, onUploadLadv: () => void, onBookClass: (date: Date, time: string, instructor: Instructor) => void, busySlots?: Record<string, string[]> }) => {
  const instructor = MOCK_INSTRUCTORS.find(i => i.id === instructorId) || MOCK_INSTRUCTORS[0];
  const [showWhatsAppAnim, setShowWhatsAppAnim] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLadvAlert, setShowLadvAlert] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleAddToCalendar = () => {
    if (!selectedTime) return;
    
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startDate = new Date(selectedDate);
    startDate.setHours(hours, minutes);
    const endDate = new Date(startDate);
    endDate.setHours(hours + 1, minutes);

    const title = `Aula de Direção com ${instructor.name}`;
    const details = `Aula prática de direção veicular. Veículo: ${instructor.vehicleModel}`;
    const location = instructor.location;

    const formatGCalDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatGCalDate(startDate)}/${formatGCalDate(endDate)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    
    window.open(googleUrl, '_blank');
  };

  // Mock available times based on selected date
  const getAvailableTimes = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const globalBusyTimes = busySlots?.[dateKey] || [];

    // 1. Get base availability from instructor settings
    const dayOfWeek = date.getDay();
    // Default to standard hours if availability not set
    const defaultAvailability = {
      isEnabled: dayOfWeek !== 0, // Closed on Sunday
      startTime: dayOfWeek === 6 ? '08:00' : '08:00',
      endTime: dayOfWeek === 6 ? '12:00' : '18:00'
    };
    
    const dayConfig = instructor.availability?.find(d => d.dayOfWeek === dayOfWeek) || 
                      (instructor.availability ? { isEnabled: false, startTime: '', endTime: '', dayOfWeek } : defaultAvailability);
    
    if (!dayConfig.isEnabled) {
      return [];
    }

    // Generate slots between startTime and endTime
    let slots = [];
    let startHour = parseInt(dayConfig.startTime.split(':')[0]);
    const endHour = parseInt(dayConfig.endTime.split(':')[0]);
    
    for (let h = startHour; h < endHour; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
    }

    // Filter past times
    const now = new Date();
    // If selected date is in the past (before today), return empty
    if (isBefore(date, startOfDay(now))) {
      return [];
    }

    // If selected date is today, filter out past hours
    if (isSameDay(date, now)) {
      const currentHour = now.getHours();
      slots = slots.filter(time => {
        const slotHour = parseInt(time.split(':')[0]);
        return slotHour > currentHour;
      });
    }

    // 2. Filter out busy slots (from instructor.busySlots)
    const instructorBusySlots = instructor.busySlots?.filter(slot => 
      isSameDay(new Date(slot.date), date)
    ) || [];

    const busyTimesFromSlots = instructorBusySlots.flatMap(slot => {
        const start = parseInt(slot.startTime.split(':')[0]);
        const end = parseInt(slot.endTime.split(':')[0]);
        const times = [];
        for(let h = start; h < end; h++) {
            times.push(`${h.toString().padStart(2, '0')}:00`);
        }
        return times;
    });

    const allBusyTimes = [...busyTimesFromSlots, ...globalBusyTimes];

    return slots.filter(time => !allBusyTimes.includes(time));
  };

  const availableTimes = getAvailableTimes(selectedDate);

  const handleWhatsAppClick = () => {
    setShowWhatsAppAnim(true);
    setTimeout(() => {
      setShowWhatsAppAnim(false);
      alert("Redirecionando para o WhatsApp...");
    }, 1500);
  };

  const handleBookClick = () => {
    if (!selectedTime) {
      alert("Por favor, selecione um horário primeiro.");
      return;
    }
    if (!hasLadv) {
      setShowLadvAlert(true);
      return;
    }
    setShowBookingModal(true);
  };

  const confirmBooking = () => {
    if (selectedTime) {
      onBookClass(selectedDate, selectedTime, instructor);
      setShowBookingModal(false);
      setShowSuccessModal(true);
    }
  };

  return (
    <div className="bg-white min-h-screen pb-32">
      {/* Header Actions */}
      <div className="pt-6 px-4 flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="px-6">
        {/* Profile Info */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full p-1 border-2 border-slate-100">
              <img src={instructor.image} alt={instructor.name} className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="absolute bottom-1 right-1 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm border-2 border-white">
              <Star size={10} fill="currentColor" />
              {instructor.rating}
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{instructor.name}</h1>
          <p className="text-slate-500 text-sm flex items-center justify-center gap-1 mb-4">
            <MapPin size={14} /> {instructor.location}
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            <span className={cn(
                "text-xs px-3 py-1.5 rounded-full font-medium border transition-colors",
                instructor.type === 'Credenciado' 
                  ? "bg-blue-50 text-velo-blue border-blue-100" 
                  : "bg-orange-50 text-orange-600 border-orange-100"
              )}>
                {instructor.type}
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full font-medium border border-slate-100 bg-slate-50 text-slate-600 flex items-center gap-1">
               <Car size={12} />
               {instructor.vehicleModel}
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full font-medium border border-slate-100 bg-slate-50 text-slate-600">
               {instructor.transmission}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
           <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center justify-center text-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Valor Hora/Aula</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-bold text-slate-900">R$ {instructor.price}</span>
              </div>
           </div>
           <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center justify-center text-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Experiência</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-bold text-slate-900">{instructor.reviews}</span>
                <span className="text-xs text-slate-500 font-medium">aulas</span>
              </div>
           </div>
        </div>

        {/* Bio */}
        <div className="mb-8">
          <h3 className="font-bold text-slate-900 mb-2 text-lg">Sobre</h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            {instructor.bio}
          </p>
        </div>

        <div className="mt-8">
          <h3 className="font-bold text-slate-900 mb-4">Disponibilidade</h3>
          
          <CalendarWidget 
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setSelectedTime(null); // Reset time when date changes
            }}
          />

          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-700 mb-3">
              Horários disponíveis para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </h4>
            
            {availableTimes.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {availableTimes.map(time => (
                  <button 
                    key={time} 
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "py-2 px-1 rounded-lg border text-sm font-medium transition-colors",
                      selectedTime === time 
                        ? "bg-velo-blue text-white border-velo-blue shadow-sm" 
                        : "border-slate-200 hover:border-velo-blue hover:text-velo-blue bg-white"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-100">
                <CalendarIcon className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-slate-500 text-sm">Não há horários disponíveis para esta data.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 z-20 flex flex-col gap-3">
        <Button 
          className="w-full text-lg py-4"
          onClick={handleBookClick}
        >
          Book Now {selectedTime ? `(${selectedTime})` : ''}
        </Button>
        
        <AnimatePresence>
          {showWhatsAppAnim ? (
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-velo-green text-white p-4 rounded-2xl shadow-lg flex items-center justify-center gap-3"
             >
               <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
               <span className="font-bold">Opening WhatsApp...</span>
             </motion.div>
          ) : (
            <Button 
              variant="secondary" 
              className="w-full shadow-none bg-transparent border-2 border-velo-green text-velo-green hover:bg-velo-green/10"
              onClick={handleWhatsAppClick}
            >
              <MessageCircle size={24} />
              Combinar via WhatsApp
            </Button>
          )}
        </AnimatePresence>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowBookingModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Booking</h3>
              <p className="text-slate-600 mb-6">
                Do you want to book a class with <span className="font-bold">{instructor.name}</span> at <span className="font-bold">{selectedTime}</span>?
              </p>
              
              <div className="bg-slate-50 p-4 rounded-xl mb-6 flex justify-between items-center">
                <span className="text-slate-600">Total Price</span>
                <span className="text-xl font-bold text-velo-blue">R$ {instructor.price}</span>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={confirmBooking}>
                  Confirm
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LADV Alert Modal */}
      <AnimatePresence>
        {showLadvAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowLadvAlert(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">LADV Necessária</h3>
              <p className="text-slate-600 mb-6">
                Para agendar aulas práticas, é obrigatório enviar sua Licença para Aprendizagem de Direção Veicular (LADV).
              </p>
              
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setShowLadvAlert(false)}>
                  Depois
                </Button>
                <Button className="flex-1" onClick={() => {
                  setShowLadvAlert(false);
                  setShowUploadModal(true);
                }}>
                  Enviar Agora
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload LADV Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowUploadModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-blue-50 text-velo-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Enviar LADV</h3>
              <p className="text-slate-600 mb-6 text-sm">
                Tire uma foto ou envie o PDF da sua Licença de Aprendizagem.
              </p>
              
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 mb-6 flex flex-col items-center justify-center text-slate-400 gap-2 hover:bg-slate-50 transition-colors cursor-pointer">
                <Upload size={32} />
                <span className="text-sm font-medium">Clique para selecionar arquivo</span>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setShowUploadModal(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={() => {
                  setShowUploadModal(false);
                  onUploadLadv();
                  setShowBookingModal(true);
                }}>
                  Enviar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Agendamento Confirmado!</h3>
              <p className="text-slate-500 mb-6">
                Sua aula foi agendada com sucesso.
              </p>

              <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 text-sm">Instrutor</span>
                  <span className="font-bold text-slate-900">{instructor.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 text-sm">Data</span>
                  <span className="font-bold text-slate-900">{format(selectedDate, "dd 'de' MMM", { locale: ptBR })}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 text-sm">Horário</span>
                  <span className="font-bold text-slate-900">{selectedTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Valor</span>
                  <span className="font-bold text-velo-blue">R$ {instructor.price}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={handleAddToCalendar}
                >
                  <Calendar size={18} />
                  Adicionar ao Calendário
                </Button>
                
                <Button 
                  className="w-full py-4 text-lg" 
                  onClick={() => {
                    setShowSuccessModal(false);
                    onBack();
                  }}
                >
                  Voltar ao Início
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StudentProgress = ({ classes = [] }: { classes?: ScheduledClass[] }) => {
  const totalHoursRequired = 2; // Resolução 1.020/25 do CONTRAN
  
  // Filter for completed classes
  const completedClasses = classes.filter(c => c.status === 'completed').sort((a, b) => b.date.getTime() - a.date.getTime());
  
  const hoursCompleted = completedClasses.length; // Assuming 1 hour per class for now
  const progressPercentage = Math.min((hoursCompleted / totalHoursRequired) * 100, 100);

  return (
    <div className="pb-24 pt-6 px-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Meu Progresso</h1>
        <p className="text-slate-500 text-sm">Acompanhe sua evolução nas aulas</p>
      </header>

      <Card className="bg-gradient-to-br from-velo-blue to-velo-blue-dark text-white border-none p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-velo-blue-light text-sm font-medium mb-1">Aulas Realizadas</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{hoursCompleted}</span>
              <span className="text-lg text-velo-blue-light/70 font-normal">/ {totalHoursRequired} horas</span>
            </div>
            <p className="text-xs text-velo-blue-light mt-2">
              Mínimo necessário para a prova prática
              <br/>
              <span className="opacity-70">(Res. 1.020/25 CONTRAN)</span>
            </p>
          </div>
          
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              {/* Background Circle */}
              <path
                className="text-velo-blue-light/20"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              {/* Progress Circle */}
              <path
                className="text-velo-green drop-shadow-md"
                strokeDasharray={`${progressPercentage}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-sm font-bold">{Math.round(progressPercentage)}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-velo-blue-light font-medium">
            <span>Progresso Total</span>
            <span>{Math.max(0, totalHoursRequired - hoursCompleted)} horas restantes</span>
          </div>
          <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-velo-green shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
            />
          </div>
        </div>
      </Card>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 items-start">
        <div className="bg-white p-2 rounded-full shadow-sm text-velo-blue shrink-0">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">Requisito para a Prova</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Você precisa completar no mínimo <span className="font-bold text-slate-900">{totalHoursRequired} horas</span> de aulas práticas para estar apto a realizar o exame de direção do DETRAN, conforme Resolução 1.020/25 do CONTRAN.
          </p>
        </div>
      </div>

      <section>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Histórico de Aulas</h3>
        <div className="space-y-3">
          {completedClasses.length > 0 ? (
            completedClasses.map(cls => (
              <div key={cls.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-4 items-start">
                <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center text-velo-blue shrink-0 font-bold text-xs flex-col">
                  <span>{format(cls.date, 'dd')}</span>
                  <span className="uppercase text-[10px]">{format(cls.date, 'MMM', { locale: ptBR })}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{cls.instructorName}</h4>
                      <p className="text-xs text-slate-500 mb-2">{cls.time} • {cls.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                      Concluída
                    </div>
                  </div>
                  
                  {cls.instructorFeedback ? (
                    <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 italic border border-slate-100 mt-1 relative">
                      <div className="absolute -top-1.5 left-4 w-3 h-3 bg-slate-50 border-t border-l border-slate-100 rotate-45"></div>
                      "{cls.instructorFeedback}"
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-1">Nenhum feedback registrado.</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-500 text-sm">Nenhuma aula concluída ainda.</p>
              <p className="text-xs text-slate-400 mt-1">Suas aulas finalizadas aparecerão aqui.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// --- Instructor Flow ---

const InstructorDashboard = ({ onViewSchedule, classes, onGiveFeedback }: { onViewSchedule: () => void, classes: ScheduledClass[], onGiveFeedback: (id: string, feedback: string) => void }) => {
  // Filter classes for the current instructor (mocked as ID '1')
  const myClasses = classes.filter(c => c.instructorId === '1');
  
  const todayClasses = myClasses.filter(c => isToday(c.date));
  const completedClasses = myClasses.filter(c => c.status === 'completed').sort((a, b) => b.date.getTime() - a.date.getTime());

  // Calculate stats
  const totalEarnings = myClasses.reduce((acc, curr) => acc + curr.price, 0);
  const activeStudents = new Set(myClasses.map(c => c.id)).size; // Mock logic for unique students

  const [feedbackClassId, setFeedbackClassId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const handleFeedbackSubmit = () => {
    if (feedbackClassId && feedbackText) {
      onGiveFeedback(feedbackClassId, feedbackText);
      setFeedbackClassId(null);
      setFeedbackText('');
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-slate-500 text-sm">Bem-vindo,</p>
          <h1 className="text-2xl font-bold text-slate-900">Painel do Instrutor</h1>
        </div>
        <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
          <img src={MOCK_INSTRUCTORS[0].image} alt="Profile" />
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-velo-blue text-white border-none">
          <div className="flex items-start justify-between mb-4">
            <DollarSign className="text-velo-blue-light" size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded text-white">Total</span>
          </div>
          <p className="text-3xl font-bold">R$ {totalEarnings}</p>
          <p className="text-xs text-velo-blue-light mt-1">Ganhos totais</p>
        </Card>
        <Card>
          <div className="flex items-start justify-between mb-4">
            <Users className="text-velo-blue" size={24} />
            <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">Total</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{activeStudents}</p>
          <p className="text-xs text-slate-500 mt-1">Aulas agendadas</p>
        </Card>
      </div>

      {/* Today's Schedule */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900">Agenda de Hoje</h2>
          <button onClick={onViewSchedule} className="text-velo-blue text-sm font-medium">Ver tudo</button>
        </div>
        
        <div className="space-y-3">
          {todayClasses.length > 0 ? (
            todayClasses.map((item, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-14 text-center">
                  <p className="font-bold text-slate-900">{item.time}</p>
                </div>
                <Card className={cn(
                  "flex-1 flex justify-between items-center p-3 border-l-4",
                  item.status === 'completed' ? "border-l-velo-green bg-slate-50 opacity-70" : 
                  item.status === 'in-progress' ? "border-l-orange-500 bg-orange-50/50" : "border-l-velo-blue"
                )}>
                  <div>
                    <p className="font-bold text-slate-900">{item.studentName || `Aluno (ID: ${item.id})`}</p>
                    <p className={cn("text-xs font-medium", item.status === 'in-progress' ? "text-orange-600" : "text-slate-500")}>
                      {item.status === 'in-progress' ? 'Em andamento' : 'Aula Prática'}
                    </p>
                  </div>
                  {item.status === 'completed' ? (
                    <CheckCircle2 size={20} className="text-velo-green" />
                  ) : (
                    <button onClick={() => alert(`Abrindo chat...`)} className="w-8 h-8 rounded-full bg-velo-blue-light text-velo-blue flex items-center justify-center hover:bg-velo-blue hover:text-white transition-colors">
                      <MessageCircle size={16} />
                    </button>
                  )}
                </Card>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">Nenhuma aula hoje.</p>
          )}
        </div>
      </section>

      {/* Completed Classes / Feedback */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Aulas Concluídas (Feedback)</h2>
        <div className="space-y-3">
          {completedClasses.length > 0 ? (
            completedClasses.map((cls) => (
              <Card key={cls.id} className="bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-slate-900">Aluno (ID: {cls.id})</p>
                    <p className="text-sm text-slate-500">
                      {format(cls.date, "dd/MM/yyyy", { locale: ptBR })} • {cls.time}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">
                    Concluída
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200">
                   {cls.instructorFeedback ? (
                      <div className="bg-white p-3 rounded-lg border border-slate-100">
                        <p className="text-xs font-bold text-velo-blue mb-1 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Feedback Enviado
                        </p>
                        <p className="text-xs text-slate-600 italic">"{cls.instructorFeedback}"</p>
                      </div>
                   ) : (
                      <button 
                        onClick={() => setFeedbackClassId(cls.id)}
                        className="w-full py-2 text-sm font-medium text-velo-blue bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={16} /> Dar Feedback ao Aluno
                      </button>
                   )}
                   
                   {cls.studentFeedback && (
                      <div className="mt-3 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              className={i < cls.studentFeedback!.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"} 
                            />
                          ))}
                          <span className="text-xs font-bold text-slate-700 ml-1">Avaliação do Aluno</span>
                        </div>
                        <p className="text-xs text-slate-600">"{cls.studentFeedback.text}"</p>
                      </div>
                   )}
                </div>
              </Card>
            ))
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">Nenhuma aula concluída.</p>
          )}
        </div>
      </section>

      <AnimatePresence>
        {feedbackClassId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setFeedbackClassId(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">Feedback para o Aluno</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Comentário</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-velo-blue focus:border-transparent outline-none resize-none text-sm"
                  rows={4}
                  placeholder="Como foi o desempenho do aluno?"
                />
              </div>
              
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setFeedbackClassId(null)}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-velo-blue hover:bg-velo-blue-dark text-white" 
                  onClick={handleFeedbackSubmit}
                  disabled={!feedbackText.trim()}
                >
                  Enviar Feedback
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InstructorSchedule = ({ 
  classes, 
  onGiveFeedback, 
  onCheckIn, 
  onCheckOut,
  instructorProfile,
  setInstructorProfile
}: { 
  classes: ScheduledClass[], 
  onGiveFeedback: (id: string, feedback: string) => void, 
  onCheckIn: (id: string) => void, 
  onCheckOut: (id: string) => void,
  instructorProfile: Instructor,
  setInstructorProfile: (profile: Instructor) => void
}) => {
  const [activeTab, setActiveTab] = useState<'agenda' | 'availability'>('agenda');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const handleFeedbackSubmit = () => {
    if (selectedClass && feedbackText) {
      onGiveFeedback(selectedClass.id, feedbackText);
      setSelectedClass(null);
      setFeedbackText('');
    }
  };

  // Filter classes for the current instructor (mocked as ID '1')
  const myClasses = classes.filter(c => c.instructorId === '1');

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const classesOnSelectedDate = myClasses
    .filter(c => isSameDay(c.date, selectedDate))
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="pb-24 pt-6 px-4 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Minha Agenda</h1>
          <p className="text-slate-500 text-sm">
            {activeTab === 'agenda' ? 'Visualize suas aulas agendadas' : 'Gerencie seus horários de trabalho'}
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('agenda')}
          className={cn(
            "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
            activeTab === 'agenda' ? "bg-white text-velo-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Agenda
        </button>
        <button 
          onClick={() => setActiveTab('availability')}
          className={cn(
            "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
            activeTab === 'availability' ? "bg-white text-velo-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Disponibilidade
        </button>
      </div>

      {activeTab === 'agenda' ? (
        <>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight className="rotate-180" size={20} /></button>
          <span className="font-bold text-lg capitalize">{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight size={20} /></button>
        </div>
        
        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <span key={i} className="text-xs font-medium text-slate-400">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const hasClasses = myClasses.some(c => isSameDay(c.date, day));

            return (
              <button 
                key={i}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "aspect-square rounded-full flex flex-col items-center justify-center text-sm transition-colors relative",
                  isSelected ? "bg-velo-blue text-white font-bold shadow-md shadow-velo-blue/30" : 
                  isTodayDate ? "border border-velo-blue text-velo-blue font-bold" :
                  "hover:bg-slate-100 text-slate-700"
                )}
              >
                <span>{format(day, 'd')}</span>
                {hasClasses && (
                  <span className={cn(
                    "w-1 h-1 rounded-full absolute bottom-1",
                    isSelected ? "bg-white" : "bg-velo-blue"
                  )} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Aulas em {format(selectedDate, 'dd/MM')}</h2>
        
        {classesOnSelectedDate.length > 0 ? (
          <div className="space-y-4">
            {classesOnSelectedDate.map(cls => (
              <Card 
                key={cls.id} 
                className="flex flex-col gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                onClick={() => setSelectedClass(cls)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                      {cls.studentImage ? (
                        <img src={cls.studentImage} alt={cls.studentName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-lg">
                          {cls.studentName?.charAt(0) || 'A'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg leading-tight">{cls.studentName || 'Aluno'}</p>
                      <span className={cn(
                        "inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        cls.status === 'upcoming' ? "bg-blue-50 text-velo-blue" :
                        cls.status === 'in-progress' ? "bg-orange-50 text-orange-600" :
                        cls.status === 'completed' ? "bg-green-50 text-green-600" :
                        "bg-red-50 text-red-600"
                      )}>
                        {cls.status === 'upcoming' ? 'Agendada' : 
                         cls.status === 'in-progress' ? 'Em andamento' :
                         cls.status === 'completed' ? 'Concluída' : 'Cancelada'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-velo-blue">R$ {cls.price}</p>
                    <p className="text-xs text-slate-400 font-medium">/aula</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600">
                    <CalendarIcon size={16} className="text-slate-400" />
                    <span className="text-sm font-medium capitalize">{format(cls.date, "dd 'de' MMM", { locale: ptBR })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={16} className="text-slate-400" />
                    <span className="text-sm font-medium">{cls.time}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-300">
              <CalendarIcon size={20} />
            </div>
            <p className="text-slate-500 font-medium">Nenhuma aula neste dia</p>
            <p className="text-slate-400 text-sm mt-1">Aproveite o descanso!</p>
          </div>
        )}
      </section>
      </>
      ) : (
        <div className="space-y-6">
          <section>
            <h3 className="font-semibold text-slate-900 mb-4">Horários de Trabalho</h3>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const dayName = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][day];
                const dayAvailability = instructorProfile.availability?.find(a => a.dayOfWeek === day) || { dayOfWeek: day, startTime: '08:00', endTime: '18:00', isEnabled: false };
                
                return (
                  <div key={day} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-slate-700">{dayName}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={dayAvailability.isEnabled}
                          onChange={(e) => {
                            const newAvailability = [...(instructorProfile.availability || [])];
                            const index = newAvailability.findIndex(a => a.dayOfWeek === day);
                            if (index >= 0) {
                              newAvailability[index] = { ...newAvailability[index], isEnabled: e.target.checked };
                            } else {
                              newAvailability.push({ dayOfWeek: day, startTime: '08:00', endTime: '18:00', isEnabled: e.target.checked });
                            }
                            setInstructorProfile({ ...instructorProfile, availability: newAvailability });
                          }}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-velo-blue"></div>
                      </label>
                    </div>
                    
                    {dayAvailability.isEnabled && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-slate-500 mb-1 block">Início</label>
                          <input 
                            type="time" 
                            value={dayAvailability.startTime}
                            onChange={(e) => {
                              const newAvailability = [...(instructorProfile.availability || [])];
                              const index = newAvailability.findIndex(a => a.dayOfWeek === day);
                              if (index >= 0) {
                                newAvailability[index] = { ...newAvailability[index], startTime: e.target.value };
                                setInstructorProfile({ ...instructorProfile, availability: newAvailability });
                              }
                            }}
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <span className="text-slate-400 mt-5">-</span>
                        <div className="flex-1">
                          <label className="text-xs text-slate-500 mb-1 block">Fim</label>
                          <input 
                            type="time" 
                            value={dayAvailability.endTime}
                            onChange={(e) => {
                              const newAvailability = [...(instructorProfile.availability || [])];
                              const index = newAvailability.findIndex(a => a.dayOfWeek === day);
                              if (index >= 0) {
                                newAvailability[index] = { ...newAvailability[index], endTime: e.target.value };
                                setInstructorProfile({ ...instructorProfile, availability: newAvailability });
                              }
                            }}
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-4">Bloqueios de Agenda</h3>
            
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-4">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Adicionar Bloqueio</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Data</label>
                  <input type="date" id="busy-date" className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">Início</label>
                    <input type="time" id="busy-start" className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">Fim</label>
                    <input type="time" id="busy-end" className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const dateInput = document.getElementById('busy-date') as HTMLInputElement;
                    const startInput = document.getElementById('busy-start') as HTMLInputElement;
                    const endInput = document.getElementById('busy-end') as HTMLInputElement;
                    
                    if (dateInput.value && startInput.value && endInput.value) {
                      const newBusySlot: BusySlot = {
                        id: Math.random().toString(36).substr(2, 9),
                        date: new Date(dateInput.value + 'T00:00:00'),
                        startTime: startInput.value,
                        endTime: endInput.value
                      };
                      setInstructorProfile({
                        ...instructorProfile,
                        busySlots: [...(instructorProfile.busySlots || []), newBusySlot]
                      });
                      dateInput.value = '';
                      startInput.value = '';
                      endInput.value = '';
                    }
                  }}
                  className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Adicionar Bloqueio
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {instructorProfile.busySlots?.map((slot) => (
                <div key={slot.id} className="bg-white p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{format(new Date(slot.date), "dd 'de' MMMM", { locale: ptBR })}</p>
                    <p className="text-xs text-slate-500">{slot.startTime} - {slot.endTime}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setInstructorProfile({
                        ...instructorProfile,
                        busySlots: instructorProfile.busySlots?.filter(s => s.id !== slot.id)
                      });
                    }}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {(!instructorProfile.busySlots || instructorProfile.busySlots.length === 0) && (
                <p className="text-center text-slate-400 text-sm py-4">Nenhum bloqueio cadastrado.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Class Details & Feedback Modal */}
      <AnimatePresence>
        {selectedClass && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClass(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Detalhes da Aula</h3>
                <button onClick={() => setSelectedClass(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  {selectedClass.studentImage ? (
                    <img src={selectedClass.studentImage} alt={selectedClass.studentName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xl">
                      {selectedClass.studentName?.charAt(0) || 'A'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-xl">{selectedClass.studentName || 'Aluno'}</p>
                  <p className="text-slate-500">{format(selectedClass.date, "dd 'de' MMMM", { locale: ptBR })} às {selectedClass.time}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-3 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Status</span>
                  <span className={cn(
                    "text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                    selectedClass.status === 'upcoming' ? "bg-blue-50 text-velo-blue" :
                    selectedClass.status === 'in-progress' ? "bg-orange-50 text-orange-600" :
                    selectedClass.status === 'completed' ? "bg-green-50 text-green-600" :
                    "bg-red-50 text-red-600"
                  )}>
                    {selectedClass.status === 'upcoming' ? 'Agendada' : 
                     selectedClass.status === 'in-progress' ? 'Em andamento' :
                     selectedClass.status === 'completed' ? 'Concluída' : 'Cancelada'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Valor</span>
                  <span className="font-bold text-velo-blue text-lg">R$ {selectedClass.price}</span>
                </div>
              </div>

              {selectedClass.status === 'completed' && (
                <div className="space-y-3">
                  {selectedClass.durationMinutes !== undefined && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center mb-4">
                      <span className="text-slate-500 text-sm">Duração da Aula</span>
                      <span className="font-bold text-slate-900">{selectedClass.durationMinutes} minutos</span>
                    </div>
                  )}
                  <h4 className="font-bold text-slate-900">Feedback para o Aluno</h4>
                  {selectedClass.instructorFeedback ? (
                    <div className="bg-blue-50 text-velo-blue p-4 rounded-xl text-sm italic">
                      "{selectedClass.instructorFeedback}"
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea 
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Como foi o desempenho do aluno nesta aula?"
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-velo-blue/20 focus:border-velo-blue resize-none h-24"
                      />
                      <Button 
                        className="w-full" 
                        onClick={handleFeedbackSubmit}
                        disabled={!feedbackText.trim()}
                      >
                        Enviar Feedback
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {selectedClass.status === 'upcoming' && (
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-velo-green hover:bg-velo-green/90 text-white" 
                    onClick={() => { 
                      onCheckIn(selectedClass.id); 
                      setSelectedClass({...selectedClass, status: 'in-progress', checkInTime: new Date()}); 
                    }}
                  >
                    Fazer Check-in
                  </Button>
                  <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50">
                    Cancelar Aula
                  </Button>
                </div>
              )}

              {selectedClass.status === 'in-progress' && (
                <div className="space-y-3">
                  <div className="bg-orange-50 text-orange-600 p-4 rounded-xl text-sm text-center font-medium border border-orange-100">
                    Aula em andamento. Check-in realizado às {selectedClass.checkInTime ? format(selectedClass.checkInTime, 'HH:mm') : format(new Date(), 'HH:mm')}.
                  </div>
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
                    onClick={() => { 
                      onCheckOut(selectedClass.id); 
                      const checkOutTime = new Date();
                      const checkInTime = selectedClass.checkInTime || new Date();
                      const durationMinutes = Math.max(1, Math.round((checkOutTime.getTime() - checkInTime.getTime()) / 60000));
                      setSelectedClass({...selectedClass, status: 'completed', checkOutTime, durationMinutes}); 
                    }}
                  >
                    Fazer Check-out
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Generic Sub-Screens ---

const GenericFormScreen = ({ title, fields, onBack, onSave }: { title: string, fields: { label: string, placeholder: string, type?: string }[], onBack: () => void, onSave: () => void }) => {
  return (
    <div className="min-h-screen bg-white p-6 flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      </div>

      <div className="flex-1 space-y-4">
        {fields.map((field, i) => (
          <div key={i} className="space-y-1">
            <label className="text-sm font-medium text-slate-700">{field.label}</label>
            <Input type={field.type || 'text'} placeholder={field.placeholder} />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Button className="w-full py-4 text-lg" onClick={onSave}>
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};

const InstructorEditProfileScreen = ({ instructor, onBack, onSave }: { instructor: Instructor, onBack: () => void, onSave: (data: Partial<Instructor>) => void }) => {
  const [formData, setFormData] = useState({
    name: instructor.name,
    bio: instructor.bio,
    location: instructor.location,
    price: instructor.price
  });

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Editar Perfil</h1>
      </div>

      <div className="flex-1 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Nome Completo</label>
          <Input 
            value={formData.name} 
            onChange={e => handleChange('name', e.target.value)} 
            placeholder="Seu nome"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Bio</label>
          <textarea 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-velo-blue/20 transition-all min-h-[100px]"
            value={formData.bio}
            onChange={e => handleChange('bio', e.target.value)}
            placeholder="Fale sobre você..."
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Localização</label>
          <Input 
            value={formData.location} 
            onChange={e => handleChange('location', e.target.value)} 
            placeholder="Sua região"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Preço por Hora (R$)</label>
          <Input 
            type="number"
            value={formData.price} 
            onChange={e => handleChange('price', Number(e.target.value))} 
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="mt-8">
        <Button className="w-full py-4 text-lg" onClick={() => onSave(formData)}>
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};

const InstructorVehicleScreen = ({ instructor, onBack, onSave }: { instructor: Instructor, onBack: () => void, onSave: (data: Partial<Instructor>) => void }) => {
  const [formData, setFormData] = useState({
    vehicleModel: instructor.vehicleModel,
    vehiclePlate: instructor.vehiclePlate || '',
    vehicleYear: instructor.vehicleYear || ''
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Meu Veículo</h1>
      </div>

      <div className="flex-1 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Modelo do Veículo</label>
          <Input 
            value={formData.vehicleModel} 
            onChange={e => handleChange('vehicleModel', e.target.value)} 
            placeholder="Ex: Hyundai HB20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Placa</label>
          <Input 
            value={formData.vehiclePlate} 
            onChange={e => handleChange('vehiclePlate', e.target.value)} 
            placeholder="ABC-1234"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Ano</label>
          <Input 
            type="number"
            value={formData.vehicleYear} 
            onChange={e => handleChange('vehicleYear', e.target.value)} 
            placeholder="2023"
          />
        </div>
      </div>

      <div className="mt-8">
        <Button className="w-full py-4 text-lg" onClick={() => onSave(formData)}>
          Salvar Veículo
        </Button>
      </div>
    </div>
  );
};



const StudentPersonalDataScreen = ({ student, onBack, onSave }: { student: Student, onBack: () => void, onSave: (data: Partial<Student>) => void }) => {
  const [formData, setFormData] = useState({
    name: student.name,
    email: student.email,
    phone: student.phone,
    cpf: student.cpf
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Dados Pessoais</h1>
      </div>

      <div className="flex-1 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Nome Completo</label>
          <Input 
            value={formData.name} 
            onChange={e => handleChange('name', e.target.value)} 
            placeholder="Seu nome"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">E-mail</label>
          <Input 
            type="email"
            value={formData.email} 
            onChange={e => handleChange('email', e.target.value)} 
            placeholder="seu@email.com"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Telefone</label>
          <Input 
            type="tel"
            value={formData.phone} 
            onChange={e => handleChange('phone', e.target.value)} 
            placeholder="(11) 99999-9999"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">CPF</label>
          <Input 
            value={formData.cpf} 
            onChange={e => handleChange('cpf', e.target.value)} 
            placeholder="000.000.000-00"
          />
        </div>
      </div>

      <div className="mt-8">
        <Button className="w-full py-4 text-lg" onClick={() => onSave(formData)}>
          Salvar Dados
        </Button>
      </div>
    </div>
  );
};

// --- Main App Layout ---

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [hasLadv, setHasLadv] = useState(false);
  const [isUploadingLadv, setIsUploadingLadv] = useState(false);
  const [busySlots, setBusySlots] = useState<Record<string, string[]>>({});
  const [instructorProfile, setInstructorProfile] = useState<Instructor>(MOCK_INSTRUCTORS[0]);
  const [studentProfile, setStudentProfile] = useState<Student>({
    name: 'Gabriel Silva',
    email: 'gabriel@email.com',
    phone: '(11) 99999-9999',
    cpf: '000.000.000-00',
    image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop'
  });
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([
    {
      id: 'mock-1',
      instructorId: '1',
      instructorName: 'Carlos Silva',
      date: new Date(Date.now() - 86400000 * 2), // 2 days ago
      time: '14:00',
      status: 'completed',
      price: 60,
      instructorFeedback: 'Ótimo controle de embreagem, mas precisa melhorar a atenção nos retrovisores.',
      studentName: 'Gabriel Silva',
      studentImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop'
    },
    {
      id: 'mock-2',
      instructorId: '1',
      instructorName: 'Carlos Silva',
      date: new Date(Date.now() - 86400000 * 5), // 5 days ago
      time: '10:00',
      status: 'completed',
      price: 60,
      instructorFeedback: 'Evoluiu bastante na baliza. Parabéns!',
      studentName: 'Gabriel Silva',
      studentImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop'
    },
    {
      id: 'mock-3',
      instructorId: '2',
      instructorName: 'Ana Souza',
      date: new Date(Date.now() + 86400000), // Tomorrow
      time: '09:00',
      status: 'upcoming',
      price: 65,
      studentName: 'Gabriel Silva',
      studentImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop'
    },
    {
      id: 'mock-4',
      instructorId: '1',
      instructorName: 'Carlos Silva',
      date: new Date(Date.now() + 86400000 * 2), // 2 days from now
      time: '15:00',
      status: 'upcoming',
      price: 60,
      studentName: 'Mariana Costa',
      studentImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'
    }
  ]);

  // Simple navigation handler
  const navigateTo = (newScreen: Screen) => {
    setScreen(newScreen);
    window.scrollTo(0, 0);
  };

  // Splash timeout
  const handleSplashFinish = () => {
    setScreen('onboarding');
  };

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    navigateTo('auth');
  };

  const handleLogin = () => {
    if (userRole === 'student') {
      navigateTo('student-home');
    } else {
      navigateTo('instructor-dashboard');
    }
  };

  const handleRegister = (ladvUploaded?: boolean) => {
    if (ladvUploaded) {
      setHasLadv(true);
    }
    if (userRole === 'student') {
      navigateTo('student-home');
    } else {
      navigateTo('instructor-dashboard');
    }
  };

  const handleInstructorSelect = (id: string) => {
    setSelectedInstructorId(id);
    navigateTo('instructor-profile-view');
  };

  const handleStudentSelect = (id: number) => {
    setSelectedStudentId(id);
    navigateTo('instructor-student-detail');
  };

  const handleToggleSlot = (date: string, time: string) => {
    const currentBusy = busySlots[date] || [];
    let newBusy = [...currentBusy];

    // Initialize with some mock data if empty and not set yet
    if (currentBusy.length === 0 && !busySlots[date]) {
       // Mock initial state logic
       const day = parseInt(date.split('-')[2]);
       ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'].forEach((t, i) => {
          if ((day + i) % 3 === 0) newBusy.push(t);
       });
    }

    if (newBusy.includes(time)) {
      newBusy = newBusy.filter(t => t !== time);
    } else {
      newBusy.push(time);
    }

    setBusySlots({ ...busySlots, [date]: newBusy });
  };

  const handleBookClass = (date: Date, time: string, instructor: Instructor) => {
    const newClass: ScheduledClass = {
      id: Math.random().toString(36).substr(2, 9),
      instructorId: instructor.id,
      instructorName: instructor.name,
      date: date,
      time: time,
      status: 'upcoming',
      price: instructor.price
    };
    setScheduledClasses([...scheduledClasses, newClass]);
  };

  const handleCancelClass = (id: string) => {
    setScheduledClasses(scheduledClasses.map(cls => 
      cls.id === id ? { ...cls, status: 'cancelled' } : cls
    ));
  };

  const handleRateClass = (id: string, rating: number, text: string) => {
    setScheduledClasses(scheduledClasses.map(cls => 
      cls.id === id ? { ...cls, studentFeedback: { rating, text } } : cls
    ));
    alert('Avaliação enviada com sucesso!');
  };

  const handleInstructorFeedback = (id: string, feedback: string) => {
    setScheduledClasses(scheduledClasses.map(cls => 
      cls.id === id ? { ...cls, instructorFeedback: feedback } : cls
    ));
    alert('Feedback enviado com sucesso!');
  };

  const handleCheckIn = (id: string) => {
    setScheduledClasses(scheduledClasses.map(cls => 
      cls.id === id ? { ...cls, status: 'in-progress', checkInTime: new Date() } : cls
    ));
  };

  const handleCheckOut = (id: string) => {
    setScheduledClasses(scheduledClasses.map(cls => {
      if (cls.id === id) {
        const checkOutTime = new Date();
        const checkInTime = cls.checkInTime || new Date();
        // Calculate duration in minutes, ensuring at least 1 minute for demo purposes
        const durationMinutes = Math.max(1, Math.round((checkOutTime.getTime() - checkInTime.getTime()) / 60000));
        return { ...cls, status: 'completed', checkOutTime, durationMinutes };
      }
      return cls;
    }));
  };

  const handleUpdateInstructor = (data: Partial<Instructor>) => {
    setInstructorProfile(prev => {
      const updated = { ...prev, ...data };
      // Update mock data for demo purposes so changes persist when switching roles
      const index = MOCK_INSTRUCTORS.findIndex(i => i.id === updated.id);
      if (index !== -1) {
        MOCK_INSTRUCTORS[index] = updated;
      }
      return updated;
    });
    // alert('Perfil atualizado com sucesso!'); // Removed alert to be less intrusive or keep it? The user didn't ask to remove it. I'll keep it.
    alert('Perfil atualizado com sucesso!');
    navigateTo('instructor-profile');
  };

  const handleUpdateStudent = (data: Partial<Student>) => {
    setStudentProfile(prev => ({ ...prev, ...data }));
    alert('Dados atualizados com sucesso!');
    navigateTo('student-profile');
  };

  // Render content based on screen
  const renderContent = () => {
    switch (screen) {
      case 'splash':
        return <SplashScreen onFinish={handleSplashFinish} />;
      case 'onboarding':
        return <OnboardingScreen onSelectRole={handleRoleSelect} />;
      case 'auth':
        return (
          <AuthScreen 
            role={userRole} 
            onLogin={handleLogin} 
            onRegister={() => navigateTo('register')} 
            onBack={() => {
              setUserRole(null);
              navigateTo('onboarding');
            }} 
          />
        );
      case 'register':
        return (
          <RegisterScreen 
            role={userRole} 
            onRegister={handleRegister} 
            onBack={() => navigateTo('auth')} 
          />
        );
      
      // Student Screens
      case 'student-home':
        return <StudentHome onSelectInstructor={handleInstructorSelect} />;
      case 'student-schedule':
        return <StudentSchedule classes={scheduledClasses} onCancelClass={handleCancelClass} onRateClass={handleRateClass} />;
      case 'student-progress':
        return <StudentProgress classes={scheduledClasses} />;
      case 'student-profile':
        return (
          <div className="pb-24 pt-6 px-4 space-y-6">
            <header className="flex flex-col items-center pt-8 pb-6">
              <div className="w-24 h-24 bg-slate-200 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md">
                 <img src={studentProfile.image} alt="User" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{studentProfile.name}</h2>
              <p className="text-slate-500">Aluno</p>
              {!hasLadv && (
                <div className="mt-4 bg-orange-50 border border-orange-100 rounded-xl p-4 text-center w-full max-w-xs mx-auto">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center">
                      <AlertTriangle size={16} />
                    </div>
                    <p className="text-sm font-medium text-slate-800">
                      Atenção
                    </p>
                    <p className="text-xs text-slate-600 mb-2">
                      Aviso que precisa verificar a LADV para ter melhores chances de um instrutor aceitar a dar aulas
                    </p>
                    <label className="w-full cursor-pointer block">
                      <input 
                        type="file" 
                        accept=".pdf,.jpg,.png" 
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setIsUploadingLadv(true);
                            // Simulate upload delay
                            setTimeout(() => {
                              setHasLadv(true);
                              setIsUploadingLadv(false);
                            }, 1500);
                          }
                        }}
                      />
                      <div className="text-xs bg-orange-500 text-white px-4 py-2 rounded-lg font-medium w-full hover:bg-orange-600 transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2">
                        {isUploadingLadv ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            <span>Enviar LADV Agora</span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              )}
              {hasLadv && (
                <span className="mt-2 text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  LADV Verificada
                </span>
              )}
            </header>

            <div className="space-y-3">
              <button onClick={() => navigateTo('student-personal-data')} className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-velo-blue rounded-full flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <span className="font-medium text-slate-700">Dados Pessoais</span>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-velo-blue transition-colors" />
              </button>

              <button onClick={() => navigateTo('student-payments')} className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 text-velo-green rounded-full flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                  <span className="font-medium text-slate-700">Pagamentos</span>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-velo-blue transition-colors" />
              </button>

              <button onClick={() => navigateTo('student-settings')} className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                    <Settings size={20} />
                  </div>
                  <span className="font-medium text-slate-700">Configurações</span>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-velo-blue transition-colors" />
              </button>
            </div>

            <div className="pt-8">
              <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50" onClick={() => {
                setUserRole(null);
                setHasLadv(false);
                setScreen('onboarding');
              }}>
                <LogOut size={18} /> Sair da Conta
              </Button>
            </div>
          </div>
        );
      case 'student-personal-data':
        return (
          <StudentPersonalDataScreen 
            student={studentProfile}
            onBack={() => navigateTo('student-profile')}
            onSave={handleUpdateStudent}
          />
        );
      case 'student-payments':
        return (
          <GenericFormScreen 
            title="Pagamentos" 
            onBack={() => navigateTo('student-profile')}
            onSave={() => { alert('Cartão salvo!'); navigateTo('student-profile'); }}
            fields={[
              { label: 'Número do Cartão', placeholder: '0000 0000 0000 0000' },
              { label: 'Nome no Cartão', placeholder: 'GABRIEL SILVA' },
              { label: 'Validade', placeholder: 'MM/AA' },
              { label: 'CVV', placeholder: '123' }
            ]}
          />
        );
      case 'student-settings':
        return (
          <GenericFormScreen 
            title="Configurações" 
            onBack={() => navigateTo('student-profile')}
            onSave={() => { alert('Configurações salvas!'); navigateTo('student-profile'); }}
            fields={[
              { label: 'Nova Senha', placeholder: '********', type: 'password' },
              { label: 'Confirmar Senha', placeholder: '********', type: 'password' }
            ]}
          />
        );
      case 'instructor-profile-view':
        return selectedInstructorId ? (
          <InstructorProfileView 
            instructorId={selectedInstructorId} 
            onBack={() => navigateTo('student-home')} 
            hasLadv={hasLadv}
            onUploadLadv={() => setHasLadv(true)}
            onBookClass={handleBookClass}
            busySlots={busySlots}
          />
        ) : null;

      // Instructor Screens
      case 'instructor-dashboard':
        return <InstructorDashboard onViewSchedule={() => navigateTo('instructor-schedule')} classes={scheduledClasses} onGiveFeedback={handleInstructorFeedback} />;
      case 'instructor-schedule':
        return (
          <InstructorSchedule 
            classes={scheduledClasses} 
            onGiveFeedback={handleInstructorFeedback} 
            onCheckIn={handleCheckIn} 
            onCheckOut={handleCheckOut}
            instructorProfile={instructorProfile}
            setInstructorProfile={setInstructorProfile}
          />
        );
      case 'instructor-students':
        return (
          <div className="pb-24 pt-6 px-4">
             <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Meus Alunos</h1>
              </header>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card 
                    key={i} 
                    className="flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                    onClick={() => handleStudentSelect(i)}
                  >
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">
                      A{i}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Aluno Exemplo {i}</p>
                      <p className="text-xs text-slate-500">Última aula: Há 2 dias</p>
                    </div>
                  </Card>
                ))}
              </div>
          </div>
        );
      case 'instructor-student-detail':
        return (
          <div className="bg-white min-h-screen pb-24">
            <div className="p-6 border-b border-slate-100 flex items-center gap-4">
              <button onClick={() => navigateTo('instructor-students')} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Aluno Exemplo {selectedStudentId}</h1>
                <p className="text-sm text-slate-500">Progresso do Aluno</p>
              </div>
            </div>
            <StudentProgress classes={scheduledClasses} />
          </div>
        );
      case 'instructor-profile':
        return (
          <div className="pb-24 pt-6 px-4 space-y-6">
             <header className="flex flex-col items-center pt-8 pb-6">
               <div className="w-24 h-24 bg-slate-200 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md">
                 <img src={instructorProfile.image} alt="User" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{instructorProfile.name}</h2>
              
              <div className="flex flex-col items-center gap-1 mt-1">
                <p className="text-slate-500">Instrutor {instructorProfile.type}</p>
                
                <div className="flex items-center gap-1 text-slate-500 text-sm">
                  <MapPin size={14} />
                  <span>{instructorProfile.location}</span>
                </div>

                <div className="mt-1">
                  <span className="text-velo-blue font-bold">R$ {instructorProfile.price}</span>
                  <span className="text-slate-400 text-xs"> / hora</span>
                </div>
              </div>
            </header>

            <div className="px-4 text-center mb-6">
              <p className="text-slate-600 text-sm leading-relaxed">
                {instructorProfile.bio}
              </p>
            </div>

            <div className="space-y-3">
              <button onClick={() => navigateTo('instructor-edit-profile')} className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-velo-blue rounded-full flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <span className="font-medium text-slate-700">Editar Perfil</span>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-velo-blue transition-colors" />
              </button>

              <button onClick={() => navigateTo('instructor-vehicle')} className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                    <Car size={20} />
                  </div>
                  <span className="font-medium text-slate-700">Meu Veículo</span>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-velo-blue transition-colors" />
              </button>


            </div>

            <div className="pt-8">
              <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50" onClick={() => {
                setUserRole(null);
                setScreen('onboarding');
              }}>
                <LogOut size={18} /> Sair da Conta
              </Button>
            </div>
          </div>
        );
      case 'instructor-edit-profile':
        return (
          <InstructorEditProfileScreen 
            instructor={instructorProfile}
            onBack={() => navigateTo('instructor-profile')}
            onSave={handleUpdateInstructor}
          />
        );
      case 'instructor-vehicle':
        return (
          <InstructorVehicleScreen 
            instructor={instructorProfile}
            onBack={() => navigateTo('instructor-profile')}
            onSave={handleUpdateInstructor}
          />
        );
      
      default:
        return null;
    }
  };

  // Bottom Navigation
  const showNav = !['splash', 'onboarding', 'auth', 'register', 'instructor-profile-view', 'student-settings', 'student-payments', 'student-personal-data', 'instructor-edit-profile', 'instructor-vehicle', 'instructor-student-detail'].includes(screen);

  return (
    <div className="bg-slate-50 min-h-screen font-sans max-w-md mx-auto shadow-2xl relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-screen"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {showNav && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40 max-w-md mx-auto">
          {userRole === 'student' ? (
            <>
              <NavButton 
                icon={<Search size={24} />} 
                label="Buscar" 
                active={screen === 'student-home'} 
                onClick={() => navigateTo('student-home')} 
              />
              <NavButton 
                icon={<Calendar size={24} />} 
                label="Aulas" 
                active={screen === 'student-schedule'} 
                onClick={() => navigateTo('student-schedule')} 
              />
              <NavButton 
                icon={<TrendingUp size={24} />} 
                label="Progresso" 
                active={screen === 'student-progress'} 
                onClick={() => navigateTo('student-progress')} 
              />
              <NavButton 
                icon={<User size={24} />} 
                label="Perfil" 
                active={screen === 'student-profile'} 
                onClick={() => navigateTo('student-profile')} 
              />
            </>
          ) : (
            <>
              <NavButton 
                icon={<Home size={24} />} 
                label="Início" 
                active={screen === 'instructor-dashboard'} 
                onClick={() => navigateTo('instructor-dashboard')} 
              />
              <NavButton 
                icon={<Calendar size={24} />} 
                label="Agenda" 
                active={screen === 'instructor-schedule'} 
                onClick={() => navigateTo('instructor-schedule')} 
              />
              <NavButton 
                icon={<Users size={24} />} 
                label="Alunos" 
                active={screen === 'instructor-students'} 
                onClick={() => navigateTo('instructor-students')} 
              />
              <NavButton 
                icon={<User size={24} />} 
                label="Perfil" 
                active={screen === 'instructor-profile'} 
                onClick={() => navigateTo('instructor-profile')} 
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

const NavButton = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1 transition-colors",
      active ? "text-velo-blue" : "text-slate-400 hover:text-slate-600"
    )}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);
