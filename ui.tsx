import {
  Activity,
  ArrowRight,
  Bell,
  Briefcase,
  Calendar,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Globe,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Menu,
  Moon,
  Plus,
  Scissors,
  Search,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  User,
  Users,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

// 1. The Geometric Logo Component
const AppLogo = ({ width = 120, height = 120, className = "", color = "#d5821d" }) => (
  <svg 
    version="1.2" 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 235 287" 
    width={width} 
    height={height}
    className={className}
    preserveAspectRatio="xMidYMid meet"
  >
    <g>
      <path 
        fill={color} 
        d="m127.1-0.03l-106.23 106.22c-27 27-26.99 70.77 0 97.76l1.9 1.9c13.08 13.08 34.27 13.08 47.35 0l46.41-46.41-1.9-1.9c-13.07-13.07-34.27-13.07-47.34 0l59.81-59.81c26.99-27 26.99-70.77 0-97.76z"
      />
      <path 
        fill="#9a3412" 
        d="m209.82 82.38l-1.9-1.9c-13.07-13.08-34.27-13.08-47.34 0l-47.69 47.68 1.9 1.9c13.08 13.08 34.27 13.08 47.35 0l-58.54 58.54c-27 27-27 70.77 0 97.76l106.22-106.22c27-27 27-70.77 0-97.76z"
      />
    </g>
  </svg>
);

// 2. Salozy Style Splash Screen
const SalozySplash = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] transition-opacity duration-700">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-[#050505]"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative flex items-center justify-center w-40 h-40 mb-8">
          <div className="absolute inset-0 rounded-full border border-dashed border-[#d5821d]/30 animate-spin-slow w-full h-full"></div>
          <div className="absolute inset-2 rounded-full border border-dashed border-[#d5821d]/20 animate-spin-reverse-slow w-[90%] h-[90%] m-auto left-0 right-0 top-0 bottom-0"></div>
          
          <div className="animate-fade-in-up">
            <AppLogo width={70} height={85} />
          </div>
        </div>

        <h1 className="text-4xl text-white animate-fade-in mb-2" style={{ fontFamily: "'Aclonica', sans-serif" }}>
          SALOZY
        </h1>
        
        <div className="flex items-center gap-3 animate-fade-in delay-200 opacity-0 fill-mode-forwards">
          <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#9a3412]"></div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-sans">
            Salon Manager
          </p>
          <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#9a3412]"></div>
        </div>
      </div>

      <div className="absolute bottom-16 flex gap-2">
        <div className="w-2 h-2 bg-[#d5821d] rounded-full animate-bounce delay-0"></div>
        <div className="w-2 h-2 bg-[#d5821d] rounded-full animate-bounce delay-150"></div>
        <div className="w-2 h-2 bg-[#d5821d] rounded-full animate-bounce delay-300"></div>
      </div>
    </div>
  );
};

// 3. Onboarding Slider Component
const OnboardingSlider = ({ onFinish }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "Manage Appointments Effortlessly",
      desc: "Streamline your booking process. Reduce no-shows with automated reminders and smart scheduling.",
      icon: Calendar,
    },
    {
      id: 2,
      title: "Track Revenue Growth",
      desc: "Monitor your daily earnings and growth with detailed analytics and performance reports.",
      icon: TrendingUp,
    },
    {
      id: 3,
      title: "Client Management",
      desc: "Keep detailed records of client preferences, history, and retention statistics in one place.",
      icon: Users,
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(curr => curr + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-stone-900 flex flex-col animate-fade-in">
      <div className="absolute top-0 left-0 w-full h-[65%] z-0">
        <img 
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop" 
          alt="Salon Interior" 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent"></div>
      </div>

      <div className="absolute top-14 left-0 right-0 flex justify-center z-10">
        <div className="px-5 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/10">
          <span className="text-white text-[10px] font-bold tracking-widest uppercase">Salozy</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] pt-12 pb-8 px-8 flex flex-col items-center z-20 h-[50%] shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <div className="mb-6 p-4 bg-orange-50 rounded-2xl animate-fade-in-up">
           {React.createElement(slides[currentSlide].icon, { 
             size: 32, 
             strokeWidth: 1.5,
             className: "text-[#d5821d]" 
           })}
        </div>
        
        <div className="text-center mb-auto">
          <h2 className="text-2xl font-bold text-[#0f172a] mb-4 leading-tight animate-fade-in-up delay-100" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {slides[currentSlide].title}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed px-2 animate-fade-in-up delay-200">
            {slides[currentSlide].desc}
          </p>
        </div>

        <div className="w-full flex items-center justify-between mt-6">
          <button 
            onClick={onFinish} 
            className="text-gray-400 font-medium text-sm hover:text-[#9a3412] transition-colors w-12 text-left"
          >
            Skip
          </button>

          <div className="flex space-x-2">
            {slides.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? 'w-6 bg-[#9a3412]' : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className="bg-gradient-to-r from-[#9a3412] to-[#d5821d] text-white w-14 h-14 rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-orange-900/30 transition-all transform active:scale-95"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. Login Screen
const LoginScreen = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="absolute inset-0 bg-stone-50 z-30 flex flex-col animate-fade-in">
      <div className="flex-1 px-8 flex flex-col justify-center">
        <div className="flex flex-col items-center mb-10">
           <AppLogo width={64} height={75} />
           <h2 className="text-2xl font-bold text-stone-900 mt-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Welcome Back</h2>
           <p className="text-stone-500 text-sm mt-2 text-center">Please sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-600 ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#d5821d] transition-colors">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@salozy.com"
                className="w-full bg-white border border-stone-200 rounded-xl py-3.5 pl-11 pr-4 text-sm text-stone-800 focus:outline-none focus:border-[#d5821d] focus:ring-1 focus:ring-[#d5821d] transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-600 ml-1">Password</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#d5821d] transition-colors">
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-stone-200 rounded-xl py-3.5 pl-11 pr-11 text-sm text-stone-800 focus:outline-none focus:border-[#d5821d] focus:ring-1 focus:ring-[#d5821d] transition-all shadow-sm"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="relative flex items-center">
                <input type="checkbox" className="peer w-4 h-4 rounded border-stone-300 text-[#d5821d] focus:ring-[#d5821d]" />
                <div className="w-4 h-4 border border-stone-300 rounded bg-white peer-checked:bg-[#d5821d] peer-checked:border-[#d5821d] absolute pointer-events-none flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 transition-opacity">
                   <CheckCircle size={10} />
                </div>
              </div>
              <span className="text-xs text-stone-500 font-medium">Remember me</span>
            </label>
            <button type="button" className="text-xs font-semibold text-[#9a3412] hover:text-[#d5821d] transition-colors">
              Forgot Password?
            </button>
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-[#9a3412] to-[#d5821d] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-900/20 hover:shadow-orange-900/30 active:scale-[0.98] transition-all mt-4"
          >
            LOGIN
          </button>
        </form>
      </div>

      <div className="py-8 text-center">
        <p className="text-xs text-stone-500">
          Don't have an account? <button className="text-[#9a3412] font-bold ml-1 hover:underline">Sign Up</button>
        </p>
      </div>
    </div>
  );
};

// 5. Sidebar Component
const Sidebar = ({ isOpen, onClose, onLogout, currentTab, onNavigate }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: "Dashboard" },
    { id: 'calendar', icon: Calendar, label: "Appointments" },
    { id: 'clients', icon: Users, label: "Clients" },
    { id: 'services', icon: Scissors, label: "Services" },
    { id: 'staff', icon: Briefcase, label: "Staff Management" },
    { id: 'finances', icon: DollarSign, label: "Finances" },
    { id: 'settings', icon: Settings, label: "Settings" },
    { id: 'support', icon: HelpCircle, label: "Support" },
  ];

  const handleNav = (id) => {
    onNavigate(id);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`absolute top-0 left-0 bottom-0 w-[80%] max-w-[300px] bg-white z-50 shadow-2xl transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AppLogo width={100} height={120} color="white" />
            </div>
            
            <button onClick={onClose} className="absolute top-4 right-4 p-1 text-white/50 hover:text-white transition-colors">
              <X size={20} />
            </button>

            <div className="relative z-10 flex items-center gap-4 mt-4">
              <div className="w-14 h-14 rounded-full border-2 border-[#d5821d] p-0.5">
                 <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" className="w-full h-full rounded-full object-cover" alt="Profile" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>Alex Morgan</h3>
                <p className="text-xs text-[#d5821d] font-medium">Master Stylist</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    currentTab === item.id 
                      ? 'bg-orange-50 text-[#9a3412]' 
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <item.icon size={20} strokeWidth={currentTab === item.id ? 2.5 : 2} />
                  <span className={`text-sm font-medium ${currentTab === item.id ? 'font-bold' : ''}`}>{item.label}</span>
                  {currentTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#9a3412]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-stone-100">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm"
            >
              <LogOut size={20} />
              Log Out
            </button>
            <p className="text-center text-[10px] text-stone-300 mt-4">Salozy App v1.2.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

// 6. Notification Drawer
const NotificationDrawer = ({ isOpen, onClose }) => {
  const notifications = [
    {
      id: 1,
      title: "New Booking Request",
      desc: "Sarah Miller requested a Haircut at 3:00 PM tomorrow.",
      time: "2m ago",
      icon: Calendar,
      bg: "bg-blue-50",
      color: "text-blue-600",
      unread: true
    },
    {
      id: 2,
      title: "Payment Received",
      desc: "Payment of $85.00 received from John Doe.",
      time: "1h ago",
      icon: CheckCircle,
      bg: "bg-green-50",
      color: "text-green-600",
      unread: true
    },
    {
      id: 3,
      title: "Inventory Alert",
      desc: "Shampoo stock is running low (below 10 units).",
      time: "3h ago",
      icon: Layers,
      bg: "bg-orange-50",
      color: "text-orange-600",
      unread: false
    },
    {
      id: 4,
      title: "Staff Meeting",
      desc: "Weekly staff meeting starts in 30 minutes.",
      time: "5h ago",
      icon: Users,
      bg: "bg-purple-50",
      color: "text-purple-600",
      unread: false
    }
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`absolute top-0 right-0 bottom-0 w-[85%] max-w-[320px] bg-white z-50 shadow-2xl transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <h3 className="font-bold text-lg text-stone-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Notifications</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#9a3412] bg-orange-50 px-2 py-1 rounded-md">2 New</span>
              <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {notifications.map((notif) => (
              <div key={notif.id} className={`flex gap-3 p-3 rounded-xl transition-colors ${notif.unread ? 'bg-stone-50 border border-stone-100' : 'bg-white'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notif.bg} ${notif.color}`}>
                  <notif.icon size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm ${notif.unread ? 'font-bold text-stone-900' : 'font-medium text-stone-600'}`}>{notif.title}</h4>
                    <span className="text-[10px] text-stone-400">{notif.time}</span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed">{notif.desc}</p>
                </div>
                {notif.unread && (
                  <div className="w-2 h-2 rounded-full bg-[#d5821d] mt-1.5 flex-shrink-0"></div>
                )}
              </div>
            ))}
            
            <div className="pt-4 text-center">
              <button className="text-xs font-semibold text-stone-400 hover:text-stone-600 transition-colors">
                View Earlier Notifications
              </button>
            </div>
          </div>
          
          {/* Footer Actions */}
          <div className="p-4 border-t border-stone-100">
            <button className="w-full py-3 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors shadow-lg shadow-stone-200">
              Mark all as read
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// 7.1 New Appointment Screen (Dedicated)
const NewAppointmentScreen = ({ onBack }) => {
  const services = [
    { id: 1, name: "Haircut & Style", time: "1h", price: "$65", icon: Scissors },
    { id: 2, name: "Beard Trim", time: "30m", price: "$35", icon: Scissors },
    { id: 3, name: "Color Treatment", time: "2h", price: "$120", icon: Sparkles },
    { id: 4, name: "Manicure", time: "45m", price: "$45", icon: Sparkles },
    { id: 5, name: "Facial", time: "1h", price: "$80", icon: Sparkles },
    { id: 6, name: "Massage", time: "1h", price: "$90", icon: User }
  ];

  const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "01:00", "01:30"];
  const quickClients = [
    { name: "Sarah", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" },
    { name: "Mike", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop" },
    { name: "Emma", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop" },
    { name: "John", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop" },
  ];

  const [selectedService, setSelectedService] = useState(null);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedClient, setSelectedClient] = useState(null);

  return (
    <div className="flex flex-col h-full bg-stone-50 animate-fade-in relative">
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        
        {/* Section: Client */}
        <div className="px-6 pt-6 pb-2">
           <h3 className="text-sm font-bold text-stone-900 mb-3 ml-1">Client Details</h3>
           <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 mb-4">
              <div className="relative group mb-4">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                  <Search size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Search client..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-11 pr-4 text-sm text-stone-800 focus:outline-none focus:border-[#d5821d] focus:ring-1 focus:ring-[#d5821d] transition-all"
                />
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                 <button className="flex flex-col items-center gap-2 min-w-[60px]">
                    <div className="w-12 h-12 rounded-full bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 hover:border-[#d5821d] hover:text-[#d5821d] transition-colors">
                       <Plus size={20} />
                    </div>
                    <span className="text-[10px] font-medium text-stone-500">New</span>
                 </button>
                 {quickClients.map((c, i) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedClient(c.name)}
                      className={`flex flex-col items-center gap-2 min-w-[60px] transition-all ${selectedClient === c.name ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}`}
                    >
                       <div className={`w-12 h-12 rounded-full p-0.5 border-2 ${selectedClient === c.name ? 'border-[#d5821d]' : 'border-transparent'}`}>
                          <img src={c.img} className="w-full h-full rounded-full object-cover" alt={c.name} />
                       </div>
                       <span className={`text-[10px] font-medium ${selectedClient === c.name ? 'text-[#d5821d] font-bold' : 'text-stone-500'}`}>{c.name}</span>
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Section: Service */}
        <div className="px-6 py-2">
           <h3 className="text-sm font-bold text-stone-900 mb-3 ml-1">Select Service</h3>
           <div className="grid grid-cols-2 gap-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                    selectedService === service.id 
                      ? 'bg-gradient-to-br from-[#d5821d] to-[#9a3412] border-[#d5821d] shadow-lg shadow-orange-900/20 text-white' 
                      : 'bg-white border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className={`p-2 rounded-lg ${selectedService === service.id ? 'bg-white/20' : 'bg-stone-100'}`}>
                       <service.icon size={18} className={selectedService === service.id ? 'text-white' : 'text-stone-500'} />
                    </div>
                    {selectedService === service.id && <CheckCircle size={18} className="text-white" />}
                  </div>
                  <div className="font-bold text-sm mb-0.5">{service.name}</div>
                  <div className={`text-xs ${selectedService === service.id ? 'text-orange-100' : 'text-stone-400'}`}>
                    {service.time} • {service.price}
                  </div>
                </button>
              ))}
           </div>
        </div>

        {/* Section: Date & Time */}
        <div className="px-6 py-2">
           <h3 className="text-sm font-bold text-stone-900 mb-3 ml-1">Date & Time</h3>
           <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 mb-2">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-[#d5821d]" />
                    <span className="text-sm font-bold text-stone-800">Oct 13, 2023</span>
                 </div>
                 <button className="text-xs font-bold text-[#d5821d] hover:underline">Change</button>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                 {timeSlots.map((time, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all ${
                        selectedTime === time
                          ? 'bg-stone-800 text-white border-stone-800 shadow-md'
                          : 'bg-stone-50 text-stone-500 border-transparent hover:border-stone-200'
                      }`}
                    >
                      {time}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Section: Notes */}
        <div className="px-6 py-2">
           <h3 className="text-sm font-bold text-stone-900 mb-3 ml-1">Additional Notes</h3>
           <textarea 
             rows="3"
             placeholder="Any special requests?"
             className="w-full bg-white border border-stone-200 rounded-2xl p-4 text-sm text-stone-800 focus:outline-none focus:border-[#d5821d] focus:ring-1 focus:ring-[#d5821d] transition-all shadow-sm resize-none"
           ></textarea>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-stone-100 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-4 px-2">
           <div>
             <p className="text-xs text-stone-400 font-medium">Total Amount</p>
             <p className="text-xl font-bold text-stone-900">$100.00</p>
           </div>
           <div className="text-right">
             <p className="text-xs text-stone-400 font-medium">Duration</p>
             <p className="text-sm font-bold text-stone-900">1h 30m</p>
           </div>
        </div>
        <button 
          onClick={onBack}
          className="w-full bg-[#9a3412] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-900/20 hover:bg-[#802a0e] transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Confirm Booking <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

// 7. Schedule View Component (Design Improved)
const ScheduleView = ({ onCreateAppointment }) => {
  const [selectedDate, setSelectedDate] = useState(13);

  // Mock dates for the strip (current week)
  const dates = [
    { day: 'Mon', date: 12, fullDate: '2023-10-12' },
    { day: 'Tue', date: 13, fullDate: '2023-10-13' },
    { day: 'Wed', date: 14, fullDate: '2023-10-14' },
    { day: 'Thu', date: 15, fullDate: '2023-10-15' },
    { day: 'Fri', date: 16, fullDate: '2023-10-16' },
    { day: 'Sat', date: 17, fullDate: '2023-10-17' },
    { day: 'Sun', date: 18, fullDate: '2023-10-18' },
  ];

  // Mock appointments
  const appointments = [
    { id: 1, time: '09:00 AM', endTime: '10:00 AM', client: 'Sarah Miller', service: 'Haircut & Style', duration: '1h', price: '$65', status: 'Confirmed', color: 'bg-purple-50 border-purple-100', accent: 'text-purple-600', iconBg: 'bg-purple-100' },
    { id: 2, time: '10:30 AM', endTime: '11:00 AM', client: 'Mike Ross', service: 'Beard Trim', duration: '30m', price: '$35', status: 'Pending', color: 'bg-blue-50 border-blue-100', accent: 'text-blue-600', iconBg: 'bg-blue-100' },
    { id: 3, time: '01:00 PM', endTime: '03:00 PM', client: 'Emma Watson', service: 'Color & Highlights', duration: '2h', price: '$150', status: 'Confirmed', color: 'bg-pink-50 border-pink-100', accent: 'text-pink-600', iconBg: 'bg-pink-100' },
    { id: 4, time: '04:00 PM', endTime: '04:45 PM', client: 'John Doe', service: 'Manicure', duration: '45m', price: '$45', status: 'Confirmed', color: 'bg-orange-50 border-orange-100', accent: 'text-orange-600', iconBg: 'bg-orange-100' },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in-up relative">
      
      {/* Date Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg font-bold text-stone-800">October 2023</h2>
        <div className="flex gap-2">
           <button className="p-1.5 rounded-full bg-white border border-stone-200 text-stone-400 hover:text-stone-600">
             <ChevronRight size={16} className="rotate-180" />
           </button>
           <button className="p-1.5 rounded-full bg-white border border-stone-200 text-stone-400 hover:text-stone-600">
             <ChevronRight size={16} />
           </button>
        </div>
      </div>

      {/* Date Strip */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
        {dates.map((item, index) => (
          <button 
            key={index}
            onClick={() => setSelectedDate(item.date)}
            className={`flex flex-col items-center justify-center min-w-[60px] h-[80px] rounded-2xl transition-all flex-shrink-0 border ${
              selectedDate === item.date 
                ? 'bg-[#9a3412] text-white shadow-lg shadow-orange-900/20 border-[#9a3412] transform scale-105' 
                : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'
            }`}
          >
            <span className={`text-xs font-medium mb-1 ${selectedDate === item.date ? 'text-orange-100' : 'text-stone-400'}`}>{item.day}</span>
            <span className={`text-xl font-bold ${selectedDate === item.date ? 'text-white' : 'text-stone-800'}`}>{item.date}</span>
            {selectedDate === item.date && <div className="w-1.5 h-1.5 bg-white rounded-full mt-1.5"></div>}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto -mx-5 px-5 pb-24 scrollbar-hide">
        <div className="relative space-y-6 pt-2">
          {/* Continuous Line */}
          <div className="absolute left-[59px] top-4 bottom-0 w-[2px] bg-stone-100"></div>

          {appointments.map((apt) => (
            <div key={apt.id} className="relative flex group">
               {/* Time Column */}
               <div className="flex flex-col items-end w-[48px] mr-6 pt-1">
                  <span className="text-xs font-bold text-stone-800">{apt.time}</span>
                  <span className="text-[10px] text-stone-400">{apt.endTime}</span>
               </div>
               
               {/* Dot on Line */}
               <div className={`absolute left-[55px] top-3 w-2.5 h-2.5 rounded-full border-2 border-white ring-1 ring-stone-200 ${apt.accent.replace('text', 'bg')} z-10`}></div>

               {/* Card */}
               <div className={`flex-1 p-4 rounded-2xl border ${apt.color} ${apt.iconBg} bg-opacity-30 relative hover:shadow-md transition-all active:scale-[0.99]`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center text-sm font-bold shadow-sm ${apt.accent}`}>
                          {apt.client.charAt(0)}
                       </div>
                       <div>
                          <h4 className="font-bold text-sm text-stone-900 leading-tight">{apt.client}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} font-medium`}>
                            {apt.status}
                          </span>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="font-bold text-stone-900 block">{apt.price}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-stone-600 bg-white/60 p-2 rounded-xl backdrop-blur-sm">
                     <Scissors size={14} className={apt.accent} />
                     <span className="font-medium truncate">{apt.service}</span>
                     <span className="mx-1 text-stone-300">|</span>
                     <Clock size={14} className={apt.accent} />
                     <span>{apt.duration}</span>
                  </div>
               </div>
            </div>
          ))}

          {/* Empty Slot */}
          <div className="relative flex items-center">
             <div className="w-[48px] mr-6 text-right">
                <span className="text-xs font-medium text-stone-400">02:00 PM</span>
             </div>
             <div className="absolute left-[55px] w-2.5 h-2.5 rounded-full bg-stone-200 border-2 border-white z-10"></div>
             <div 
               onClick={onCreateAppointment}
               className="flex-1 h-16 rounded-2xl border-2 border-dashed border-stone-100 flex items-center px-4 hover:border-[#d5821d]/50 hover:bg-orange-50/50 transition-colors cursor-pointer group"
             >
                <Plus size={20} className="text-stone-300 group-hover:text-[#d5821d]" />
                <span className="ml-2 text-sm text-stone-400 font-medium group-hover:text-[#d5821d]">Add Appointment</span>
             </div>
          </div>
        </div>
      </div>
      
       {/* Floating Action Button */}
       <div className="absolute bottom-6 right-0 z-20">
         <button 
           onClick={onCreateAppointment}
           className="w-14 h-14 bg-[#9a3412] text-white rounded-full shadow-[0_8px_30px_rgba(154,52,18,0.3)] flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
         >
            <Plus size={24} strokeWidth={3} />
         </button>
       </div>
    </div>
  );
};

// 8. Settings View Component
const SettingsView = () => {
  const SettingItem = ({ icon: Icon, label, value, type = "arrow", color = "text-stone-600" }) => (
    <button className="w-full flex items-center justify-between p-3 bg-white hover:bg-stone-50 rounded-xl transition-colors border border-transparent hover:border-stone-100">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-stone-500">
          <Icon size={18} />
        </div>
        <span className={`text-sm font-medium ${color}`}>{label}</span>
      </div>
      
      {type === "arrow" && (
        <div className="flex items-center gap-2">
          {value && <span className="text-xs text-stone-400">{value}</span>}
          <ChevronRight size={16} className="text-stone-300" />
        </div>
      )}
      
      {type === "toggle" && (
        <div className={`w-10 h-5 rounded-full relative transition-colors ${value ? 'bg-[#9a3412]' : 'bg-stone-200'}`}>
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${value ? 'left-6' : 'left-1'}`}></div>
        </div>
      )}
    </button>
  );

  return (
    <div className="space-y-6 pt-2 animate-fade-in-up">
      {/* Profile Card */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full border-2 border-stone-100 p-0.5">
           <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" className="w-full h-full rounded-full object-cover" alt="Profile" />
        </div>
        <div className="flex-1">
           <h3 className="font-bold text-stone-900 text-lg">Alex Morgan</h3>
           <p className="text-xs text-stone-500">alex.morgan@salozy.com</p>
        </div>
        <button className="p-2 text-[#d5821d] font-medium text-xs hover:bg-orange-50 rounded-lg transition-colors">
          Edit
        </button>
      </div>

      {/* Account Settings */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Account</h4>
        <div className="bg-white rounded-2xl border border-stone-100 p-1">
          <SettingItem icon={User} label="Personal Information" />
          <SettingItem icon={CreditCard} label="Payment Methods" />
          <SettingItem icon={Shield} label="Security & Login" />
        </div>
      </div>

      {/* App Settings */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Preferences</h4>
        <div className="bg-white rounded-2xl border border-stone-100 p-1">
          <SettingItem icon={Bell} label="Push Notifications" type="toggle" value={true} />
          <SettingItem icon={Moon} label="Dark Mode" type="toggle" value={false} />
          <SettingItem icon={Globe} label="Language" value="English (US)" />
        </div>
      </div>

      {/* Support */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Support</h4>
        <div className="bg-white rounded-2xl border border-stone-100 p-1">
          <SettingItem icon={HelpCircle} label="Help Center" />
          <SettingItem icon={FileText} label="Privacy Policy" />
        </div>
      </div>

      {/* Danger Zone */}
      <button className="w-full py-3 text-red-500 font-medium text-sm bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-center gap-2">
        <LogOut size={18} />
        Sign Out
      </button>
      
      <p className="text-center text-[10px] text-stone-300 pb-4">Version 1.2.0 (Build 204)</p>
    </div>
  );
};

// 9. Navigation Icon Helper Component
const NavIcon = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 min-w-[50px] transition-colors">
    <Icon size={22} className={active ? 'text-[#9a3412]' : 'text-stone-400'} strokeWidth={active ? 2.5 : 2} />
    <span className={`text-[10px] font-medium ${active ? 'text-[#9a3412]' : 'text-stone-400'}`}>{label}</span>
  </button>
);

// 10. Main Dashboard (Updated with State Management)
const Dashboard = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showBooking, setShowBooking] = useState(false);

  return (
    <div className="flex flex-col h-full bg-stone-50 animate-fade-in relative overflow-hidden">
      
      {/* Sidebar & Notification Drawers */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onLogout={onLogout}
        currentTab={activeTab}
        onNavigate={setActiveTab}
      />
      <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Header */}
      <header className="px-6 pt-12 pb-6 bg-white sticky top-0 z-20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-b-[32px] mb-2">
        <div className="flex justify-between items-center mb-6">
          {showBooking ? (
            <button 
              onClick={() => setShowBooking(false)}
              className="w-10 h-10 flex items-center justify-center bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-full transition-all active:scale-95"
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>
          ) : (
            <button 
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-full transition-all active:scale-95"
            >
              <Menu size={20} strokeWidth={2} />
            </button>
          )}

          <div className="flex items-center gap-3">
             <div className="px-3 py-1.5 bg-orange-50 rounded-full border border-orange-100 hidden sm:flex">
                <span className="text-[10px] font-bold text-[#9a3412] uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d5821d] animate-pulse"></span>
                  Open
                </span>
             </div>
             <button 
              onClick={() => setNotifOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-full transition-all relative active:scale-95"
            >
              <Bell size={20} strokeWidth={2} />
              <span className="absolute top-2.5 right-3 w-2 h-2 bg-[#9a3412] rounded-full border-2 border-white"></span>
            </button>
          </div>
        </div>

        <div className="animate-fade-in-up">
           <p className="text-stone-500 text-sm font-medium mb-1">
             {showBooking ? 'New Entry' :
              activeTab === 'dashboard' ? 'Good Morning,' : 
              activeTab === 'settings' ? 'Preferences' :
              activeTab === 'calendar' ? 'Your Schedule' : 
              'Overview'}
           </p>
           <h1 className="text-3xl font-bold text-stone-900 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
             {showBooking ? 'New Appointment' :
              activeTab === 'dashboard' ? 'Alex Morgan' : 
              activeTab === 'settings' ? 'Settings' :
              activeTab === 'calendar' ? 'Appointments' :
              activeTab === 'clients' ? 'Client List' :
              activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
           </h1>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide pt-2">
        {showBooking ? (
          <NewAppointmentScreen onBack={() => setShowBooking(false)} />
        ) : (
          <>
            {activeTab === 'settings' ? (
              <SettingsView />
            ) : activeTab === 'calendar' ? (
              <ScheduleView onCreateAppointment={() => setShowBooking(true)} />
            ) : activeTab === 'dashboard' ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Users size={18} className="text-[#9a3412]" />
                      </div>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+12%</span>
                    </div>
                    <p className="text-stone-500 text-xs font-medium">Total Clients</p>
                    <h3 className="text-2xl font-bold text-stone-900 mt-1" style={{ fontFamily: "'Poppins', sans-serif" }}>1,234</h3>
                  </div>

                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Activity size={18} className="text-[#d5821d]" />
                      </div>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+5%</span>
                    </div>
                    <p className="text-stone-500 text-xs font-medium">Revenue</p>
                    <h3 className="text-2xl font-bold text-stone-900 mt-1" style={{ fontFamily: "'Poppins', sans-serif" }}>$8.4k</h3>
                  </div>
                </div>

                {/* Main Chart Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-stone-800 text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>Performance</h3>
                    <button className="text-xs text-[#9a3412] font-semibold bg-orange-50 px-3 py-1 rounded-full">Weekly</button>
                  </div>
                  
                  <div className="h-32 flex items-end justify-between px-2 gap-2">
                    {[40, 70, 45, 90, 65, 85, 55].map((h, i) => (
                      <div key={i} className="w-full bg-stone-100 rounded-t-lg relative group">
                        <div 
                          className="absolute bottom-0 w-full bg-gradient-to-t from-[#9a3412] to-[#d5821d] rounded-t-lg transition-all duration-1000"
                          style={{ height: `${h}%` }}
                        ></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 text-xs text-stone-400 font-medium px-1">
                    <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                  </div>
                </div>

                {/* Recent List */}
                <div>
                  <h3 className="font-bold text-stone-800 mb-4 px-1 text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>Today's Schedule</h3>
                  <div className="space-y-3">
                    {[
                      { time: "09:00 AM", client: "Sarah Miller", type: "Haircut & Style" },
                      { time: "10:30 AM", client: "John Doe", type: "Beard Trim" },
                      { time: "01:00 PM", client: "Emma Wilson", type: "Color Treatment" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center p-3 bg-white rounded-xl shadow-sm border border-stone-100">
                        <div className="flex-shrink-0 w-12 text-center">
                           <p className="text-xs font-bold text-stone-900">{item.time.split(' ')[0]}</p>
                           <p className="text-[10px] text-stone-400">{item.time.split(' ')[1]}</p>
                        </div>
                        <div className="w-[1px] h-8 bg-stone-100 mx-3"></div>
                        <div>
                          <h4 className="text-sm font-bold text-stone-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{item.client}</h4>
                          <p className="text-xs text-[#d5821d]">{item.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-stone-300 mb-4">
                   {activeTab === 'clients' ? <Users size={40} /> :
                    <Briefcase size={40} />}
                </div>
                <h3 className="text-lg font-bold text-stone-800 mb-2">Work in Progress</h3>
                <p className="text-stone-500 text-sm max-w-[200px]">The {activeTab} section is currently being developed.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-stone-200 px-6 py-3 pb-8 relative z-0">
        <div className="flex justify-between items-center">
          <NavIcon 
            icon={LayoutDashboard} 
            label="Home" 
            active={!showBooking && activeTab === 'dashboard'} 
            onClick={() => { setShowBooking(false); setActiveTab('dashboard'); }} 
          />
          <NavIcon 
            icon={Calendar} 
            label="Schedule" 
            active={!showBooking && activeTab === 'calendar'}
            onClick={() => { setShowBooking(false); setActiveTab('calendar'); }}
          />
          <div className="w-12 h-12 bg-gradient-to-br from-[#d5821d] to-[#9a3412] rounded-full flex items-center justify-center -mt-8 shadow-lg shadow-orange-900/20 border-4 border-stone-50 z-10">
             <AppLogo width={20} height={20} color="white" /> 
          </div>
          <NavIcon 
            icon={Users} 
            label="Clients" 
            active={!showBooking && activeTab === 'clients'} 
            onClick={() => { setShowBooking(false); setActiveTab('clients'); }}
          />
          <NavIcon 
            icon={Settings} 
            label="Settings" 
            active={!showBooking && activeTab === 'settings'} 
            onClick={() => { setShowBooking(false); setActiveTab('settings'); }}
          />
        </div>
      </nav>
    </div>
  );
};

// 11. Simulator Root
export default function App() {
  const [viewState, setViewState] = useState('splash');

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Aclonica&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse-slow {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        .animate-spin-reverse-slow { animation: spin-reverse-slow 9s linear infinite; }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 1s ease-out forwards; }
        .delay-200 { animation-delay: 200ms; }
        .fill-mode-forwards { animation-fill-mode: forwards; }
        
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="relative w-full max-w-[375px] h-[812px] bg-white rounded-[40px] shadow-2xl overflow-hidden ring-8 ring-[#1a1a1a]">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-black rounded-b-2xl z-50"></div>
        
        {viewState === 'splash' && (
          <SalozySplash onFinish={() => setViewState('onboarding')} />
        )}
        
        {viewState === 'onboarding' && (
          <OnboardingSlider onFinish={() => setViewState('login')} />
        )}

        {viewState === 'login' && (
          <LoginScreen onLogin={() => setViewState('dashboard')} />
        )}
        
        {viewState === 'dashboard' && (
          <Dashboard onLogout={() => setViewState('login')} />
        )}

        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-stone-300 rounded-full z-50 mix-blend-difference"></div>
      </div>
    </div>
  );
}