/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// TESTE DE EDIÇÃO

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { RegisterForm } from './components/RegisterForm';
import { 
  Lock, Mail, Eye, EyeOff, LogOut, LayoutDashboard, 
  Store, Package, Tags, Users, Sparkles, Settings, 
  Plus, Search, Trash2, Edit, CheckCircle2, AlertCircle, 
  ArrowRight, ExternalLink, RefreshCw, Layers, ShieldCheck,
  ChevronRight, ChevronLeft, ChevronDown, TrendingUp, DollarSign, Eye as EyeIcon, MessageSquare, Menu, X,
  ShoppingBag, Compass, Star, ShoppingCart, Check, User, Heart, Clock, MapPin, Phone,
  Image as ImageIcon, ArrowUp, ArrowDown, Home, ArrowLeft, Calendar, Camera, Bot, Upload
} from 'lucide-react';

interface UserSession {
  email: string;
  name: string;
  role: string;
  token: string;
}

interface ChatbotConfig {
  name: string;
  avatarUrl: string;
  welcomeMessage: string;
  statusText: string;
}

const renderLuxuryAvatar = (
  photoUrl: string | undefined | null,
  name: string | undefined | null,
  sizeClass = "w-10 h-10 text-xs",
  altText = "Avatar"
) => {
  const initials = name?.trim()
    ? name.trim().split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : 'SR';

  if (photoUrl && photoUrl.trim()) {
    return (
      <img
        src={photoUrl}
        alt={altText}
        className={`${sizeClass} rounded-full object-cover border border-amber-500/50 shadow-md ring-1 ring-amber-400/20`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 text-amber-400 font-serif font-bold flex items-center justify-center shadow-inner tracking-wider select-none shrink-0`}
      title={name || 'Studio Royale'}
    >
      {initials}
    </div>
  );
};

interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'draft';
  image: string;
  description: string;
  companyName: string;
  showcaseId?: string;
}

interface Showcase {
  id: string;
  name: string;
  theme: string;
  status: 'active' | 'draft';
  productsCount: number;
  views: number;
  companyName: string;
  image: string;
}

interface Company {
  id: string;
  name: string;
  category: string;
  banner: string;
  cover: string;
  logo: string;
  rating: number;
  itemsCount: number;
  whatsapp: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  bio?: string;
}

interface OrderItemDetail {
  title: string;
  quantity: number;
  price: number;
  image?: string;
  companyName?: string;
}

interface OrderHistoryItem {
  id: string;
  date: string;
  total: number;
  status: string;
  items: string;
  details?: OrderItemDetail[];
}

interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  companyName: string;
  date: string;
  time: string;
  status: 'confirmado' | 'pendente_remarcacao' | 'pendente_cancelamento' | 'cancelado';
  requestedNewDate?: string;
  requestedNewTime?: string;
  notes?: string;
  createdAt: string;
}

interface WaitlistEntry {
  id: string;
  serviceId: string;
  serviceName: string;
  companyName: string;
  date: string;
  time: string;
  position: number;
  estimatedWaitMinutes: number;
  createdAt: string;
}

interface ServiceOption {
  id: string;
  title: string;
  companyName: string;
  duration: string;
  price: string;
  description: string;
}

const availableTimeSlots = ['09:00', '10:30', '14:00', '15:30', '17:00', '18:30'];

interface BannerItem {
  id: string;
  title: string;
  image: string;
  link: string;
  showcaseId: string; // 'home' or showcase id
  order: number;
  status: 'active' | 'draft';
}

export default function App() {
  // Auth state managed via Supabase Auth & perfis table
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(async ({ data: { session: authSession } }) => {
      if (authSession?.user) {
        let name = authSession.user.user_metadata?.nome || authSession.user.email?.split('@')[0] || 'Usuário';
        let role = authSession.user.user_metadata?.role || 'cliente';

        try {
          const { data: profile } = await supabase
            .from('perfis')
            .select('*')
            .eq('id', authSession.user.id)
            .maybeSingle();

          if (profile) {
            if (profile.nome) name = profile.nome;
            if (profile.role) role = profile.role;
          }
        } catch (e) {
          console.warn('Erro ao consultar tabela perfis:', e);
        }

        setSession({
          email: authSession.user.email || '',
          name,
          role,
          token: authSession.access_token
        });
      }
    });

    // Listen to Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, authSession) => {
      if (authSession?.user) {
        let name = authSession.user.user_metadata?.nome || authSession.user.email?.split('@')[0] || 'Usuário';
        let role = authSession.user.user_metadata?.role || 'cliente';

        try {
          const { data: profile } = await supabase
            .from('perfis')
            .select('*')
            .eq('id', authSession.user.id)
            .maybeSingle();

          if (profile) {
            if (profile.nome) name = profile.nome;
            if (profile.role) role = profile.role;
          }
        } catch (e) {
          console.warn('Erro ao consultar tabela perfis:', e);
        }

        setSession({
          email: authSession.user.email || '',
          name,
          role,
          token: authSession.access_token
        });
      } else {
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [availableServices, setAvailableServices] = useState<ServiceOption[]>([]);

  useEffect(() => {
    async function loadServices() {
      const { data } = await supabase.from('servicos').select('*');
      if (data) setAvailableServices(data);
    }
    loadServices();
  }, []);

  // View mode state: 'home' (Public PWA home), 'company' (Storefront), 'profile' (Customer Profile), 'admin' (Admin Panel)
  const [viewMode, setViewMode] = useState<'home' | 'company' | 'profile' | 'admin'>('home');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('c1');

  // Shopping Bag / Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customer Favorites state
  const [favorites, setFavorites] = useState<string[]>(['1', '2']);

  // Customer Profile state persisted in localStorage
  const [profile, setProfile] = useState<CustomerProfile>(() => {
    const saved = localStorage.getItem('vitrine_customer_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      name: 'Carlos Eduardo Silva',
      email: 'carlos.eduardo@exemplo.com',
      phone: '(11) 98765-4321',
      address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      bio: 'Cliente VIP Studio Royale. Apreciador de produtos exclusivos e alta relojoaria.'
    };
  });

  const [profileTab, setProfileTab] = useState<'info' | 'favorites' | 'orders' | 'appointments'>('info');
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // Appointments state loaded from Supabase
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      if (!session) {
        setLoadingAppointments(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          setLoadingAppointments(false);
          return;
      }
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('user_id', user.id);
      if (data) setAppointments(data.map((a: any) => ({
        id: a.id,
        serviceId: a.servico_id,
        serviceName: a.servico_nome,
        companyName: a.company_name,
        date: a.data || '',
        time: a.horario ? a.horario.substring(0, 5) : '',
        status: a.status,
        notes: a.observacoes,
        createdAt: a.created_at
      })));
      setLoadingAppointments(false);
    }
    loadAppointments();
  }, [session]);

  // Waitlist state (starts empty if no saved real data)
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(() => {
    const saved = localStorage.getItem('vitrine_customer_waitlist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  // Appointment Modal and Toast states
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('s-1');
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState<string>('09:00');
  const [bookingNotes, setBookingNotes] = useState<string>('');

  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('');

  const [appointmentToast, setAppointmentToast] = useState<string | null>(null);
  const showAppointmentToast = (msg: string) => {
    setAppointmentToast(msg);
    setTimeout(() => setAppointmentToast(null), 4000);
  };

  // Check if slot is blocked by a CONFIRMED appointment
  // CRITICAL RULE: "Solicitações pendentes não devem bloquear horários como se estivessem confirmadas."
  const isSlotBlockedByConfirmed = (serviceId: string, date: string, time: string) => {
    return appointments.some(app => 
      app.serviceId === serviceId &&
      app.date === date &&
      app.time === time &&
      app.status === 'confirmado'
    );
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSlotBlockedByConfirmed(selectedServiceId, bookingDate, bookingTime)) {
      alert('Este horário já possui um agendamento confirmado. Escolha outro horário ou entre na fila de espera.');
      return;
    }

    const service = availableServices.find(s => s.id === selectedServiceId);
    const newAppointmentData = {
      user_id: (await supabase.auth.getUser()).data.user?.id,
      servico_id: selectedServiceId,
      servico_nome: service?.title || 'Consultoria VIP',
      company_name: service?.companyName || 'Studio Royale',
      cliente_nome: session?.name || 'Cliente',
      data: bookingDate,
      horario: bookingTime + ':00',
      status: 'confirmado',
      observacoes: bookingNotes
    };

    const { data, error } = await supabase.from('agendamentos').insert([newAppointmentData]).select();
    
    if (error) {
      alert('Erro ao realizar agendamento: ' + error.message);
      return;
    }

    if (data) {
        setAppointments(prev => [{
            id: data[0].id,
            serviceId: data[0].servico_id,
            serviceName: data[0].servico_nome,
            companyName: data[0].company_name,
            date: data[0].data,
            time: data[0].horario.substring(0, 5),
            status: data[0].status,
            notes: data[0].observacoes,
            createdAt: data[0].created_at
        }, ...prev]);
    }
    setIsBookingModalOpen(false);
    setBookingNotes('');
    showAppointmentToast('Agendamento realizado e confirmado com sucesso!');
  };

  const handleJoinWaitlist = (serviceId: string, date: string, time: string) => {
    const service = availableServices.find(s => s.id === serviceId);
    const existingPos = waitlist.filter(w => w.serviceId === serviceId && w.date === date).length;
    const newPosition = existingPos + 1;
    const estimatedWait = newPosition * 15;

    const newWaitlistEntry: WaitlistEntry = {
      id: `WTL-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceId,
      serviceName: service?.title || 'Consultoria VIP',
      companyName: service?.companyName || 'Studio Royale',
      date,
      time,
      position: newPosition,
      estimatedWaitMinutes: estimatedWait,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    setWaitlist(prev => [...prev, newWaitlistEntry]);
    setIsBookingModalOpen(false);
    showAppointmentToast(`Você entrou na fila de espera real! Posição: #${newPosition} (~${estimatedWait} min).`);
  };

  const handleRequestReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleAppointment || !rescheduleDate || !rescheduleTime) return;

    if (isSlotBlockedByConfirmed(rescheduleAppointment.serviceId, rescheduleDate, rescheduleTime)) {
      alert('Atenção: O novo horário escolhido já possui um agendamento confirmado.');
      return;
    }

    const { error } = await supabase
        .from('agendamentos')
        .update({
            status: 'pendente_remarcacao',
            novadata: rescheduleDate,
            novohorario: rescheduleTime + ':00'
        })
        .eq('id', rescheduleAppointment.id);

    if (error) {
        alert('Erro ao solicitar remarcação: ' + error.message);
        return;
    }

    setAppointments(prev => prev.map(app => {
      if (app.id === rescheduleAppointment.id) {
        return {
          ...app,
          status: 'pendente_remarcacao',
          requestedNewDate: rescheduleDate,
          requestedNewTime: rescheduleTime
        };
      }
      return app;
    }));

    setRescheduleAppointment(null);
    showAppointmentToast('Solicitação de remarcação enviada! Status atualizado para Pendente de Remarcação.');
  };

  const handleRequestCancellation = async (appointmentId: string) => {
    if (confirm('Deseja realmente solicitar o cancelamento deste agendamento?')) {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'pendente_cancelamento' })
        .eq('id', appointmentId);
      
      if (error) {
          alert('Erro ao solicitar cancelamento: ' + error.message);
          return;
      }

      setAppointments(prev => prev.map(app => {
        if (app.id === appointmentId) {
          return {
            ...app,
            status: 'pendente_cancelamento'
          };
        }
        return app;
      }));
      showAppointmentToast('Solicitação de cancelamento enviada.');
    }
  };

  const handleLeaveWaitlist = (id: string) => {
    setWaitlist(prev => prev.filter(w => w.id !== id));
    showAppointmentToast('Você saiu da fila de espera.');
  };

  // Order history state with localStorage persistence
  const [orders, setOrders] = useState<OrderHistoryItem[]>(() => {
    const saved = localStorage.getItem('vitrine_customer_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      { 
        id: 'ORD-9821', 
        date: '22/10/2026', 
        total: 2450.00, 
        status: 'Entregue', 
        items: '1x Relógio Suíço Minimalista Von Steiger',
        details: [
          { title: 'Relógio Suíço Minimalista Von Steiger', quantity: 1, price: 2450.00, image: '/src/assets/images/showcase_luxury_watch_1792871178216.jpg', companyName: 'Aurum & Co. Horlogerie' }
        ]
      },
      { 
        id: 'ORD-9104', 
        date: '15/09/2026', 
        total: 480.00, 
        status: 'Entregue', 
        items: '1x Vaso Artesanal em Cerâmica Terracota',
        details: [
          { title: 'Vaso Artesanal em Cerâmica Terracota', quantity: 1, price: 480.00, image: '/src/assets/images/showcase_ceramic_vase_1792871178216.jpg', companyName: 'Aurum & Co. Horlogerie' }
        ]
      }
    ];
  });

  const [orderConfirmationModal, setOrderConfirmationModal] = useState<OrderHistoryItem | null>(null);

  useEffect(() => {
    localStorage.setItem('vitrine_customer_orders', JSON.stringify(orders));
  }, [orders]);

  const handleCheckoutOrder = () => {
    if (cart.length === 0) return;

    const newOrder: OrderHistoryItem = {
      id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toLocaleDateString('pt-BR'),
      total: cartTotal,
      status: 'Aguardando Análise',
      items: cart.map(i => `${i.quantity}x ${i.product.title}`).join(', '),
      details: cart.map(i => ({
        title: i.product.title,
        quantity: i.quantity,
        price: i.product.price,
        image: i.product.image,
        companyName: i.product.companyName
      }))
    };

    setOrders(prev => [newOrder, ...prev]);
    setCart([]); // Clear cart after checkout
    setIsCartOpen(false);
    setOrderConfirmationModal(newOrder);
  };

  // Login & Register state
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin Navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'showcases' | 'products' | 'banners' | 'categories' | 'leads' | 'ai' | 'settings'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [publicMenuOpen, setPublicMenuOpen] = useState(false);
  // Chatbot configuration state (Studio Royale Concierge)
  const defaultChatbotConfig: ChatbotConfig = {
    name: 'Aura Royale',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    welcomeMessage: 'Olá! Sou Aura Royale, sua concierge digital no Studio Royale. Como podemos proporcionar uma experiência excepcional hoje?',
    statusText: 'Concierge VIP Online'
  };

  const [chatbotConfig, setChatbotConfig] = useState<ChatbotConfig>(() => {
    const saved = localStorage.getItem('studioroyale_chatbot_config');
    if (saved) {
      try {
        return { ...defaultChatbotConfig, ...JSON.parse(saved) };
      } catch (e) {
        // fallback
      }
    }
    return defaultChatbotConfig;
  });

  useEffect(() => {
    try {
      localStorage.setItem('studioroyale_chatbot_config', JSON.stringify(chatbotConfig));
    } catch (e) {
      console.warn('Erro ao salvar config do chatbot:', e);
    }
  }, [chatbotConfig]);

  // Staff (Admin / Profissional) Avatar state with persistent cache
  const [staffAvatar, setStaffAvatar] = useState<string>(() => {
    return localStorage.getItem('studioroyale_staff_avatar') || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200';
  });

  // Settings Feedback Toast
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);
  const showSettingsFeedback = (msg: string) => {
    setSettingsFeedback(msg);
    setTimeout(() => setSettingsFeedback(null), 4000);
  };

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string }>>([
    { sender: 'bot', text: 'Olá! Sou Aura Royale, sua concierge digital no Studio Royale. Como podemos proporcionar uma experiência excepcional hoje?', time: 'Agora' }
  ]);
  const [inputChatMessage, setInputChatMessage] = useState('');

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAiResponding, isChatOpen]);

  // Search filter state for public home & admin products
  const [searchQuery, setSearchQuery] = useState('');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Vitrine specific state (Search, Category Filter, Product Detail Modal)
  const [companySearch, setCompanySearch] = useState('');
  const [companyCategoryFilter, setCompanyCategoryFilter] = useState('Todas');
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  // Banners state
  const [banners, setBanners] = useState<BannerItem[]>([
    {
      id: 'b1',
      title: 'Destaque Home 2026 - Relojoaria',
      image: '/src/assets/images/company_banner_watch_1792873304053.jpg',
      link: '#',
      showcaseId: 'home',
      order: 1,
      status: 'active'
    },
    {
      id: 'b2',
      title: 'Design Escandinavo - Inverno',
      image: '/src/assets/images/company_banner_furniture_1792873303872.jpg',
      link: '#',
      showcaseId: 'home',
      order: 2,
      status: 'active'
    },
    {
      id: 'b3',
      title: 'Vitrine Aurum & Co. Exclusiva',
      image: '/src/assets/images/company_banner_watch_1792873304053.jpg',
      link: '#',
      showcaseId: 's1',
      order: 1,
      status: 'active'
    },
    {
      id: 'b4',
      title: 'Vitrine Nordic Living Showroom',
      image: '/src/assets/images/company_banner_furniture_1792873303872.jpg',
      link: '#',
      showcaseId: 's2',
      order: 1,
      status: 'active'
    }
  ]);

  // Banner Modal state (Add / Edit)
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    image: '/src/assets/images/company_banner_watch_1792873304053.jpg',
    link: '#',
    showcaseId: 'home',
    order: 1,
    status: 'active' as 'active' | 'draft'
  });

  // Carousel banner state
  const [currentSlide, setCurrentSlide] = useState(0);

  const homeBanners = banners.filter(b => b.showcaseId === 'home' && b.status === 'active').sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (homeBanners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % homeBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [homeBanners.length]);

  // Companies / Businesses data
  const companies: Company[] = [
    {
      id: 'c1',
      name: 'Aurum & Co. Horlogerie',
      category: 'Relojoaria Suíça',
      banner: '/src/assets/images/company_banner_watch_1792873304053.jpg',
      cover: '/src/assets/images/company_banner_watch_1792873304053.jpg',
      logo: '⌚',
      rating: 4.9,
      itemsCount: 12,
      whatsapp: '5511998887766'
    },
    {
      id: 'c2',
      name: 'Nordic Living & Design',
      category: 'Móveis & Interiores',
      banner: '/src/assets/images/company_banner_furniture_1792873303872.jpg',
      cover: '/src/assets/images/company_banner_furniture_1792873303872.jpg',
      logo: '🪑',
      rating: 4.8,
      itemsCount: 18,
      whatsapp: '5511995554433'
    },
    {
      id: 'c3',
      name: 'Natura Cosméticos',
      category: 'Beleza & Perfumaria',
      banner: '/src/assets/images/company_banner_watch_1792873304053.jpg',
      cover: '/src/assets/images/company_banner_watch_1792873304053.jpg',
      logo: '🌿',
      rating: 4.9,
      itemsCount: 24,
      whatsapp: '5511988776655'
    },
    {
      id: 'c4',
      name: 'Hinode Group',
      category: 'Bem-estar & Cosméticos',
      banner: '/src/assets/images/company_banner_furniture_1792873303872.jpg',
      cover: '/src/assets/images/company_banner_furniture_1792873303872.jpg',
      logo: '💎',
      rating: 4.7,
      itemsCount: 15,
      whatsapp: '5511977665544'
    },
    {
      id: 'c5',
      name: 'O Boticário',
      category: 'Perfumaria & Cuidados',
      banner: '/src/assets/images/company_banner_watch_1792873304053.jpg',
      cover: '/src/assets/images/company_banner_watch_1792873304053.jpg',
      logo: '🌸',
      rating: 4.9,
      itemsCount: 30,
      whatsapp: '5511966554433'
    }
  ];

  // Sample Data for Admin Panel & Public Catalog
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts() {
      const { data } = await supabase.from('produtos').select('*');
      if (data) setProducts(data);
    }
    loadProducts();
  }, []);


  const [showcases, setShowcases] = useState<Showcase[]>([
    { id: 's1', name: 'Vitrine Principal - Lançamentos', theme: 'Minimalista Luxury', status: 'active', productsCount: 2, views: 1420, companyName: 'Aurum & Co. Horlogerie', image: '/src/assets/images/company_banner_watch_1792873304053.jpg' },
    { id: 's2', name: 'Coleção Outono / Inverno', theme: 'Warm Earth', status: 'active', productsCount: 1, views: 890, companyName: 'Nordic Living & Design', image: '/src/assets/images/company_banner_furniture_1792873303872.jpg' },
    { id: 's3', name: 'Vitrine Natura Exclusiva', theme: 'Natural Luxury', status: 'active', productsCount: 2, views: 1150, companyName: 'Natura Cosméticos', image: '/src/assets/images/company_banner_watch_1792873304053.jpg' },
    { id: 's4', name: 'Vitrine Hinode Premium', theme: 'Gold Elegance', status: 'active', productsCount: 2, views: 780, companyName: 'Hinode Group', image: '/src/assets/images/company_banner_furniture_1792873303872.jpg' },
    { id: 's5', name: 'Vitrine O Boticário', theme: 'Floral Essencial', status: 'active', productsCount: 2, views: 1620, companyName: 'O Boticário', image: '/src/assets/images/company_banner_watch_1792873304053.jpg' }
  ]);

  // AI Copywriter state
  const [aiPrompt, AiPrompt] = useState('');
  const [aiProductTitle, setAiProductTitle] = useState('');
  const [aiCategory, setAiCategory] = useState('Decoração');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Product Management Modal state (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    category: 'Relógios',
    price: 0,
    stock: 10,
    status: 'active' as 'active' | 'draft',
    image: '/src/assets/images/showcase_luxury_watch_1792871178216.jpg',
    description: '',
    companyName: 'Aurum & Co. Horlogerie',
    showcaseId: 's1'
  });

  const openAddProductModal = () => {
    setEditingProductId(null);
    setProductForm({
      title: '',
      category: 'Relógios',
      price: 0,
      stock: 10,
      status: 'active',
      image: '/src/assets/images/showcase_luxury_watch_1792871178216.jpg',
      description: '',
      companyName: 'Aurum & Co. Horlogerie',
      showcaseId: 's1'
    });
    setIsModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProductId(product.id);
    setProductForm({
      title: product.title,
      category: product.category,
      price: product.price,
      stock: product.stock,
      status: product.status,
      image: product.image,
      description: product.description,
      companyName: product.companyName,
      showcaseId: product.showcaseId || 's1'
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProductId) {
      setProducts(products.map(p => p.id === editingProductId ? {
        ...p,
        title: productForm.title,
        category: productForm.category,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        status: productForm.status,
        image: productForm.image,
        description: productForm.description,
        companyName: productForm.companyName,
        showcaseId: productForm.showcaseId
      } : p));
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        title: productForm.title,
        category: productForm.category,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        status: productForm.status,
        image: productForm.image,
        description: productForm.description,
        companyName: productForm.companyName,
        showcaseId: productForm.showcaseId
      };
      setProducts([newProduct, ...products]);
    }
    setIsModalOpen(false);
  };

  const toggleProductStatus = (productId: string) => {
    setProducts(products.map(p => p.id === productId ? {
      ...p,
      status: p.status === 'active' ? 'draft' : 'active'
    } : p));
  };

  const deleteProduct = (productId: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  // Banner CRUD & Reorder
  const openAddBannerModal = () => {
    setEditingBannerId(null);
    setBannerForm({
      title: '',
      image: '/src/assets/images/company_banner_watch_1792873304053.jpg',
      link: '#',
      showcaseId: 'home',
      order: banners.length + 1,
      status: 'active'
    });
    setIsBannerModalOpen(true);
  };

  const openEditBannerModal = (banner: BannerItem) => {
    setEditingBannerId(banner.id);
    setBannerForm({
      title: banner.title,
      image: banner.image,
      link: banner.link,
      showcaseId: banner.showcaseId,
      order: banner.order,
      status: banner.status
    });
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBannerId) {
      setBanners(banners.map(b => b.id === editingBannerId ? {
        ...b,
        title: bannerForm.title,
        image: bannerForm.image,
        link: bannerForm.link,
        showcaseId: bannerForm.showcaseId,
        order: Number(bannerForm.order),
        status: bannerForm.status
      } : b));
    } else {
      const newBanner: BannerItem = {
        id: Date.now().toString(),
        title: bannerForm.title,
        image: bannerForm.image,
        link: bannerForm.link,
        showcaseId: bannerForm.showcaseId,
        order: Number(bannerForm.order),
        status: bannerForm.status
      };
      setBanners([...banners, newBanner]);
    }
    setIsBannerModalOpen(false);
  };

  const deleteBanner = (bannerId: string) => {
    if (confirm('Tem certeza que deseja excluir este banner?')) {
      setBanners(banners.filter(b => b.id !== bannerId));
    }
  };

  const moveBannerOrder = (bannerId: string, direction: 'up' | 'down') => {
    const idx = banners.findIndex(b => b.id === bannerId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= banners.length) return;
    
    const updated = [...banners];
    const temp = updated[idx].order;
    updated[idx].order = updated[targetIdx].order;
    updated[targetIdx].order = temp;

    const tempItem = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = tempItem;

    setBanners(updated);
  };

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('vitrine_customer_profile', JSON.stringify(profile));
    setProfileSavedToast(true);
    setTimeout(() => {
      setProfileSavedToast(false);
    }, 4000);
  };

  // Handle Login submission via Supabase Auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      // Credenciais provisórias de demonstração administrativa
      if (
        (email.trim().toLowerCase() === 'admin@studioroyale.com.br' || email.trim().toLowerCase() === 'admin@vitrine.local') &&
        password === 'StudioAdmin2026!'
      ) {
        const demoSession: UserSession = {
          email: 'admin@studioroyale.com.br',
          name: 'Administrador Studio Royale',
          role: 'admin',
          token: 'demo-admin-session-token'
        };
        setSession(demoSession);
        setViewMode('admin');
        setIsLoggingIn(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoginError(error.message || 'Credenciais inválidas.');
        return;
      }

      if (data.user) {
        let name = data.user.user_metadata?.nome || data.user.email?.split('@')[0] || 'Usuário';
        let role = data.user.user_metadata?.role || 'cliente';

        try {
          const { data: profile } = await supabase
            .from('perfis')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile) {
            if (profile.nome) name = profile.nome;
            if (profile.role) role = profile.role;
          }
        } catch (profileErr) {
          console.warn('Erro ao verificar perfil no Supabase:', profileErr);
        }

        const userSession: UserSession = {
          email: data.user.email || email,
          name,
          role,
          token: data.session?.access_token || ''
        };

        setSession(userSession);
        setViewMode('admin');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Erro de conexão com o Supabase.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Erro ao efetuar logout no Supabase:', e);
    }
    setSession(null);
    setEmail('');
    setPassword('');
    setViewMode('home');
  };

  // AI Generator handler
  const handleGenerateAI = async () => {
    if (!aiProductTitle) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, productTitle: aiProductTitle, category: aiCategory })
      });
      const data = await res.json();
      if (data.success) {
        setAiResult(data.data);
      } else {
        alert(data.error || 'Erro ao gerar cópia.');
      }
    } catch (err) {
      alert('Erro de conexão com o serviço de IA.');
    } finally {
      setAiLoading(false);
    }
  };

  // COMMON HEADER FOR PUBLIC SCREENS
  const renderPublicHeader = () => (
    <>
      <header className="bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPublicMenuOpen(!publicMenuOpen)}
              className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors border border-slate-800 flex items-center gap-2"
              title="Abrir/Recuar Menu Lateral"
            >
              {publicMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5 text-amber-400" />}
              <ChevronRight className={`w-4 h-4 text-amber-400 transition-transform duration-300 ${publicMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewMode('home')}>
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-white">Studio Royale</h1>
                <p className="text-[11px] text-slate-400 font-medium">Vitrines de Luxo & Relojoaria</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {viewMode === 'company' && (
              <button
                onClick={() => setViewMode('home')}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-2xl border border-slate-700 flex items-center gap-2 transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Voltar</span>
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-2xl border border-slate-700 flex items-center gap-2 transition-all"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Sacola</span>
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewMode('profile')}
              className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-2xl border border-slate-700 flex items-center gap-2.5 transition-all group"
              title="Acessar Perfil VIP"
            >
              {renderLuxuryAvatar(profile.avatar, profile.name, 'w-7 h-7 text-[10px]')}
              <span className="hidden sm:inline text-xs group-hover:text-amber-400 transition-colors">
                {profile.name ? profile.name.split(' ')[0] : 'Perfil'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Full-Height Edge-To-Edge Public Sidebar Drawer */}
      {publicMenuOpen && (
        <div 
          onClick={() => setPublicMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 transition-opacity duration-300 flex"
        >
          <aside 
            onClick={(e) => e.stopPropagation()}
            className="w-80 h-full bg-slate-900 border-r border-slate-800/90 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl overflow-y-auto"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Studio Royale</h3>
                    <p className="text-[10px] text-amber-400 font-mono">Menu Principal</p>
                  </div>
                </div>
                <button
                  onClick={() => setPublicMenuOpen(false)}
                  className="p-2 px-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all flex items-center justify-center border border-slate-800 gap-1.5 text-xs font-semibold"
                  title="Recuar Menu"
                >
                  <ChevronLeft className="w-4 h-4 text-amber-400" />
                  <span>Recuar</span>
                </button>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => { setViewMode('home'); setPublicMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full px-4 py-3.5 text-xs font-semibold rounded-2xl transition-all flex items-center gap-3.5 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60"
                >
                  <Home className="w-4 h-4 text-amber-400" /> Página Inicial
                </button>

                <button
                  onClick={() => {
                    setViewMode('home');
                    setPublicMenuOpen(false);
                    setTimeout(() => {
                      document.getElementById('vitrines-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full px-4 py-3.5 text-xs font-semibold rounded-2xl transition-all flex items-center gap-3.5 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60"
                >
                  <Store className="w-4 h-4 text-amber-400" /> Vitrines de Empresas
                </button>

                <button
                  onClick={() => { setIsCartOpen(!isCartOpen); setPublicMenuOpen(false); }}
                  className="w-full px-4 py-3.5 text-xs font-semibold rounded-2xl transition-all flex items-center justify-between text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60"
                >
                  <div className="flex items-center gap-3.5">
                    <ShoppingCart className="w-4 h-4 text-amber-400" /> Minha Sacola
                  </div>
                  {cart.length > 0 && (
                    <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      {cart.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setIsChatOpen(!isChatOpen); setPublicMenuOpen(false); }}
                  className="w-full px-4 py-3.5 text-xs font-semibold rounded-2xl transition-all flex items-center gap-3.5 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60"
                >
                  <MessageSquare className="w-4 h-4 text-amber-400" /> {chatbotConfig.name} (Concierge)
                </button>

                <button
                  onClick={() => { setViewMode('profile'); setProfileTab('appointments'); setPublicMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full px-4 py-3.5 text-xs font-semibold rounded-2xl transition-all flex items-center justify-between text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60"
                >
                  <div className="flex items-center gap-3.5">
                    <Calendar className="w-4 h-4 text-amber-400" /> Agendamentos VIP
                  </div>
                  {appointments.length > 0 && (
                    <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      {appointments.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setViewMode('profile'); setPublicMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full px-4 py-3 text-xs font-semibold rounded-2xl transition-all flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60"
                >
                  {renderLuxuryAvatar(profile.avatar, profile.name, 'w-6 h-6 text-[9px]')}
                  <span>Perfil do Cliente</span>
                </button>

                <button
                  onClick={() => { setViewMode('admin'); setPublicMenuOpen(false); }}
                  className="w-full px-4 py-3.5 text-xs font-semibold rounded-2xl transition-all flex items-center gap-3.5 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-amber-500/20 bg-amber-500/5 mt-4"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" /> Painel Administrativo
                </button>
              </nav>
            </div>

            {/* Identificação VIP do Cliente no Rodapé do Drawer */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div 
                onClick={() => { setViewMode('profile'); setPublicMenuOpen(false); }}
                className="p-3 bg-slate-950/70 hover:bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 cursor-pointer transition-colors group"
                title="Acessar Perfil VIP"
              >
                {renderLuxuryAvatar(profile.avatar, profile.name, 'w-10 h-10 text-xs')}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">{profile.name}</p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">{profile.email}</p>
                  <span className="inline-block mt-0.5 text-[9px] font-bold text-amber-400/90 uppercase tracking-wider">Cliente VIP</span>
                </div>
              </div>

              <button
                onClick={() => { setIsChatOpen(!isChatOpen); setPublicMenuOpen(false); }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15"
              >
                <MessageSquare className="w-4 h-4" /> Concierge Online
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );

  // SHOPPING BAG DRAWER
  const renderCartDrawer = () => (
    isCartOpen && (
      <div 
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl h-full overflow-y-auto"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" /> Sua Sacola ({cart.reduce((s, i) => s + i.quantity, 0)})
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsCartOpen(false)} 
                  className="p-1.5 px-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800 flex items-center gap-1.5 text-xs font-semibold"
                  title="Recuar Sacola"
                >
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                  <span>Recuar</span>
                </button>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white p-1" title="Fechar">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="py-20 text-center text-slate-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20 text-amber-400" />
                <p className="text-xs">Sua sacola está vazia.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.product.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-4">
                    <img src={item.product.image} alt="" className="w-14 h-14 rounded-xl object-cover bg-slate-900" referrerPolicy="no-referrer" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white text-xs mb-1">{item.product.title}</h4>
                      <div className="text-xs text-amber-400 font-mono font-bold">R$ {item.product.price.toFixed(2)} x {item.quantity}</div>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-300 p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="pt-6 border-t border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total Estimado:</span>
                <span className="text-xl font-bold text-amber-400 font-mono">R$ {cartTotal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckoutOrder}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" /> Enviar Pedido para Análise do Salão
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-tight px-1">
                Sua solicitação será registrada com o status <span className="text-amber-400 font-semibold">"Aguardando Análise"</span> para avaliação da equipe, sem cobrança imediata ou transação financeira simulada.
              </p>

              <a
                href={`https://wa.me/5511998887766?text=${encodeURIComponent(`Olá, gostaria de solicitar orçamento para os itens da sacola:\n` + cart.map(i => `- ${i.quantity}x ${i.product.title} (R$ ${i.product.price})`).join('\n') + `\nTotal Estimado: R$ ${cartTotal.toFixed(2)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                <MessageSquare className="w-4 h-4" /> Enviar Cópia via WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    )
  );

  // INTERACTIVE CHAT DRAWER WITH REAL GEMINI AI INTEGRATION
  const handleSendChatMessage = async (textToSend?: string) => {
    const msg = textToSend || inputChatMessage;
    if (!msg.trim() || isAiResponding) return;

    const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user' as const, text: msg, time: currentTime };
    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    if (!textToSend) setInputChatMessage('');
    setIsAiResponding(true);

    try {
      let contextRole = 'public';
      let userName = 'Visitante';
      if (session) {
        contextRole = session.role === 'admin' ? 'admin' : (session.role === 'profissional' ? 'profissional' : 'cliente');
        userName = session.name || session.email;
      } else if (viewMode === 'profile') {
        contextRole = 'cliente';
        userName = profile.name;
      }

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {})
        },
        body: JSON.stringify({
          message: msg,
          history: updatedHistory.slice(-6),
          context: {
            role: contextRole,
            viewMode,
            userName,
            userEmail: session?.email || (viewMode === 'profile' ? profile.email : undefined),
            token: session?.token,
            extraContext: `Vitrines ativas: ${companies.length}, Produtos: ${products.length}, Pedidos registrados: ${orders.length}, Agendamentos cadastrados: ${appointments.length}`
          }
        })
      });

      const data = await res.json();
      const botReply = data.reply || data.error || 'Estou à disposição para orientá-lo no Studio Royale.';
      setChatMessages(prev => [
        ...prev, 
        { 
          sender: 'bot', 
          text: botReply, 
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
    } catch (err) {
      console.error('Erro na resposta do assistente:', err);
      setChatMessages(prev => [
        ...prev, 
        { 
          sender: 'bot', 
          text: 'O concierge digital está passando por uma breve oscilação de conexão. Sinta-se à vontade para navegar pelos serviços e vitrines oficiais ou tentar novamente em instantes.', 
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
    } finally {
      setIsAiResponding(false);
    }
  };

  const getContextChips = () => {
    if (session?.role === 'admin') {
      return [
        { label: '📊 Resumo Executivo', msg: 'Apresente um resumo executivo dos pedidos e métricas do painel hoje.' },
        { label: '✨ Dicas Vitrines', msg: 'Quais boas práticas recomenda para organizar os destaques das vitrines?' },
        { label: '📦 Fluxo Pedidos', msg: 'Como funciona o fluxo de aprovação dos pedidos sob análise?' },
      ];
    }
    if (session?.role === 'profissional') {
      return [
        { label: '🕒 Grade & Tempos', msg: 'Quais os tempos médios dos serviços de consultoria e design da nossa grade?' },
        { label: '⏳ Fila de Espera', msg: 'Como funciona a tolerância e o tempo estimado na fila de espera?' },
        { label: '🤝 Boas Práticas', msg: 'Quais orientações de acolhimento devo seguir para clientes VIP?' },
      ];
    }
    if (viewMode === 'profile' || session?.role === 'cliente') {
      return [
        { label: '📅 Meus Agendamentos', msg: 'Como consultar ou solicitar remarcação dos meus agendamentos?' },
        { label: '🛍️ Meus Pedidos', msg: 'Como acompanhar o status das minhas solicitações de pedidos?' },
        { label: '💎 Serviços VIP', msg: 'Quais consultorias VIP estão disponíveis gratuitamente para clientes?' },
      ];
    }
    return [
      { label: '✨ Nossas Marcas', msg: 'Quais marcas e vitrines exclusivas o Studio Royale oferece?' },
      { label: '📅 Consultoria VIP', msg: 'Gostaria de saber como agendar uma consultoria exclusiva.' },
      { label: '🛍️ Como Comprar', msg: 'Como funciona a sacola e a solicitação de orçamentos?' },
    ];
  };

  const renderChatDrawer = () => (
    <>
      {/* Bolinha Flutuante de Chat com Foto do Concierge */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-20 right-4 sm:right-6 z-40 p-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-full shadow-2xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 border border-amber-400/40 cursor-pointer"
          title={`Falar com ${chatbotConfig.name}`}
        >
          <div className="relative shrink-0 flex items-center justify-center">
            {chatbotConfig.avatarUrl ? (
              <img
                src={chatbotConfig.avatarUrl}
                alt={chatbotConfig.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-950/60 shadow"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-950 text-amber-400 font-bold text-xs flex items-center justify-center">
                AR
              </div>
            )}
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 animate-pulse ring-2 ring-slate-950" />
          </div>
          <div className="hidden sm:block text-left pr-1">
            <span className="block font-bold text-xs leading-none text-slate-950">{chatbotConfig.name}</span>
            <span className="block text-[9px] font-medium text-slate-900/80 leading-tight">
              {session?.role === 'admin' ? 'IA Executiva' : (session?.role === 'profissional' ? 'Assistente Staff' : 'Concierge VIP')}
            </span>
          </div>
        </button>
      )}

      {/* Cartão de Chat Compacto Flutuante */}
      {isChatOpen && (
        <div 
          onClick={() => setIsChatOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-300 flex items-end justify-end p-4 sm:p-6 pb-20 sm:pb-6"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:w-96 max-w-sm h-[520px] max-h-[75vh] bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col justify-between overflow-hidden relative"
          >
            {/* Cabeçalho do Chat com Foto e Nome Customizáveis */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {chatbotConfig.avatarUrl ? (
                    <img
                      src={chatbotConfig.avatarUrl}
                      alt={chatbotConfig.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-amber-500 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
                      AR
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                    <span>{chatbotConfig.name}</span>
                    <span className="px-1.5 py-0.2 bg-amber-500/10 border border-amber-500/25 rounded-full text-[9px] text-amber-400 font-mono">
                      {session?.role === 'admin' ? 'ADMIN' : (session?.role === 'profissional' ? 'STAFF' : 'VIP')}
                    </span>
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {chatbotConfig.statusText}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setIsChatOpen(false)} 
                  className="p-1.5 px-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                  title="Recuar Chat"
                >
                  <ChevronDown className="w-4 h-4 text-amber-400" />
                  <span>Recuar</span>
                </button>
                <button 
                  onClick={() => setIsChatOpen(false)} 
                  className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-xl transition-all cursor-pointer" 
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mensagens de Chat */}
            <div className="space-y-3 flex-1 overflow-y-auto my-3 pr-1 text-xs">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'bot' && (
                    <div className="shrink-0 mt-1">
                      {chatbotConfig.avatarUrl ? (
                        <img
                          src={chatbotConfig.avatarUrl}
                          alt={chatbotConfig.name}
                          className="w-6 h-6 rounded-full object-cover border border-amber-500/40 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-950 border border-amber-500/30 text-amber-400 text-[9px] font-bold flex items-center justify-center">
                          AR
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-2xl text-[11px] max-w-[85%] leading-relaxed whitespace-pre-line ${
                      msg.sender === 'user' 
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-amber-500/10' 
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-0.5 px-1">{msg.time}</span>
                  </div>
                </div>
              ))}

              {/* Indicador de Carregamento Luxury do Concierge */}
              {isAiResponding && (
                <div className="flex gap-2 justify-start items-center animate-fadeIn">
                  <div className="shrink-0">
                    {chatbotConfig.avatarUrl ? (
                      <img
                        src={chatbotConfig.avatarUrl}
                        alt={chatbotConfig.name}
                        className="w-6 h-6 rounded-full object-cover border border-amber-500/40 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-950 border border-amber-500/30 text-amber-400 text-[9px] font-bold flex items-center justify-center">
                        AR
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none flex items-center gap-1.5 text-amber-400 shadow-inner">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-[10px] text-slate-400 ml-1 font-sans">{chatbotConfig.name} está pensando...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Ações Rápidas & Input */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <div className="flex flex-wrap gap-1.5">
                {getContextChips().map((chip, idx) => (
                  <button
                    key={idx}
                    disabled={isAiResponding}
                    onClick={() => handleSendChatMessage(chip.msg)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] rounded-xl border border-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputChatMessage}
                  disabled={isAiResponding}
                  onChange={(e) => setInputChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  placeholder={isAiResponding ? "Aguardando resposta do concierge..." : "Pergunte ao Concierge Studio Royale..."}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendChatMessage()}
                  disabled={isAiResponding || !inputChatMessage.trim()}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-xl transition-all shadow-md shadow-amber-500/10 shrink-0 disabled:opacity-40 cursor-pointer"
                >
                  {isAiResponding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Enviar'}
                </button>
              </div>

              <a
                href="https://wa.me/5511998887766?text=Olá,%20gostaria%20de%20atendimento%20VIP%20com%20o%20Concierge%20Studio%20Royale."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl text-[11px] flex items-center justify-center gap-1.5 border border-emerald-500/30 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Abrir WhatsApp Oficial
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // FIXED BOTTOM NAVIGATION BAR FOR PWA (Início, Vitrines, Sacola, Chat, Perfil)
  const renderBottomNav = () => (
    <nav aria-label="Navegação inferior" className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800/90 py-2.5 px-4 z-40 backdrop-blur-xl shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around">
        <button
          onClick={() => { setViewMode('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${viewMode === 'home' && !isChatOpen ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          <Home className="w-5 h-5" /> Início
        </button>

        <button
          onClick={() => {
            setViewMode('home');
            setTimeout(() => {
              document.getElementById('produtos-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          }}
          className="flex flex-col items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
        >
          <Store className="w-5 h-5" /> Vitrines
        </button>

        <button
          onClick={() => setIsCartOpen(!isCartOpen)}
          className={`relative flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${isCartOpen ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          <ShoppingCart className="w-5 h-5" /> Sacola
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${isChatOpen ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          <MessageSquare className="w-5 h-5" /> Chat
        </button>

        <button
          onClick={() => { setViewMode('profile'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${viewMode === 'profile' && !isChatOpen ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          <User className="w-5 h-5" /> Perfil
        </button>
      </div>
    </nav>
  );

  // 1. PUBLIC PWA HOME SCREEN
  if (viewMode === 'home') {
    const filteredCompanies = companies.filter(c =>
      searchQuery ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.category.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col pb-24">
        {renderPublicHeader()}

        {/* Search Bar */}
        <div className="bg-slate-900/40 border-b border-slate-800/60 py-4 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar empresas ou categorias..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 pl-11 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Automatic Infinite Carousel Banner (Home) */}
        {homeBanners.length > 0 && (
          <div className="relative max-w-7xl mx-auto px-6 pt-6 w-full">
            <div className="relative h-64 sm:h-80 rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl group">
              {homeBanners.map((banner, idx) => (
                <div 
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8 max-w-2xl space-y-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500 text-slate-950 uppercase tracking-wider">
                      Destaque PWA
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{banner.title}</h2>
                  </div>
                </div>
              ))}
              
              <div className="absolute bottom-4 right-6 z-20 flex items-center gap-2">
                {homeBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentSlide ? 'bg-amber-400 w-6' : 'bg-slate-600'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mini cards de seleção de empresas logo abaixo do carrossel */}
        <div className="max-w-7xl mx-auto px-6 pt-6 w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vitrines Disponíveis</h3>
            <span className="text-[11px] text-amber-400 font-medium">{filteredCompanies.length} Marcas</span>
          </div>
          <div className="flex items-center gap-4 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
            {filteredCompanies.map(company => (
              <button
                key={company.id}
                onClick={() => {
                  setSelectedCompanyId(company.id);
                  setViewMode('company');
                  window.scrollTo(0, 0);
                }}
                className="flex items-center gap-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 px-4 py-3 rounded-2xl shrink-0 transition-all shadow-md group"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center text-lg border border-slate-800 shrink-0">
                  <img src={company.cover || company.banner} alt={company.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-white text-xs group-hover:text-amber-400 transition-colors line-clamp-1">{company.name}</h4>
                  <span className="text-[10px] text-slate-400">{company.category}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Clean Home Content */}
        <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-lg">
            <h3 className="text-lg font-bold text-white">Explore Nossas Vitrines</h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              Selecione uma marca acima para visualizar seus produtos, lançamentos e catálogo exclusivo.
            </p>
          </div>
        </main>

        {renderCartDrawer()}
        {renderChatDrawer()}
        {renderBottomNav()}

        {/* Public Footer */}
        <footer className="bg-slate-900 border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>VitrineHub PWA &bull; Todos os direitos reservados 2026</div>
            <button onClick={() => setViewMode('admin')} className="text-amber-400 hover:underline font-semibold">
              Acesso Restrito (Painel ADM)
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // 2. INDIVIDUAL COMPANY STOREFRONT SCREEN
  if (viewMode === 'company') {
    const currentCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];
    const companyProducts = products.filter(p => p.companyName === currentCompany.name && p.status === 'active');
    
    // Extract unique categories for this company
    const companyCategories = ['Todas', ...Array.from(new Set(companyProducts.map(p => p.category)))];

    // Filter by search query and category
    const filteredCompanyProducts = companyProducts.filter(p => {
      const matchesSearch = !companySearch || 
        p.title.toLowerCase().includes(companySearch.toLowerCase()) || 
        p.description.toLowerCase().includes(companySearch.toLowerCase());
      const matchesCategory = companyCategoryFilter === 'Todas' || p.category === companyCategoryFilter;
      return matchesSearch && matchesCategory;
    });

    const matchedShowcase = showcases.find(s => s.companyName === currentCompany.name);
    const companyBanners = banners.filter(b => b.showcaseId === (matchedShowcase?.id || 's1') && b.status === 'active').sort((a, b) => a.order - b.order);

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col pb-24">
        {renderPublicHeader()}

        {/* Company Carousel Banner or Cover */}
        <div className="relative max-w-7xl mx-auto px-6 pt-6 w-full">
          <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl">
            <img src={companyBanners[0]?.image || currentCompany.cover} alt={currentCompany.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500 text-slate-950 uppercase tracking-wider">
                    {currentCompany.category}
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold bg-slate-950/80 px-3 py-1 rounded-full border border-amber-500/30">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> {currentCompany.rating}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                  <span>{currentCompany.logo}</span> {currentCompany.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">Vitrine oficial e exclusiva de produtos selecionados.</p>
              </div>

              <a
                href={`https://wa.me/${currentCompany.whatsapp}?text=Olá, gostaria de tirar dúvidas sobre os produtos da ${encodeURIComponent(currentCompany.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg flex items-center gap-2 self-start sm:self-auto"
              >
                <MessageSquare className="w-4 h-4" /> Falar com a Empresa
              </a>
            </div>
          </div>
        </div>

        {/* Company Products Section */}
        <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 flex-1 w-full">
          {/* Header & Search/Filters Bar */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Produtos da Vitrine</h2>
                <p className="text-xs text-slate-400 mt-0.5">Explore o catálogo e adicione itens diretamente à sua sacola.</p>
              </div>

              {/* Search input by name/description */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="Buscar por nome ou descrição..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 pl-11 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
                />
                {companySearch && (
                  <button
                    onClick={() => setCompanySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Chips */}
            {companyCategories.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-2 border-t border-slate-800/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Categorias:</span>
                {companyCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCompanyCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      companyCategoryFilter === cat
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-bold'
                        : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Grid */}
          {filteredCompanyProducts.length === 0 ? (
            <div className="py-20 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20 text-amber-400" />
              <p className="text-sm font-semibold text-slate-300">Nenhum produto encontrado.</p>
              <p className="text-xs text-slate-500 mt-1">Tente alterar os termos da busca ou os filtros de categoria.</p>
              {(companySearch || companyCategoryFilter !== 'Todas') && (
                <button
                  onClick={() => {
                    setCompanySearch('');
                    setCompanyCategoryFilter('Todas');
                  }}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs rounded-xl transition-all font-semibold"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCompanyProducts.map(product => {
                const isFav = favorites.includes(product.id);
                return (
                  <div key={product.id} className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl hover:border-amber-500/40 transition-all flex flex-col group">
                    <div className="aspect-4/3 relative overflow-hidden bg-slate-950">
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-amber-400 border border-amber-500/25">
                        {product.category}
                      </div>

                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <button
                          onClick={() => toggleFavorite(product.id)}
                          className={`p-2 rounded-full backdrop-blur-md transition-all ${isFav ? 'bg-amber-500 text-slate-950' : 'bg-slate-950/60 text-white hover:bg-slate-950'}`}
                          title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-slate-950' : ''}`} />
                        </button>
                      </div>

                      {/* Visualizar overlay button */}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedProductDetail(product)}
                          className="px-3.5 py-2 bg-slate-950/90 hover:bg-amber-500 hover:text-slate-950 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all shadow-lg flex items-center gap-1.5"
                        >
                          <EyeIcon className="w-3.5 h-3.5" /> Visualizar
                        </button>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 
                          onClick={() => setSelectedProductDetail(product)}
                          className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 cursor-pointer"
                        >
                          {product.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{product.description}</p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-extrabold text-amber-400 font-mono">
                            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            onClick={() => setSelectedProductDetail(product)}
                            className="text-xs text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1"
                          >
                            <EyeIcon className="w-3.5 h-3.5" /> Detalhes
                          </button>
                        </div>

                        <button
                          onClick={() => addToCart(product)}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/15 flex items-center justify-center gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Adicionar à sacola
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Product Details Modal */}
        {selectedProductDetail && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
            onClick={() => setSelectedProductDetail(null)}
          >
            <div 
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl relative flex flex-col md:flex-row max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedProductDetail(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-950 transition-all border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Product Image */}
              <div className="md:w-1/2 aspect-square md:aspect-auto relative bg-slate-950 overflow-hidden shrink-0">
                <img 
                  src={selectedProductDetail.image} 
                  alt={selectedProductDetail.title} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-amber-400 border border-amber-500/25">
                  {selectedProductDetail.category}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                    <span>{selectedProductDetail.companyName}</span>
                    <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <Package className="w-3.5 h-3.5 text-amber-400" /> Estoque: {selectedProductDetail.stock}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-tight">{selectedProductDetail.title}</h3>

                  <p className="text-xs text-slate-300 leading-relaxed">{selectedProductDetail.description}</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Preço do Produto</span>
                      <span className="text-2xl font-extrabold text-amber-400 font-mono">
                        R$ {selectedProductDetail.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleFavorite(selectedProductDetail.id)}
                      className={`p-2.5 rounded-2xl border transition-all ${
                        favorites.includes(selectedProductDetail.id)
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                      title={favorites.includes(selectedProductDetail.id) ? "Favorito" : "Adicionar aos Favoritos"}
                    >
                      <Heart className={`w-5 h-5 ${favorites.includes(selectedProductDetail.id) ? 'fill-slate-950' : ''}`} />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(selectedProductDetail);
                      setSelectedProductDetail(null);
                    }}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" /> Adicionar à Sacola
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {renderCartDrawer()}
        {renderChatDrawer()}
        {renderBottomNav()}
      </div>
    );
  }

  // 3. CUSTOMER PROFILE SCREEN
  if (viewMode === 'profile') {
    const favoriteProducts = products.filter(p => favorites.includes(p.id));

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col pb-24">
        {renderPublicHeader()}

        <main className="max-w-5xl mx-auto px-6 py-10 space-y-8 flex-1 w-full">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="relative group shrink-0">
                {renderLuxuryAvatar(profile.avatar, profile.name, 'w-24 h-24 sm:w-28 sm:h-28 text-2xl')}
                <label className="absolute bottom-0 right-0 p-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full cursor-pointer shadow-md transition-all group-hover:scale-105" title="Alterar foto da galeria">
                  <Camera className="w-4 h-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const newAvatar = reader.result as string;
                          setProfile(prev => ({ ...prev, avatar: newAvatar }));
                          try {
                            localStorage.setItem(`studioroyale_user_avatar_${profile.email.toLowerCase()}`, newAvatar);
                          } catch (err) {}
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-bold text-white tracking-tight">{profile.name}</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/25">
                    Cliente VIP
                  </span>
                </div>
                <p className="text-xs text-amber-400 font-mono font-medium">{profile.email}</p>
                <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1 pt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500/80 shrink-0" /> {profile.address || 'Endereço não cadastrado'}
                </p>
                {profile.phone && (
                  <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-500/80 shrink-0" /> {profile.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <label className="cursor-pointer px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 shadow-sm">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>{profile.avatar ? 'Substituir Foto' : 'Adicionar Foto'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        const newAvatar = reader.result as string;
                        setProfile(prev => ({ ...prev, avatar: newAvatar }));
                        try {
                          localStorage.setItem(`studioroyale_user_avatar_${profile.email.toLowerCase()}`, newAvatar);
                        } catch (err) {}
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>

              {profile.avatar && (
                <button
                  type="button"
                  onClick={() => {
                    setProfile(prev => ({ ...prev, avatar: '' }));
                    try {
                      localStorage.removeItem(`studioroyale_user_avatar_${profile.email.toLowerCase()}`);
                    } catch (err) {}
                  }}
                  className="px-4 py-2.5 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-500/30 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                  title="Remover foto e restaurar monograma elegante"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remover Foto</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 overflow-x-auto">
            <button
              onClick={() => setProfileTab('info')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
                profileTab === 'info' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" /> Dados Pessoais
            </button>
            <button
              onClick={() => setProfileTab('favorites')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
                profileTab === 'favorites' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4" /> Favoritos ({favorites.length})
            </button>
            <button
              onClick={() => setProfileTab('orders')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
                profileTab === 'orders' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" /> Histórico de Pedidos ({orders.length})
            </button>
            <button
              onClick={() => setProfileTab('appointments')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
                profileTab === 'appointments' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" /> Agendamentos VIP ({appointments.length})
            </button>
          </div>

          {profileTab === 'info' && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Editar Informações Pessoais</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Atualize seus dados de cadastro e preferências de entrega.</p>
                </div>
              </div>

              {profileSavedToast && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>Dados pessoais e foto atualizados com sucesso!</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome Completo</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    placeholder="Seu nome completo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">E-mail</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      placeholder="seu.email@exemplo.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      placeholder="(11) 99999-9999"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Endereço de Entrega</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile({...profile, address: e.target.value})}
                    placeholder="Endereço completo para entregas"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bio / Preferências</label>
                  <textarea
                    rows={3}
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    placeholder="Descreva suas preferências de compra ou observações"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Salvar Alterações
                  </button>

                  <label className="w-full sm:w-auto cursor-pointer px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Trocar Foto de Perfil</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const newAvatar = reader.result as string;
                            setProfile(prev => ({ ...prev, avatar: newAvatar }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </form>
            </div>
          )}

          {profileTab === 'favorites' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white">Produtos Favoritos</h2>
              {favoriteProducts.length === 0 ? (
                <div className="py-20 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800">
                  <Heart className="w-12 h-12 mx-auto mb-3 opacity-20 text-amber-400" />
                  <p className="text-xs">Nenhum produto favoritado ainda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {favoriteProducts.map(product => (
                    <div key={product.id} className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl flex flex-col">
                      <div className="aspect-4/3 relative overflow-hidden bg-slate-950">
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          onClick={() => toggleFavorite(product.id)}
                          className="absolute top-3 right-3 p-2 rounded-full bg-amber-500 text-slate-950"
                        >
                          <Heart className="w-4 h-4 fill-slate-950" />
                        </button>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-white text-sm mb-1">{product.title}</h4>
                          <div className="text-xs text-amber-400 font-mono font-bold mb-3">R$ {product.price.toFixed(2)}</div>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl transition-all"
                        >
                          Adicionar à sacola
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {profileTab === 'orders' && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" /> Histórico de Pedidos ({orders.length})
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Consulte suas solicitações de compras, produtos, quantidades, valores e status de análise pelo salão. Histórico mantido separado dos agendamentos VIP.
                  </p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="py-16 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800 p-6 space-y-3">
                  <ShoppingBag className="w-12 h-12 mx-auto opacity-20 text-amber-400" />
                  <p className="text-sm font-semibold text-slate-300">Nenhum pedido realizado até o momento.</p>
                  <p className="text-xs text-slate-500">Explore nossa Vitrine para adicionar produtos à sua sacola e enviar solicitações.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => {
                    const isPending = order.status === 'Aguardando Análise' || order.status.includes('Análise');
                    const isDelivered = order.status === 'Entregue' || order.status === 'Concluído';

                    return (
                      <div key={order.id} className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4 hover:border-slate-700/80 transition-all">
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-white text-sm font-mono">{order.id}</span>
                              {isPending ? (
                                <span className="px-3 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" /> Aguardando Análise do Salão
                                </span>
                              ) : isDelivered ? (
                                <span className="px-3 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> {order.status}
                                </span>
                              ) : (
                                <span className="px-3 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  {order.status}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">Data da Solicitação: {order.date}</p>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-[11px] text-slate-400 block">Valor Total:</span>
                            <span className="text-lg font-extrabold text-amber-400 font-mono">R$ {order.total.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Order Details Breakdown */}
                        {order.details && order.details.length > 0 ? (
                          <div className="space-y-2 pt-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Produtos no Pedido:</span>
                            <div className="grid grid-cols-1 gap-2">
                              {order.details.map((detail, idx) => (
                                <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center gap-3">
                                  {detail.image && (
                                    <img src={detail.image} alt={detail.title} className="w-12 h-12 rounded-xl object-cover bg-slate-900 shrink-0" referrerPolicy="no-referrer" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-semibold text-white text-xs truncate">{detail.title}</h5>
                                    {detail.companyName && (
                                      <span className="text-[10px] text-amber-400/90 font-mono block">{detail.companyName}</span>
                                    )}
                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                      Quantidade: <span className="text-white font-mono font-semibold">{detail.quantity}</span> | Valor Un.: <span className="text-slate-300 font-mono">R$ {detail.price.toFixed(2)}</span>
                                    </div>
                                  </div>
                                  <div className="text-xs font-mono font-bold text-amber-400 shrink-0">
                                    R$ {(detail.quantity * detail.price).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-2xl border border-slate-800">{order.items}</p>
                        )}

                        {/* Footer note */}
                        <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span>Solicitação registrada para análise e orçamento do salão.</span>
                          <a
                            href={`https://wa.me/5511998887766?text=${encodeURIComponent(`Olá, gostaria de saber sobre a análise do pedido ${order.id}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Consultar no WhatsApp
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {profileTab === 'appointments' && (
            <div className="space-y-8">
              {/* Header & Main Action */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-amber-400" /> Módulo de Agendamentos VIP
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Agende consultorias exclusivas, solicite remarcação/cancelamento e acompanhe a fila de espera em tempo real.
                  </p>
                </div>

                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Novo Agendamento
                </button>
              </div>

              {/* Action Toast Alert */}
              {appointmentToast && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-amber-400" />
                  <span>{appointmentToast}</span>
                </div>
              )}

              {/* Main Content Grid: Appointments List + Waitlist */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Appointments List (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" /> Seus Agendamentos ({appointments.length})
                  </h3>

                  {appointments.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800 p-6 space-y-4">
                      <Calendar className="w-12 h-12 mx-auto opacity-20 text-amber-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-300">Nenhum agendamento ativo.</p>
                        <p className="text-xs text-slate-500 mt-1">Clique abaixo para escolher um serviço e horário disponível.</p>
                      </div>
                      <button
                        onClick={() => setIsBookingModalOpen(true)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs rounded-xl font-semibold transition-all inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Realizar Primeiro Agendamento
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointments.map(app => {
                        const isConfirmed = app.status === 'confirmado';
                        const isPendingReschedule = app.status === 'pendente_remarcacao';
                        const isPendingCancel = app.status === 'pendente_cancelamento';
                        const isCancelled = app.status === 'cancelado';

                        return (
                          <div 
                            key={app.id}
                            className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4 hover:border-slate-700/80 transition-all"
                          >
                            {/* Card Top */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
                              <div>
                                <span className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider block">
                                  {app.companyName}
                                </span>
                                <h4 className="text-base font-bold text-white tracking-tight">{app.serviceName}</h4>
                                <span className="text-[11px] text-slate-500 font-mono">Código: {app.id}</span>
                              </div>

                              {/* Status Badge */}
                              <div className="self-start sm:self-auto">
                                {isConfirmed && (
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmado
                                  </span>
                                )}
                                {isPendingReschedule && (
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Remarcação Pendente
                                  </span>
                                )}
                                {isPendingCancel && (
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" /> Cancelamento Pendente
                                  </span>
                                )}
                                {isCancelled && (
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
                                    <X className="w-3.5 h-3.5" /> Cancelado
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Card Middle: Date & Time details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
                              <div className="flex items-center gap-2 text-slate-300">
                                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                                <div>
                                  <span className="text-slate-500 block text-[10px]">Data Agendada</span>
                                  <span className="font-semibold">{app.date.split('-').reverse().join('/')}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-slate-300">
                                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                <div>
                                  <span className="text-slate-500 block text-[10px]">Horário Reservado</span>
                                  <span className="font-semibold">{app.time} hs</span>
                                </div>
                              </div>
                            </div>

                            {/* Pending Reschedule Details if applicable */}
                            {isPendingReschedule && app.requestedNewDate && (
                              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-xs text-amber-300 space-y-1">
                                <div className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Solicitação de Nova Data Enviada
                                </div>
                                <p className="text-[11px] text-slate-300">
                                  Nova Data Solicitada: <strong className="text-white">{app.requestedNewDate.split('-').reverse().join('/')}</strong> às <strong className="text-white">{app.requestedNewTime} hs</strong>.
                                </p>
                                <p className="text-[10px] text-slate-400 italic">Aguardando aprovação da equipe.</p>
                              </div>
                            )}

                            {/* Notes */}
                            {app.notes && (
                              <p className="text-xs text-slate-400 italic bg-slate-950/30 p-2.5 rounded-xl border border-slate-800/40">
                                &quot;{app.notes}&quot;
                              </p>
                            )}

                            {/* Card Actions: Reschedule & Cancel buttons */}
                            {!isCancelled && (
                              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                                <button
                                  onClick={() => {
                                    setRescheduleAppointment(app);
                                    setRescheduleDate(app.date);
                                    setRescheduleTime(app.time);
                                  }}
                                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" /> Solicitar Remarcação
                                </button>

                                {app.status !== 'pendente_cancelamento' && (
                                  <button
                                    onClick={() => handleRequestCancellation(app.id)}
                                    className="px-3.5 py-2 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/25 transition-all flex items-center gap-1.5"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Solicitar Cancelamento
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Waiting List ("Fila de Espera em Tempo Real") */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" /> Fila de Espera em Tempo Real
                  </h3>

                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
                    {waitlist.length === 0 ? (
                      /* Strictly display no fake info if empty */
                      <div className="py-10 text-center text-slate-500 space-y-3">
                        <Users className="w-10 h-10 mx-auto opacity-20 text-amber-400" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Fila de Espera Vazia</h4>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Não há solicitações na fila de espera no momento. Caso algum horário de alta demanda esteja esgotado, você poderá se inscrever aqui com dados reais em tempo real.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Display actual real waitlist data */
                      <div className="space-y-4">
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-300">
                          Acompanhamento oficial da sua posição na fila de espera dos serviços VIP.
                        </div>

                        {waitlist.map(item => (
                          <div key={item.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-white">{item.serviceName}</span>
                              <span className="text-[10px] text-amber-400 font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                Pos. #{item.position}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400 space-y-1">
                              <div>Data solicitada: <strong className="text-slate-200">{item.date.split('-').reverse().join('/')} às {item.time}hs</strong></div>
                              <div>Previsão de Atendimento: <strong className="text-emerald-400">~{item.estimatedWaitMinutes} minutos</strong></div>
                            </div>

                            <button
                              onClick={() => handleLeaveWaitlist(item.id)}
                              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all border border-slate-700"
                            >
                              Sair da Fila de Espera
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* MODAL DE NOVO AGENDAMENTO */}
        {isBookingModalOpen && (
          <div 
            onClick={() => setIsBookingModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" /> Agendar Serviço VIP
                </h3>
                <button 
                  onClick={() => setIsBookingModalOpen(false)} 
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800"
                >
                  <X className="w-5 h-5 text-amber-400" />
                </button>
              </div>

              <form onSubmit={handleCreateAppointment} className="space-y-5">
                {/* 1. Selecionar Serviço */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">1. Selecione o Serviço</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {availableServices.map(s => (
                      <option key={s.id} value={s.id}>{s.title} - {s.companyName} ({s.duration})</option>
                    ))}
                  </select>
                </div>

                {/* Service description card */}
                {(() => {
                  const s = availableServices.find(srv => srv.id === selectedServiceId);
                  return s ? (
                    <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl text-xs space-y-1">
                      <div className="text-amber-400 font-bold">{s.title} &bull; {s.price}</div>
                      <div className="text-slate-400">{s.description}</div>
                    </div>
                  ) : null;
                })()}

                {/* 2. Selecionar Data */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">2. Escolha a Data</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* 3. Selecionar Horário Disponível */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">3. Escolha o Horário Disponível</label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimeSlots.map(slot => {
                      const isBlocked = isSlotBlockedByConfirmed(selectedServiceId, bookingDate, slot);
                      const isSelected = bookingTime === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setBookingTime(slot)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5 ${
                            isBlocked
                              ? 'bg-rose-950/20 border-rose-500/30 text-rose-400 hover:bg-rose-950/40'
                              : isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span>{slot} hs</span>
                          {isBlocked && (
                            <span className="text-[9px] font-normal text-rose-400">Ocupado</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Conflict detection alert */}
                  {isSlotBlockedByConfirmed(selectedServiceId, bookingDate, bookingTime) && (
                    <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 space-y-2">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        Horário Ocupado por Agendamento Confirmado
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Este horário já foi confirmado para outro atendimento. Você pode escolher outro horário livre acima ou entrar na fila de espera oficial.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleJoinWaitlist(selectedServiceId, bookingDate, bookingTime)}
                        className="w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold rounded-xl border border-rose-500/40 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5" /> Entrar na Fila de Espera Real
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. Observações */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Observações (Opcional)</label>
                  <textarea
                    rows={2}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Preferências específicas para o atendimento..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Form Actions */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-2xl hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSlotBlockedByConfirmed(selectedServiceId, bookingDate, bookingTime)}
                    className={`px-6 py-2.5 text-xs font-bold rounded-2xl transition-all shadow-lg flex items-center gap-2 ${
                      isSlotBlockedByConfirmed(selectedServiceId, bookingDate, bookingTime)
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    }`}
                  >
                    <Check className="w-4 h-4" /> Confirmar Agendamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE REMARCAÇÃO DE AGENDAMENTO */}
        {rescheduleAppointment && (
          <div 
            onClick={() => setRescheduleAppointment(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-amber-400" /> Solicitar Remarcação
                </h3>
                <button 
                  onClick={() => setRescheduleAppointment(null)} 
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800"
                >
                  <X className="w-5 h-5 text-amber-400" />
                </button>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1">
                <div className="text-amber-400 font-bold">{rescheduleAppointment.serviceName}</div>
                <div className="text-slate-400">Atendimento atual: {rescheduleAppointment.date.split('-').reverse().join('/')} às {rescheduleAppointment.time}hs</div>
              </div>

              <form onSubmit={handleRequestReschedule} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Escolha a Nova Data Desejada</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Escolha o Novo Horário Desejado</label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimeSlots.map(slot => {
                      const isBlocked = isSlotBlockedByConfirmed(rescheduleAppointment.serviceId, rescheduleDate, slot);
                      const isSelected = rescheduleTime === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setRescheduleTime(slot)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center ${
                            isBlocked
                              ? 'bg-rose-950/20 border-rose-500/30 text-rose-400 opacity-60'
                              : isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span>{slot} hs</span>
                        </button>
                      );
                    })}
                  </div>

                  {isSlotBlockedByConfirmed(rescheduleAppointment.serviceId, rescheduleDate, rescheduleTime) && (
                    <p className="text-xs text-rose-400 mt-2 font-medium">
                      O novo horário selecionado já possui um agendamento confirmado. Por favor, escolha outro horário.
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setRescheduleAppointment(null)}
                    className="px-5 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-2xl hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSlotBlockedByConfirmed(rescheduleAppointment.serviceId, rescheduleDate, rescheduleTime)}
                    className={`px-6 py-2.5 text-xs font-bold rounded-2xl transition-all shadow-lg flex items-center gap-2 ${
                      isSlotBlockedByConfirmed(rescheduleAppointment.serviceId, rescheduleDate, rescheduleTime)
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" /> Enviar Solicitação
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {renderCartDrawer()}
        {renderChatDrawer()}
        {renderBottomNav()}
      </div>
    );
  }

  // 4. AUTHENTICATED ADMIN PANEL & ACCESS CONTROL
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {authTab === 'login' ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-center text-amber-400 mx-auto mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Painel Administrativo</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Acesse com suas credenciais de administrador ou equipe.
                </p>
              </div>

              {loginError && (
                <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@vitrine.local"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Acessar Painel'}
                </button>
              </form>

              {/* Acesso Provisório de Demonstração */}
              <div className="mt-4 p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-center space-y-2">
                <div className="text-[11px] text-slate-400">
                  Acesso de Demonstração Provisório:
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@studioroyale.com.br');
                    setPassword('StudioAdmin2026!');
                  }}
                  className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-xs rounded-xl border border-amber-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preencher Credenciais de Administrador</span>
                </button>
                <div className="text-[10px] text-slate-500 font-mono">
                  admin@studioroyale.com.br &bull; StudioAdmin2026!
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800 text-center flex flex-col gap-2">
                <button
                  onClick={() => setAuthTab('register')}
                  className="text-xs text-amber-400 font-bold hover:underline"
                >
                  Não tem uma conta? Cadastre-se como Cliente
                </button>
                <button
                  onClick={() => setViewMode('home')}
                  className="text-xs text-slate-400 hover:text-slate-300"
                >
                  &larr; Voltar ao Início Público
                </button>
              </div>
            </div>
          ) : (
            <RegisterForm
              onSuccess={() => setAuthTab('login')}
              onSwitchToLogin={() => setAuthTab('login')}
            />
          )}
        </div>
      </div>
    );
  }

  // Se o usuário estiver autenticado como 'cliente', bloqueia o acesso às rotas internas do painel de gestão
  if (session.role === 'cliente') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/25 rounded-3xl flex items-center justify-center text-rose-400 mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Acesso Restrito ao Painel</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Sua conta (<span className="text-amber-400 font-mono font-bold">{session.email}</span>) possui o perfil de <span className="text-amber-400 font-bold uppercase">Cliente</span>. Apenas administradores e profissionais autorizados possuem permissão de acesso às rotas internas do painel de gestão.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => setViewMode('home')}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/15"
            >
              Voltar ao Início Público
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-2xl transition-all border border-slate-700"
            >
              Sair da Conta
            </button>
          </div>
        </div>
        {renderChatDrawer()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-inner">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-white">Studio Royale</h1>
                <p className="text-[11px] text-slate-400 font-medium">Painel de Gestão & Concierge</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div 
                onClick={() => setActiveTab('settings')}
                className="cursor-pointer group relative shrink-0" 
                title="Configurações de Perfil da Equipe"
              >
                {renderLuxuryAvatar(staffAvatar, session?.name || 'Administrador', 'w-10 h-10 text-xs')}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" title="Online" />
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-white flex items-center justify-end gap-1.5">
                  <span>{session?.name}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/25">
                    {session?.role === 'admin' ? 'Administrador' : 'Profissional'}
                  </span>
                </div>
                <div className="text-[10px] text-amber-400 font-mono">{session?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Sair do Sistema"
                className="p-2.5 bg-red-950/30 hover:bg-red-900/40 text-red-400 rounded-xl border border-red-500/25 transition-all shadow-sm"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Layout with Sidebar + Content */}
      <div className="flex-1 flex relative">
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          />
        )}

        <aside 
          onClick={(e) => e.stopPropagation()}
          className={`
          fixed md:static top-[73px] bottom-0 left-0 z-40 w-72 bg-slate-900/95 border-r border-slate-800/80 p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <nav className="space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Navegação Principal
            </div>

            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full px-4 py-3 text-xs font-semibold rounded-2xl transition-all flex items-center gap-3.5 group ${
                activeTab === 'dashboard' 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 transition-colors ${activeTab === 'dashboard' ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} /> Dashboard
            </button>

            <button
              onClick={() => { setActiveTab('showcases'); setMobileMenuOpen(false); }}
              className={`w-full px-4 py-3 text-xs font-semibold rounded-2xl transition-all flex items-center gap-3.5 group ${
                activeTab === 'showcases' 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Store className={`w-4 h-4 transition-colors ${activeTab === 'showcases' ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} /> Vitrines
            </button>

            <button
              onClick={() => { setActiveTab('products'); setMobileMenuOpen(false); }}
              className={`w-full px-4 py-3 text-xs font-semibold rounded-2xl transition-all flex items-center gap-3.5 group ${
                activeTab === 'products' 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Package className={`w-4 h-4 transition-colors ${activeTab === 'products' ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} /> Produtos
            </button>

            <button
              onClick={() => { setActiveTab('banners'); setMobileMenuOpen(false); }}
              className={`w-full px-4 py-3 text-xs font-semibold rounded-2xl transition-all flex items-center gap-3.5 group ${
                activeTab === 'banners' 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ImageIcon className={`w-4 h-4 transition-colors ${activeTab === 'banners' ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} /> Banners
            </button>

            <button
              onClick={() => { setActiveTab('categories'); setMobileMenuOpen(false); }}
              className={`w-full px-4 py-3 text-xs font-semibold rounded-2xl transition-all flex items-center gap-3.5 group ${
                activeTab === 'categories' 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Tags className={`w-4 h-4 transition-colors ${activeTab === 'categories' ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} /> Categorias
            </button>

            {/* Apenas administradores enxergam a opção de Leads no menu lateral */}
            {session?.role === 'admin' && (
              <button
                onClick={() => { setActiveTab('leads'); setMobileMenuOpen(false); }}
                className={`w-full px-4 py-3 text-xs font-semibold rounded-2xl transition-all flex items-center gap-3.5 group ${
                  activeTab === 'leads' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className={`w-4 h-4 transition-colors ${activeTab === 'leads' ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} /> Leads / Clientes
              </button>
            )}

            <div className="pt-6 pb-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Ferramentas & Sistema
            </div>

            <button
              onClick={() => { setActiveTab('ai'); setMobileMenuOpen(false); }}
              className={`w-full px-4 py-3 text-xs font-semibold rounded-2xl transition-all flex items-center gap-3.5 group ${
                activeTab === 'ai' 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" /> IA Copywriter
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
              className={`w-full px-4 py-3 text-xs font-semibold rounded-2xl transition-all flex items-center gap-3.5 group ${
                activeTab === 'settings' 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className={`w-4 h-4 transition-colors ${activeTab === 'settings' ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} /> Configurações
            </button>

            <div className="pt-6 pb-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Navegação Pública
            </div>

            <button
              onClick={() => { setViewMode('home'); setMobileMenuOpen(false); }}
              className="w-full px-4 py-3 text-xs font-semibold rounded-2xl transition-all flex items-center gap-3.5 text-slate-400 hover:text-white hover:bg-slate-800/60 group border border-amber-500/20 bg-amber-500/5 shadow-sm"
            >
              <ExternalLink className="w-4 h-4 text-amber-400 transition-colors" /> Ver Início Público
            </button>
          </nav>

          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl mt-auto shadow-inner">
            <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Status do Sistema</span>
              <span className="text-emerald-400 font-mono text-[10px]">v2.4</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
              <span>Conectado & Seguro</span>
            </div>
          </div>
        </aside>

        {/* Content Area to the Right */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-950">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Painel Geral</h2>
                    <p className="text-xs text-slate-400 mt-1">Visão estatística e desempenho das suas vitrines digitais.</p>
                  </div>
                  <button 
                    onClick={openAddProductModal}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15"
                  >
                    <Plus className="w-4 h-4" /> Novo Produto
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vitrines Ativas</span>
                      <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20"><Store className="w-4 h-4" /></div>
                    </div>
                    <div className="text-3xl font-extrabold text-white mb-1.5 font-mono">2</div>
                    <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">+100% online</div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Produtos Cadastrados</span>
                      <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20"><Package className="w-4 h-4" /></div>
                    </div>
                    <div className="text-3xl font-extrabold text-white mb-1.5 font-mono">{products.length}</div>
                    <div className="text-xs text-blue-400 font-medium">Em catálogo ativo</div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Banners Ativos</span>
                      <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20"><ImageIcon className="w-4 h-4" /></div>
                    </div>
                    <div className="text-3xl font-extrabold text-white mb-1.5 font-mono">{banners.filter(b => b.status === 'active').length}</div>
                    <div className="text-xs text-purple-400 font-medium">Carrossel otimizado</div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Orçamentos / Leads</span>
                      <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20"><Users className="w-4 h-4" /></div>
                    </div>
                    <div className="text-3xl font-extrabold text-white mb-1.5 font-mono">14</div>
                    <div className="text-xs text-emerald-400 font-medium">Alta conversão</div>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-7 shadow-xl">
                  <h3 className="text-base font-bold text-white mb-5 tracking-tight">Produtos Recentes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-medium">
                          <th className="pb-3.5 pl-2">Produto</th>
                          <th className="pb-3.5">Empresa</th>
                          <th className="pb-3.5">Categoria</th>
                          <th className="pb-3.5">Preço</th>
                          <th className="pb-3.5 pr-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {products.map(p => (
                          <tr key={p.id} className="hover:bg-slate-800/30 transition-colors group">
                            <td className="py-4 pl-2 flex items-center gap-3.5">
                              <img src={p.image} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-800 shadow-sm" referrerPolicy="no-referrer" />
                              <span className="font-semibold text-white group-hover:text-amber-400 transition-colors">{p.title}</span>
                            </td>
                            <td className="py-4 text-amber-400 font-medium">{p.companyName}</td>
                            <td className="py-4 text-slate-300 font-medium">{p.category}</td>
                            <td className="py-4 font-mono text-amber-400 font-semibold">R$ {p.price.toFixed(2)}</td>
                            <td className="py-4 pr-2">
                              <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                {p.status === 'active' ? 'Ativo' : 'Rascunho'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SHOWCASES TAB */}
            {activeTab === 'showcases' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Gerenciamento de Vitrines</h2>
                    <p className="text-xs text-slate-400 mt-1">Organize layouts e coleções temáticas para seus clientes.</p>
                  </div>
                  <button 
                    onClick={() => alert('Criação de vitrine customizada')}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15"
                  >
                    <Plus className="w-4 h-4" /> Nova Vitrine
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {showcases.map(s => (
                    <div key={s.id} className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-amber-500/35 transition-all group">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold text-amber-400">{s.companyName}</span>
                          <span className="text-xs text-slate-400 font-mono">{s.views} visualizações</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1.5">{s.name}</h3>
                        <p className="text-xs text-slate-400 mb-6">Tema: {s.theme} &bull; Banners: {banners.filter(b => b.showcaseId === s.id).length} cadastrados</p>
                      </div>
                      <div className="flex items-center gap-2 pt-4 border-t border-slate-800/80">
                        <button 
                          onClick={() => setViewMode('home')}
                          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 transition-all flex items-center justify-center gap-2 border border-slate-700/60"
                        >
                          <EyeIcon className="w-3.5 h-3.5 text-amber-400" /> Ver no PWA Público
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Gerenciamento de Produtos</h2>
                    <p className="text-xs text-slate-400 mt-1">Cadastre, edite, ative e vincule produtos às vitrines e empresas.</p>
                  </div>
                  <button 
                    onClick={openAddProductModal}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15"
                  >
                    <Plus className="w-4 h-4" /> Cadastrar Produto
                  </button>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
                  <Search className="w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    placeholder="Filtrar produtos por nome, categoria ou empresa..."
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-7 shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {products.filter(p => p.title.toLowerCase().includes(adminSearchQuery.toLowerCase()) || p.category.toLowerCase().includes(adminSearchQuery.toLowerCase()) || p.companyName.toLowerCase().includes(adminSearchQuery.toLowerCase())).map(product => {
                      const linkedShowcase = showcases.find(s => s.id === product.showcaseId);
                      return (
                        <div key={product.id} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col group hover:border-amber-500/35 transition-all shadow-md">
                          <div className="aspect-4/3 relative overflow-hidden bg-slate-900">
                            <img src={product.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                            <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs text-amber-400 font-mono font-semibold border border-amber-500/25">
                              R$ {product.price.toFixed(2)}
                            </div>
                            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold ${product.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                              {product.status === 'active' ? 'Ativo' : 'Rascunho'}
                            </div>
                          </div>
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="text-[11px] font-semibold text-amber-400 mb-1 flex items-center justify-between">
                                <span>{product.companyName}</span>
                                <span className="text-slate-400 font-normal">Vitrine: {linkedShowcase?.name ? linkedShowcase.name.split(' - ')[0] : 'Geral'}</span>
                              </div>
                              <h4 className="font-bold text-white text-sm mb-1.5">{product.title}</h4>
                              <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{product.description}</p>
                            </div>
                            <div className="space-y-3 pt-3 border-t border-slate-800/80">
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Estoque: <strong className="text-white font-mono">{product.stock} un.</strong></span>
                                <span className="text-slate-300">{product.category}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditProductModal(product)}
                                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                                >
                                  <Edit className="w-3.5 h-3.5 text-amber-400" /> Editar
                                </button>
                                <button
                                  onClick={() => toggleProductStatus(product.id)}
                                  className={`px-3 py-2 text-xs font-semibold rounded-xl transition-colors border ${product.status === 'active' ? 'bg-amber-950/40 text-amber-300 border-amber-500/30' : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'}`}
                                >
                                  {product.status === 'active' ? 'Desativar' : 'Ativar'}
                                </button>
                                <button 
                                  onClick={() => deleteProduct(product.id)}
                                  className="p-2 bg-red-950/30 hover:bg-red-900/40 text-red-400 rounded-xl border border-red-500/20 transition-colors"
                                  title="Excluir produto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* BANNERS TAB */}
            {activeTab === 'banners' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Gerenciamento de Banners</h2>
                    <p className="text-xs text-slate-400 mt-1">Crie, edite, reordene e defina banners para a página inicial e vitrines.</p>
                  </div>
                  <button 
                    onClick={openAddBannerModal}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15"
                  >
                    <Plus className="w-4 h-4" /> Novo Banner
                  </button>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-7 shadow-xl">
                  <div className="space-y-4">
                    {banners.map((banner, index) => {
                      const targetShowcase = showcases.find(s => s.id === banner.showcaseId);
                      const targetName = banner.showcaseId === 'home' ? 'Página Inicial (Home PWA)' : (targetShowcase?.name || 'Vitrine Específica');
                      return (
                        <div key={banner.id} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-500/35 transition-all shadow-md">
                          <div className="flex items-center gap-4">
                            <img src={banner.image} alt="" className="w-24 h-14 rounded-xl object-cover bg-slate-900 shadow-sm shrink-0" referrerPolicy="no-referrer" />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{banner.title}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${banner.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                                  {banner.status === 'active' ? 'Ativo' : 'Rascunho'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400">Exibição: <strong className="text-amber-400">{targetName}</strong> &bull; Ordem: <span className="font-mono text-white">#{banner.order}</span></div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
                              <button 
                                onClick={() => moveBannerOrder(banner.id, 'up')}
                                disabled={index === 0}
                                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                                title="Mover para cima"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => moveBannerOrder(banner.id, 'down')}
                                disabled={index === banners.length - 1}
                                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                                title="Mover para baixo"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              onClick={() => openEditBannerModal(banner)}
                              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5"
                            >
                              <Edit className="w-3.5 h-3.5 text-amber-400" /> Editar
                            </button>
                            <button
                              onClick={() => deleteBanner(banner.id)}
                              className="p-2 bg-red-950/30 hover:bg-red-900/40 text-red-400 rounded-xl border border-red-500/20 transition-colors"
                              title="Excluir banner"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORIES TAB */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Categorias da Vitrine</h2>
                  <p className="text-xs text-slate-400 mt-1">Gerencie os marcadores e seções das coleções.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {['Relógios', 'Móveis', 'Decoração', 'Joias', 'Iluminação'].map(cat => (
                    <div key={cat} className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl flex items-center justify-between shadow-xl">
                      <span className="font-semibold text-white">{cat}</span>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Ativa
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LEADS TAB */}
            {activeTab === 'leads' && (
              session?.role === 'admin' ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Leads e Solicitações de Orçamento</h2>
                    <p className="text-xs text-slate-400 mt-1">Acompanhe clientes interessados via WhatsApp e canais diretos.</p>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-7 shadow-xl">
                    <div className="space-y-4">
                      <div className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-white text-sm mb-1">Carlos Eduardo (São Paulo - SP)</h4>
                          <p className="text-xs text-slate-400">Interesse em: Relógio Suíço Minimalista Von Steiger</p>
                        </div>
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Contato via WhatsApp
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-slate-900/80 border border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Acesso Restrito a Administradores</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Apenas usuários com perfil de Administrador possuem permissão para visualizar a gestão de Leads e Clientes.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/15"
                  >
                    Voltar ao Dashboard
                  </button>
                </div>
              )
            )}

            {/* AI COPYWRITER TAB */}
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    <Sparkles className="w-6 h-6 text-amber-400" /> Assistente de IA Copywriter
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Gere descrições comerciais de alto impacto com Gemini para suas vitrines.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-7 space-y-5 shadow-xl">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">Título do Produto / Peça</label>
                      <input
                        type="text"
                        value={aiProductTitle}
                        onChange={(e) => setAiProductTitle(e.target.value)}
                        placeholder="Ex: Abajur em Mármore Travertino"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">Categoria</label>
                      <select
                        value={aiCategory}
                        onChange={(e) => setAiCategory(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/60"
                      >
                        <option value="Decoração">Decoração</option>
                        <option value="Móveis">Móveis</option>
                        <option value="Relógios">Relógios</option>
                        <option value="Joias">Joias</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">Instruções para a IA (Opcional)</label>
                      <textarea
                        rows={3}
                        value={aiPrompt}
                        onChange={(e) => AiPrompt(e.target.value)}
                        placeholder="Ex: Enfatize o acabamento artesanal e exclusividade para colecionadores."
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                      />
                    </div>

                    <button
                      onClick={handleGenerateAI}
                      disabled={aiLoading || !aiProductTitle}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                    >
                      {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Gerar Descrição Comercial</>}
                    </button>
                  </div>

                  {/* AI Output Result */}
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-7 flex flex-col justify-between shadow-xl">
                    <div>
                      <h3 className="text-xs font-bold text-amber-400 mb-4 uppercase tracking-wider">Resultado Gerado pela IA</h3>
                      {aiResult ? (
                        <div className="space-y-4">
                          <div>
                            <div className="text-xs text-slate-400 mb-1 font-medium">Título Refinado:</div>
                            <div className="text-base font-bold text-white">{aiResult.title}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1 font-medium">Resumo Curto:</div>
                            <div className="text-sm text-slate-300">{aiResult.shortDescription}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1 font-medium">Descrição Completa:</div>
                            <div className="text-sm text-slate-300 leading-relaxed bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                              {aiResult.fullDescription}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
                          <Sparkles className="w-10 h-10 mb-2 opacity-30 text-amber-400" />
                          <p className="text-xs">Preencha os dados ao lado e clique em gerar para criar conteúdo profissional.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS TAB: PERFIL, CHATBOT & PARÂMETROS */}
            {activeTab === 'settings' && (
              <div className="space-y-8 animate-fadeIn max-w-5xl">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Configurações & Perfis</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Gerencie seu perfil de acesso, personalize a identidade visual do assistente/chatbot e ajuste os parâmetros do Studio Royale.
                  </p>
                </div>

                {settingsFeedback && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-semibold animate-fadeIn shadow-lg shadow-emerald-500/5">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    <span>{settingsFeedback}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 1. MEU PERFIL DE EQUIPE (ADMINISTRADOR / PROFISSIONAL) */}
                  <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white">Meu Perfil de Equipe</h3>
                            <p className="text-[11px] text-slate-400">Identificação no painel e nos registros do sistema</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/25">
                          {session?.role === 'admin' ? 'Administrador' : 'Profissional'}
                        </span>
                      </div>

                      {/* Foto / Avatar do Usuário Conectado */}
                      <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
                        <div className="relative group shrink-0">
                          {renderLuxuryAvatar(staffAvatar, session?.name || 'Administrador', 'w-20 h-20 text-xl')}
                          <label 
                            htmlFor="staff-avatar-upload"
                            className="absolute -bottom-1 -right-1 p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full cursor-pointer shadow-md transition-transform hover:scale-110"
                            title="Alterar foto da equipe"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </label>
                          <input 
                            id="staff-avatar-upload"
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const newAvatar = reader.result as string;
                                  setStaffAvatar(newAvatar);
                                  localStorage.setItem('studioroyale_staff_avatar', newAvatar);
                                  if (session?.email) {
                                    localStorage.setItem(`studioroyale_user_avatar_${session.email.toLowerCase()}`, newAvatar);
                                  }
                                  showSettingsFeedback('Foto de perfil atualizada com sucesso!');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>

                        <div className="flex-1 text-center sm:text-left min-w-0">
                          <h4 className="text-xs font-semibold text-white">Foto do Perfil Administrativo</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {staffAvatar ? 'Foto ativa visível no cabeçalho e na auditoria interna.' : 'Sem foto cadastrada. Exibindo monograma de luxo padrão.'}
                          </p>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                            <label
                              htmlFor="staff-avatar-upload"
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-xl text-[11px] font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>{staffAvatar ? 'Substituir Foto' : 'Adicionar Foto'}</span>
                            </label>
                            {staffAvatar && (
                              <button
                                type="button"
                                onClick={() => {
                                  setStaffAvatar('');
                                  localStorage.removeItem('studioroyale_staff_avatar');
                                  if (session?.email) {
                                    localStorage.removeItem(`studioroyale_user_avatar_${session.email.toLowerCase()}`);
                                  }
                                  showSettingsFeedback('Foto removida. Monograma restaurado com sucesso!');
                                }}
                                className="px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-500/30 rounded-xl text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remover</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Campos do Perfil */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome de Exibição</label>
                          <input 
                            type="text" 
                            value={session?.name || ''} 
                            onChange={(e) => {
                              const newName = e.target.value;
                              setSession(prev => prev ? { ...prev, name: newName } : null);
                            }}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">E-mail Cadastrado</label>
                          <input 
                            type="email" 
                            disabled 
                            value={session?.email || ''} 
                            className="w-full bg-slate-950/40 border border-slate-800/60 rounded-2xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed font-mono"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">O e-mail principal é vinculado à sua conta autenticada.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nível de Permissão (RBAC)</label>
                          <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium">Função Ativa:</span>
                            <span className="font-bold text-amber-400 uppercase text-[11px]">
                              {session?.role === 'admin' ? 'Acesso Total (Administrador)' : 'Acesso Restrito (Profissional)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        localStorage.setItem('studioroyale_staff_avatar', staffAvatar);
                        if (session?.email) {
                          localStorage.setItem(`studioroyale_user_avatar_${session.email.toLowerCase()}`, staffAvatar);
                        }
                        showSettingsFeedback('Perfil de equipe e foto salvos com sucesso!');
                      }}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Salvar Meu Perfil</span>
                    </button>
                  </div>

                  {/* 2. PERSONALIZAÇÃO DO CHATBOT / CONCIERGE VIP */}
                  <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <Bot className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white">Chatbot & Concierge Virtual</h3>
                            <p className="text-[11px] text-slate-400">Aparência, avatar, mensagem de abertura e status</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          Ativo
                        </span>
                      </div>

                      {/* Foto e Presets do Chatbot */}
                      <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            {chatbotConfig.avatarUrl ? (
                              <img
                                src={chatbotConfig.avatarUrl}
                                alt={chatbotConfig.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 shadow-lg"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-slate-900 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-base">
                                AR
                              </div>
                            )}
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-white block">Foto do Assistente</span>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                              Exibida na bolha flutuante e no cabeçalho das conversas.
                            </p>
                            <label className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 cursor-pointer transition-colors">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Carregar Foto Customizada</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      const newUrl = reader.result as string;
                                      setChatbotConfig(prev => ({ ...prev, avatarUrl: newUrl }));
                                      showSettingsFeedback('Avatar do concierge atualizado!');
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Presets Rápidos de Avatar de Luxo */}
                        <div className="pt-2 border-t border-slate-800/70">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                            Avatares de Luxo Pré-definidos:
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: 'Aura (VIP)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200' },
                              { label: 'Julian (Mestre)', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200' },
                              { label: 'Brasão Royale', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=200' }
                            ].map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => {
                                  setChatbotConfig(prev => ({ ...prev, avatarUrl: preset.url }));
                                  showSettingsFeedback(`Avatar alterado para ${preset.label}!`);
                                }}
                                className={`p-2 rounded-xl border text-[10px] font-medium flex items-center gap-2 transition-all ${
                                  chatbotConfig.avatarUrl === preset.url 
                                    ? 'bg-amber-500/15 border-amber-500 text-amber-300' 
                                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                <img src={preset.url} alt={preset.label} className="w-5 h-5 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                                <span className="truncate">{preset.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Campos do Chatbot */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome do Assistente</label>
                            <input 
                              type="text" 
                              value={chatbotConfig.name} 
                              onChange={(e) => setChatbotConfig(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Ex: Aura Royale"
                              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status Exibido</label>
                            <input 
                              type="text" 
                              value={chatbotConfig.statusText} 
                              onChange={(e) => setChatbotConfig(prev => ({ ...prev, statusText: e.target.value }))}
                              placeholder="Ex: Concierge VIP Online"
                              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mensagem de Boas-Vindas</label>
                          <textarea 
                            rows={3}
                            value={chatbotConfig.welcomeMessage} 
                            onChange={(e) => setChatbotConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                            placeholder="Mensagem exibida ao cliente quando o chat é aberto..."
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors resize-none leading-relaxed"
                          />
                        </div>

                        {/* Live Preview do Balão */}
                        <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-2xl">
                          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block mb-2">
                            Prévia da Saudação ao Cliente:
                          </span>
                          <div className="flex gap-2.5 items-start">
                            <img 
                              src={chatbotConfig.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'} 
                              alt="Avatar" 
                              className="w-6 h-6 rounded-full object-cover border border-amber-500/40 shrink-0 mt-0.5" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="bg-slate-900 border border-slate-800 text-slate-300 text-[11px] p-2.5 rounded-2xl rounded-tl-none leading-relaxed">
                              {chatbotConfig.welcomeMessage}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        localStorage.setItem('studioroyale_chatbot_config', JSON.stringify(chatbotConfig));
                        showSettingsFeedback('Configurações do Chatbot e Concierge salvas com sucesso!');
                      }}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Salvar Configurações do Chatbot</span>
                    </button>
                  </div>
                </div>

                {/* 3. PARÂMETROS GERAIS DA VITRINE STUDIO ROYALE */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Parâmetros Globais do Estabelecimento</h3>
                      <p className="text-[11px] text-slate-400">Dados institucionais da vitrine Studio Royale</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome Oficial da Vitrine</label>
                      <input 
                        type="text" 
                        defaultValue="Studio Royale — Haute Joaillerie & Relojoaria" 
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp para Atendimento VIP</label>
                      <input 
                        type="text" 
                        defaultValue="(11) 99888-7766" 
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">E-mail Administrativo</label>
                      <input 
                        type="text" 
                        disabled 
                        defaultValue={session?.email || 'admin@studioroyale.com.br'} 
                        className="w-full bg-slate-950/40 border border-slate-800/60 rounded-2xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed font-mono" 
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => showSettingsFeedback('Parâmetros institucionais salvos com sucesso!')} 
                    className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-2xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/15"
                  >
                    Salvar Parâmetros Globais
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div 
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 transition-opacity duration-300"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white tracking-tight">
                {editingProductId ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800"
                title="Fechar"
              >
                <X className="w-5 h-5 text-amber-400" />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Título do Produto</label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm({...productForm, title: e.target.value})}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Estoque</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({...productForm, stock: Number(e.target.value)})}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Empresa / Parceiro</label>
                  <select
                    value={productForm.companyName}
                    onChange={(e) => setProductForm({...productForm, companyName: e.target.value})}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                  >
                    <option value="Aurum & Co. Horlogerie">Aurum & Co. Horlogerie</option>
                    <option value="Nordic Living & Design">Nordic Living & Design</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vitrine Vinculada</label>
                  <select
                    value={productForm.showcaseId}
                    onChange={(e) => setProductForm({...productForm, showcaseId: e.target.value})}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                  >
                    {showcases.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Categoria</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                  >
                    <option value="Relógios">Relógios</option>
                    <option value="Móveis">Móveis</option>
                    <option value="Decoração">Decoração</option>
                    <option value="Joias">Joias</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status</label>
                  <select
                    value={productForm.status}
                    onChange={(e) => setProductForm({...productForm, status: e.target.value as 'active' | 'draft'})}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                  >
                    <option value="active">Ativo</option>
                    <option value="draft">Rascunho / Inativo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Imagem</label>
                <select
                  value={productForm.image}
                  onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                >
                  <option value="/src/assets/images/showcase_luxury_watch_1792871178216.jpg">Relógio Suíço</option>
                  <option value="/src/assets/images/showcase_designer_chair_1792871178953.jpg">Poltrona Bouclé</option>
                  <option value="/src/assets/images/showcase_ceramic_vase_1792871178216.jpg">Vaso Cerâmica</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Descrição</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-2xl hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 text-slate-950 font-semibold text-xs rounded-2xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/15"
                >
                  {editingProductId ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Banner */}
      {isBannerModalOpen && (
        <div 
          onClick={() => setIsBannerModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 transition-opacity duration-300"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white tracking-tight">
                {editingBannerId ? 'Editar Banner' : 'Criar Novo Banner'}
              </h3>
              <button 
                onClick={() => setIsBannerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800"
                title="Fechar"
              >
                <X className="w-5 h-5 text-amber-400" />
              </button>
            </div>
            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Título Interno</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({...bannerForm, title: e.target.value})}
                  placeholder="Ex: Destaque Verão 2026"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Imagem do Banner</label>
                <select
                  value={bannerForm.image}
                  onChange={(e) => setBannerForm({...bannerForm, image: e.target.value})}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                >
                  <option value="/src/assets/images/company_banner_watch_1792873304053.jpg">Banner Relojoaria (Aurum)</option>
                  <option value="/src/assets/images/company_banner_furniture_1792873303872.jpg">Banner Móveis (Nordic)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vitrine Relacionada</label>
                  <select
                    value={bannerForm.showcaseId}
                    onChange={(e) => setBannerForm({...bannerForm, showcaseId: e.target.value})}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                  >
                    <option value="home">Página Inicial (Home PWA)</option>
                    {showcases.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ordem de Exibição</label>
                  <input
                    type="number"
                    required
                    value={bannerForm.order}
                    onChange={(e) => setBannerForm({...bannerForm, order: Number(e.target.value)})}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Link de Destino</label>
                <input
                  type="text"
                  value={bannerForm.link}
                  onChange={(e) => setBannerForm({...bannerForm, link: e.target.value})}
                  placeholder="Ex: # ou URL"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status</label>
                <select
                  value={bannerForm.status}
                  onChange={(e) => setBannerForm({...bannerForm, status: e.target.value as 'active' | 'draft'})}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                >
                  <option value="active">Ativo (Exibir no Carrossel)</option>
                  <option value="draft">Rascunho / Oculto</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-2xl hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 text-slate-950 font-semibold text-xs rounded-2xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/15"
                >
                  {editingBannerId ? 'Salvar Alterações' : 'Criar Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE SOLICITAÇÃO DE PEDIDO */}
        {orderConfirmationModal && (
          <div 
            onClick={() => setOrderConfirmationModal(null)}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setOrderConfirmationModal(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                title="Fechar"
              >
                <X className="w-5 h-5 text-amber-400" />
              </button>

              <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    Solicitação Registrada
                  </span>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    Pedido Enviado para Análise do Salão
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Código: <span className="font-mono font-bold text-white">{orderConfirmationModal.id}</span>
                  </p>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 text-xs text-amber-300 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-400">
                  <AlertCircle className="w-4 h-4 shrink-0" /> Status: Aguardando Análise do Salão
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Sua solicitação foi registrada com sucesso e a sacola de compras foi limpa. Nenhuma transação financeira simulada ou cobrança automática foi realizada. A equipe do salão analisará a disponibilidade e orçamento.
                </p>
              </div>

              {/* Product Items Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Itens da Solicitação</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {orderConfirmationModal.details?.map((detail, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                      {detail.image && (
                        <img src={detail.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-900 shrink-0" referrerPolicy="no-referrer" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-white text-xs truncate">{detail.title}</h5>
                        <p className="text-[11px] text-slate-400">Qtd: <span className="text-white font-mono font-semibold">{detail.quantity}</span> | R$ {detail.price.toFixed(2)} cada</p>
                      </div>
                      <div className="text-xs font-mono font-bold text-amber-400 shrink-0">
                        R$ {(detail.quantity * detail.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-400">Valor Total Estimado:</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">R$ {orderConfirmationModal.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => {
                    setOrderConfirmationModal(null);
                    setViewMode('profile');
                    setProfileTab('orders');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Clock className="w-4 h-4" /> Ver Histórico de Pedidos
                </button>
                
                <button
                  onClick={() => setOrderConfirmationModal(null)}
                  className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-2xl transition-all border border-slate-700 cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
        {renderChatDrawer()}
      </div>
    );
  }
