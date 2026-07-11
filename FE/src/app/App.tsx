import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  LayoutDashboard, Users, BookOpen, BarChart3, Settings,
  Bell, Search, Plus, Edit, Trash2, Play, CheckCircle2,
  Star, Award, TrendingUp, DollarSign, FileText,
  Eye, EyeOff, ArrowUpRight, Download, Shield, Brain,
  Repeat, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Package, Sparkles, Check, AlertCircle, Globe, Upload,
  RefreshCw, ListChecks, Film, PenTool, Filter,
  HelpCircle, Layers, MessageSquare, Target, Zap,
  Lock, Mail, User as UserIcon, ArrowLeft, GraduationCap,
  Briefcase, BookMarked, UserCog, LogOut, X, Calendar,
  Link as LinkIcon, FileUp, MoreHorizontal
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

// ───────────────────── TYPES ─────────────────────
type Role = "guest" | "student" | "teacher" | "sme" | "manager" | "admin";
type AuthUser = { fullName?: string; email?: string; avatarUrl?: string; role?: { name?: string } };
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

function getYoutubeEmbedUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    let videoId = url.hostname.includes("youtu.be") ? url.pathname.split("/").filter(Boolean)[0] : url.searchParams.get("v");
    if (!videoId && (url.pathname.includes("/shorts/") || url.pathname.includes("/embed/"))) videoId = url.pathname.split("/").filter(Boolean).pop() ?? null;
    return videoId ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` : null;
  } catch { return null; }
}

function normalizeLessonMarkdown(value?: string): string {
  return (value || "")
    .replace(/\s+(#{1,6})\s+/g, "\n\n$1 ")
    .replace(/\s+-\s+(?=[A-ZÀ-Ỹ0-9*])/g, "\n- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getAuthenticatedRole(user: any): Role {
  const role = String(user?.role?.name ?? user?.role ?? "").toLowerCase();
  if (["student", "teacher", "sme", "manager", "admin"].includes(role)) return role as Role;
  throw new Error("Tài khoản chưa được phân quyền hợp lệ");
}

// ───────────────────── DATA ─────────────────────
const ROLES: { id: Role; label: string; color: string }[] = [
  { id: "guest",   label: "Khách",         color: "#64748B" },
  { id: "student", label: "Học viên",       color: "#5B6CF0" },
  { id: "teacher", label: "Giảng viên",     color: "#10B981" },
  { id: "sme",     label: "Chuyên gia ND",  color: "#F59E0B" },
  { id: "manager", label: "Quản lý KH",     color: "#8B5CF6" },
  { id: "admin",   label: "Admin",           color: "#EF4444" },
];

const COURSES: any[] = [];
const REVENUE_DATA: any[] = [];
const USERS: any[] = [];
const STUDENT_PROGRESS: any[] = [];
const CONTENT_SECTIONS: any[] = [];
const CATEGORY_DATA: any[] = [];
const MY_COURSES: any[] = [];
const FLASHCARDS: any[] = [];
const QUIZ_QUESTIONS: any[] = [];
const ESSAYS_TO_GRADE: any[] = [];

// ───────────────────── NAV CONFIG ─────────────────────
const SIDEBAR_NAV: Record<Role, { icon: React.ComponentType<{ size?: number }>; label: string; view: string }[]> = {
  guest: [],
  student: [
    { icon: LayoutDashboard, label: "Tổng quan",        view: "dashboard" },
    { icon: BookOpen,         label: "Khóa học của tôi", view: "courses"   },
    { icon: Repeat,           label: "Flashcard",         view: "flashcard" },
    { icon: ListChecks,       label: "Bài kiểm tra",      view: "quiz"      },
    { icon: FileText,         label: "Assignments",       view: "assignments" },
    { icon: BarChart3,        label: "Tiến độ",           view: "progress"  },
  ],
  teacher: [
    { icon: LayoutDashboard, label: "Tổng quan",     view: "dashboard" },
    { icon: Users,            label: "Học viên",      view: "students"  },
    { icon: PenTool,          label: "Chấm luận",     view: "grading"   },
    { icon: BookOpen,         label: "Tài liệu lớp",  view: "materials" },
  ],
  sme: [
    { icon: LayoutDashboard, label: "Tổng quan",         view: "dashboard" },
    { icon: Layers,           label: "Nội dung khóa học", view: "content"   },
    { icon: FileText,         label: "Assignments",       view: "assignments" },
    { icon: Film,             label: "Lesson Editor",     view: "lessons" },
    { icon: Upload,           label: "Xuất bản",          view: "publish"   },
    { icon: Eye,              label: "Xem trước",          view: "preview"   },
  ],
  manager: [
    { icon: LayoutDashboard, label: "Tổng quan",   view: "dashboard"     },
    { icon: DollarSign,       label: "Doanh thu",   view: "revenue"       },
    { icon: Package,          label: "Gói đăng ký", view: "subscriptions" },
    { icon: BookOpen,         label: "Lớp học",     view: "classes"       },
  ],
  admin: [
    { icon: LayoutDashboard, label: "Tổng quan",  view: "dashboard" },
    { icon: Users,            label: "Tài khoản",  view: "users"     },
    { icon: BookOpen,         label: "Khóa học",   view: "courses"   },
    { icon: BarChart3,        label: "Báo cáo",    view: "reports"   },
    { icon: Settings,         label: "Cấu hình",   view: "settings"  },
  ],
};

// ───────────────────── SHARED COMPONENTS ─────────────────────
const BADGE_STYLES: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  blue:    "bg-[#EEF0FF] text-[#5B6CF0]",
  green:   "bg-[#ECFDF5] text-[#10B981]",
  yellow:  "bg-[#FFFBEB] text-[#D97706]",
  red:     "bg-[#FEF2F2] text-[#EF4444]",
  purple:  "bg-[#F5F3FF] text-[#8B5CF6]",
  gray:    "bg-gray-100  text-gray-600",
};

function Badge({ children, color = "default" }: { children: ReactNode; color?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${BADGE_STYLES[color] ?? BADGE_STYLES.default}`}>
      {children}
    </span>
  );
}

function Ava({ initials, size = "md", color = "#5B6CF0" }: { initials: string; size?: "sm" | "md" | "lg"; color?: string }) {
  const sz = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base" }[size];
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`} style={{ backgroundColor: color }}>
      {initials}
    </div>
  );
}

function StatCard({ label, value, change, icon: Icon, color = "#5B6CF0" }: {
  label: string; value: string; change?: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; color?: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <Icon size={17} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {change && (
        <div className="flex items-center gap-1 mt-1.5">
          <ArrowUpRight size={12} className="text-[#10B981]" />
          <span className="text-xs text-[#10B981] font-medium">{change}</span>
        </div>
      )}
    </div>
  );
}

function Bar2({ value, color = "#5B6CF0", h = "h-1.5" }: { value: number; color?: string; h?: string }) {
  return (
    <div className={`w-full bg-muted rounded-full ${h}`}>
      <div className={`${h} rounded-full transition-all`} style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

const CT_ICON: Record<string, { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; color: string; bg: string }> = {
  video:     { icon: Film,      color: "#5B6CF0", bg: "#EEF0FF" },
  document:  { icon: FileText,  color: "#10B981", bg: "#ECFDF5" },
  quiz:      { icon: ListChecks,color: "#F59E0B", bg: "#FFFBEB" },
  flashcard: { icon: Repeat,    color: "#8B5CF6", bg: "#F5F3FF" },
  essay:     { icon: PenTool,   color: "#EF4444", bg: "#FEF2F2" },
};

function ContentIcon({ type }: { type: string }) {
  const { icon: Icon, color, bg } = CT_ICON[type] ?? CT_ICON.document;
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
      <Icon size={14} style={{ color }} />
    </div>
  );
}

// ───────────────────── SHARED MODAL / CONFIRM ─────────────────────

function Modal({ title, children, onClose, size = "md" }: {
  title: string; children: ReactNode; onClose: () => void; size?: "sm" | "md" | "lg";
}) {
  const w = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,18,40,0.55)", backdropFilter: "blur(4px)" }}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${w} flex flex-col`} style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h3 className="font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"><X size={16} /></button>
        </div>
        <div className="overflow-auto p-6 flex-1">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,18,40,0.55)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-[#FEF2F2] rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle size={22} className="text-[#EF4444]" />
        </div>
        <h3 className="font-bold text-foreground mb-2">Xác nhận xoá</h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors">Huỷ bỏ</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-[#EF4444] text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors">Xoá</button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-xs text-[#EF4444] mt-1 font-medium">{error}</p>}
    </div>
  );
}

function FInput({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B6CF0]/20 focus:border-[#5B6CF0] transition-all" />
  );
}

function FSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B6CF0]/20 focus:border-[#5B6CF0] transition-all bg-white appearance-none cursor-pointer">
      {children}
    </select>
  );
}

// ───────────────────── LANDING PAGE ─────────────────────
function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1C2448] flex items-center justify-center">
              <Sparkles size={15} className="text-white" />
            </div>
            <span className="font-extrabold text-[#1C2448] text-lg tracking-tight">EduNexus</span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-muted-foreground">
            {["Khóa học", "Giảng viên", "Doanh nghiệp", "Giá cả"].map(l => (
              <a key={l} href="#" className="hover:text-foreground transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Đăng nhập</button>
            <button onClick={onLogin} className="px-4 py-2 bg-[#1C2448] text-white text-sm font-semibold rounded-xl hover:bg-[#2A3560] transition-all">Bắt đầu miễn phí</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-[#EEF0FF] via-white to-[#F0FFF8]" />
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full" style={{ background: "radial-gradient(circle, rgba(91,108,240,0.12) 0%, transparent 70%)" }} />
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EEF0FF] rounded-full text-xs font-bold text-[#5B6CF0] mb-6">
              <Sparkles size={11} /> Nền tảng học tập AI đầu tiên tại Việt Nam
            </div>
            <h1 className="text-5xl font-extrabold text-[#1C2448] leading-[1.08] tracking-tight mb-5">
              Học thông minh hơn<br />với <span style={{ color: "#5B6CF0" }}>trí tuệ nhân tạo</span>
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-md">
              EduNexus tích hợp AI để cá nhân hóa lộ trình học, tự động chấm điểm bài luận, và tạo câu hỏi ôn luyện thông minh — giúp bạn học hiệu quả gấp 3 lần.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <button onClick={onLogin} className="px-6 py-3 bg-[#1C2448] text-white font-bold rounded-xl hover:bg-[#2A3560] transition-all shadow-lg shadow-[#1C2448]/20 flex items-center gap-2">
                Học thử miễn phí <ChevronRight size={16} />
              </button>
              <button className="px-6 py-3 border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-colors flex items-center gap-2">
                <Play size={14} fill="currentColor" /> Xem demo
              </button>
            </div>
            <div className="flex flex-wrap gap-8">
              {[["58,000+", "Học viên"], ["240+", "Khóa học"], ["98", "Chuyên gia"], ["4.8★", "Đánh giá"]].map(([v, l]) => (
                <div key={l}>
                  <div className="text-2xl font-extrabold text-[#1C2448]">{v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-medium">{l}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Hero card */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-3xl border border-border shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-foreground">Tiến độ học tập hôm nay</span>
                <Badge color="green">+12% tuần này</Badge>
              </div>
              {MY_COURSES.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    <img src={`https://images.unsplash.com/${c.image}?w=60&h=60&fit=crop&auto=format`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{c.title}</p>
                    <Bar2 value={c.progress} h="h-1" />
                  </div>
                  <span className="text-xs font-bold text-[#5B6CF0]">{c.progress}%</span>
                </div>
              ))}
              <div className="bg-[#EEF0FF] rounded-2xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-[#5B6CF0] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Brain size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1C2448]">AI gợi ý ôn luyện</p>
                  <p className="text-xs text-[#5B6CF0] mt-0.5">8 flashcard cần ôn hôm nay — tỷ lệ ghi nhớ 87%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-[#1C2448] tracking-tight">Khóa học nổi bật</h2>
              <p className="text-muted-foreground mt-1 text-sm">Được thiết kế bởi các chuyên gia hàng đầu</p>
            </div>
            <button className="flex items-center gap-1 text-sm font-bold text-[#5B6CF0] hover:underline">
              Xem tất cả <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {COURSES.map((course, i) => {
              const catColor = ["blue", "green", "yellow", "red"][i] as string;
              return (
                <div key={course.id} className="group rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all cursor-pointer bg-white">
                  <div className="relative h-40 bg-muted overflow-hidden">
                    <img
                      src={`https://images.unsplash.com/${course.image}?w=400&h=200&fit=crop&auto=format`}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {i === 0 && <div className="absolute top-3 left-3 bg-[#5B6CF0] text-white text-xs px-2.5 py-1 rounded-full font-bold">Bán chạy nhất</div>}
                    {i === 1 && <div className="absolute top-3 left-3 bg-[#10B981] text-white text-xs px-2.5 py-1 rounded-full font-bold">Mới nhất</div>}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Badge color={catColor}>{course.category}</Badge>
                      <Badge color="gray">{course.level}</Badge>
                    </div>
                    <h3 className="font-bold text-[#1C2448] text-sm leading-snug mb-1 line-clamp-2">{course.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{course.instructor}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                      <Star size={11} className="text-[#F59E0B] fill-[#F59E0B]" />
                      <span className="font-bold text-foreground">{course.rating}</span>
                      <span>({course.students.toLocaleString()})</span>
                      <span>·</span>
                      <span>{course.lessons} bài</span>
                    </div>
                    {i < 2 ? (
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[#1C2448] text-sm">{course.price.toLocaleString()}đ</span>
                        <button onClick={onLogin} className="text-xs px-3 py-1.5 bg-[#5B6CF0] text-white rounded-lg font-bold hover:bg-[#4A5BD0] transition-colors">Đăng ký</button>
                      </div>
                    ) : (
                      <p className="text-xs text-[#5B6CF0] font-semibold">Thử 10 câu hỏi & 5 thẻ ghi nhớ →</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-[#F8F9FD]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[#1C2448] tracking-tight">AI làm thay đổi cách bạn học</h2>
            <p className="text-muted-foreground mt-2 text-sm">Không chỉ là nội dung — đây là trải nghiệm học tập thông minh</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Brain,       color: "#5B6CF0", bg: "#EEF0FF", title: "AI Flashcard thông minh",    desc: "Hệ thống spaced repetition tự động điều chỉnh lịch ôn tập dựa trên tiến độ học của bạn." },
              { icon: Zap,         color: "#10B981", bg: "#ECFDF5", title: "Chấm bài luận tức thì",     desc: "AI phân tích nội dung, logic, ngôn ngữ — cho phản hồi chi tiết trong vài giây." },
              { icon: Target,      color: "#F59E0B", bg: "#FFFBEB", title: "Lộ trình cá nhân hóa",      desc: "Hệ thống phân tích điểm yếu và tự động đề xuất bài học phù hợp với từng học viên." },
              { icon: BarChart3,   color: "#8B5CF6", bg: "#F5F3FF", title: "Phân tích tiến độ",         desc: "Dashboard trực quan hiển thị điểm số, thời gian học, và xu hướng tiến bộ theo tuần." },
              { icon: MessageSquare, color: "#EF4444", bg: "#FEF2F2", title: "Trợ lý AI 24/7",          desc: "Chatbot giải thích bài học, trả lời câu hỏi, hướng dẫn ôn tập bất cứ lúc nào." },
              { icon: Award,       color: "#1C2448", bg: "#E8EAFF", title: "Chứng chỉ được công nhận",  desc: "Hoàn thành khóa học và nhận chứng chỉ được nhiều doanh nghiệp hàng đầu công nhận." },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-border hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: f.bg }}>
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-[#1C2448] mb-2 text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-[#1C2448]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Sẵn sàng nâng cấp hành trình học tập?</h2>
          <p className="text-[#A8B2D8] mb-8 text-sm">Tham gia cùng 58,000+ học viên đang học trên EduNexus ngay hôm nay.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={onLogin} className="px-6 py-3 bg-[#5B6CF0] text-white font-bold rounded-xl hover:bg-[#4A5BD0] transition-colors">Đăng ký học miễn phí</button>
            <button className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20">Tìm hiểu thêm</button>
          </div>
        </div>
      </section>

      {/* Role demo strip */}
      <section className="py-8 px-6 bg-white border-t border-border">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs text-muted-foreground mb-4 font-semibold uppercase tracking-widest">Demo giao diện theo vai trò</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {ROLES.filter(r => r.id !== "guest").map(r => (
              <button
                key={r.id}
                onClick={onLogin}
                className="px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:shadow-sm"
                style={{ color: r.color, borderColor: `${r.color}30`, backgroundColor: `${r.color}08` }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ───────────────────── SIDEBAR ─────────────────────
function Sidebar({ role, currentView, onNavigate, onHome, user }: {
  role: Role; currentView: string; onNavigate: (v: string) => void; onHome: () => void; user?: AuthUser | null;
}) {
  const nav = SIDEBAR_NAV[role];
  const info = ROLES.find(r => r.id === role)!;
  const NAMES: Record<Role, string> = { guest: "", student: "Nguyễn Văn An", teacher: "Trần Thị Bích", sme: "Lê Minh Cường", manager: "Hoàng Văn Em", admin: "Admin" };
  const INITIALS: Record<Role, string> = { guest: "", student: "NA", teacher: "TB", sme: "LC", manager: "HE", admin: "AD" };
  const displayName = user?.fullName || NAMES[role];
  const displayInitials = displayName.split(/\s+/).filter(Boolean).slice(-2).map(part => part[0]).join("").toUpperCase() || INITIALS[role];

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-full" style={{ backgroundColor: "#1C2448" }}>
      <div className="h-16 flex items-center px-5 gap-2.5 border-b border-white/10">
        <div className="w-8 h-8 rounded-xl bg-[#5B6CF0] flex items-center justify-center">
          <Sparkles size={15} className="text-white" />
        </div>
        <span className="font-extrabold text-white text-base tracking-tight">EduNexus</span>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-auto space-y-0.5">
        {nav.map(item => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              currentView === item.view ? "bg-white/12 text-white" : "text-white/55 hover:text-white hover:bg-white/6"
            }`}
            style={currentView === item.view ? { backgroundColor: "rgba(255,255,255,0.12)" } : {}}
          >
            <item.icon size={15} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10 space-y-0.5">
        <button onClick={onHome} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/50 hover:text-white transition-all" style={{}}>
          <Globe size={15} /> Trang chủ
        </button>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: info.color }}>
            {user?.avatarUrl ? <img src={user.avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" /> : displayInitials}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">{displayName}</div>
            <div className="text-xs text-white/40 truncate">{info.label}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ───────────────────── TOPBAR ─────────────────────
function TopBar({ role, onRoleChange, onLogout }: { role: Role; onRoleChange: (r: Role) => void; onLogout?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1 relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-xl border-none outline-none focus:ring-2 focus:ring-[#5B6CF0]/20" placeholder="Tìm kiếm..." />
      </div>
      <div className="flex-1" />
      <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">
        <Bell size={17} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#EF4444] rounded-full" />
      </button>
      {onLogout && (
        <button onClick={onLogout} className="p-2 text-muted-foreground hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-colors" title="Đăng xuất">
          <LogOut size={16} />
        </button>
      )}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border text-sm font-semibold">
          <span className="text-xs text-muted-foreground font-medium">Vai trò:</span>
          <span>{ROLES.find(r => r.id === role)?.label}</span>
        </div>
        {open && (
          <div className="absolute right-0 top-full mt-2 bg-white border border-border rounded-2xl shadow-2xl py-1.5 w-44 z-50">
            {ROLES.map(r => (
              <button
                key={r.id}
                onClick={() => { onRoleChange(r.id); setOpen(false); }}
                className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-muted transition-colors"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                <span className={r.id === role ? "font-bold" : "font-medium"}>{r.label}</span>
                {r.id === role && <Check size={12} className="ml-auto text-[#10B981]" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

// ───────────────────── STUDENT ─────────────────────
function StudentView({ view }: { view: string }) {
  const [fcIdx, setFcIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [library, setLibrary] = useState<any>({ stats: {}, enrollments: [], subscriptions: [] });
  const [libraryError, setLibraryError] = useState("");
  const [courseDetail, setCourseDetail] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [studentAssignments, setStudentAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("edunexus_token") || localStorage.getItem("edunexus_token");
    if (!token) return;
    fetch(`${API_URL}/student/library`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message); return data; })
      .then(setLibrary)
      .catch(error => setLibraryError(error.message || "Không thể tải thư viện"));
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("edunexus_token") || localStorage.getItem("edunexus_token"); if (!token) return;
    fetch(`${API_URL}/student-assignments`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(data => Array.isArray(data) && setStudentAssignments(data));
  }, []);

  async function submitAssignment() {
    const token = sessionStorage.getItem("edunexus_token") || localStorage.getItem("edunexus_token"); setSubmitting(true); setLibraryError("");
    const response = await fetch(`${API_URL}/student-assignments/${selectedAssignment.id}/submit`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ content: submissionContent }) }); const data = await response.json();
    if (!response.ok) { setLibraryError(data.message); setSubmitting(false); return; }
    setSubmissionResult(data); setSubmitting(false);
  }

  async function refreshAssignmentResult(assignmentId: number) {
    const token = sessionStorage.getItem("edunexus_token") || localStorage.getItem("edunexus_token");
    const response = await fetch(`${API_URL}/student-assignments/${assignmentId}/result`, { headers: { Authorization: `Bearer ${token}` } }); const data = await response.json();
    if (response.ok) setSubmissionResult(data); else setLibraryError(data.message);
  }

  async function openCourseDetail(courseId: number) {
    const token = sessionStorage.getItem("edunexus_token") || localStorage.getItem("edunexus_token");
    setDetailLoading(true); setLibraryError("");
    try {
      const response = await fetch(`${API_URL}/student/library/courses/${courseId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Không thể tải chi tiết khóa học");
      setCourseDetail(data);
      setActiveLesson(data.course?.lessons?.find((lesson: any) => lesson.contentUrl || lesson.content) ?? null);
    } catch (error) { setLibraryError(error instanceof Error ? error.message : "Không thể tải chi tiết khóa học"); }
    finally { setDetailLoading(false); }
  }

  if (view === "lessons" && false) return <div className="p-6 max-w-6xl mx-auto">
    <div className="flex justify-between mb-6"><div><h2 className="text-xl font-bold">Lesson Editor</h2><p className="text-sm text-muted-foreground mt-1">Video, Markdown và file đính kèm</p></div><button onClick={() => { setLessonForm({ id: null, courseId: smeCourses[0]?.id ?? "", title: "", contentType: "document", contentUrl: "", content: "", durationMinutes: 15, orderIndex: lessons.length + 1, isPreview: false, attachments: [] }); setLessonEditing(true); }} className="px-4 py-2 bg-[#1C2448] text-white rounded-xl text-sm font-bold"><Plus size={14} className="inline mr-1" /> Thêm lesson</button></div>
    {smeError && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm">{smeError}</div>}
    <div className="bg-white border border-border rounded-2xl overflow-hidden">{lessons.map(lesson => <button key={lesson.id} onClick={() => { setLessonForm({ ...lesson, contentUrl: lesson.contentUrl ?? "", content: lesson.content ?? "", attachments: lesson.attachments ?? [] }); setLessonEditing(true); }} className="w-full p-4 flex items-center gap-3 text-left border-b border-border last:border-0 hover:bg-muted/30"><ContentIcon type={lesson.contentType} /><div className="flex-1"><p className="font-semibold text-sm">{lesson.title}</p><p className="text-xs text-muted-foreground mt-1">{lesson.course?.title} · {lesson.contentType} · {lesson.durationMinutes} phút · {lesson.attachments?.length ?? 0} files</p></div><Badge color={lesson.isPreview ? "green" : "gray"}>{lesson.isPreview ? "Preview" : "Private"}</Badge><Edit size={14} /></button>)}</div>
    {lessons.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">Chưa có lesson. Nhấn “Thêm lesson” để bắt đầu.</div>}
    {lessonEditing && <Modal title={lessonForm.id ? "Edit Lesson" : "AI Lesson Staging"} onClose={() => setLessonEditing(false)}><div className="space-y-4 max-h-[78vh] overflow-auto pr-1">
      <div className="bg-[#EEF0FF] rounded-xl p-4"><label className="text-xs font-bold">Tạo lesson text bằng Gemini</label><div className="flex gap-2 mt-2"><input value={lessonAiTopic} onChange={e => setLessonAiTopic(e.target.value)} placeholder="Ví dụ: Neural Network cơ bản" className="flex-1 border rounded-xl px-3 text-sm" /><button onClick={generateLesson} disabled={!lessonAiTopic || lessonAiLoading} className="px-3 py-2 bg-[#5B6CF0] text-white rounded-xl text-xs font-bold disabled:opacity-50">{lessonAiLoading ? "Đang tạo..." : "Tạo bằng AI"}</button></div><p className="text-xs text-muted-foreground mt-2">AI chỉ tạo bản nháp. SME có thể chỉnh trước khi lưu.</p></div>
      <FormField label="Khóa học"><FSelect value={String(lessonForm.courseId)} onChange={v => setLessonForm((f:any)=>({...f,courseId:v}))}>{smeCourses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</FSelect></FormField>
      <div className="grid grid-cols-2 gap-3"><FormField label="Tiêu đề"><FInput value={lessonForm.title} onChange={v=>setLessonForm((f:any)=>({...f,title:v}))} /></FormField><FormField label="Loại"><FSelect value={lessonForm.contentType} onChange={v=>setLessonForm((f:any)=>({...f,contentType:v}))}><option value="video">Video</option><option value="document">Markdown</option><option value="quiz">Quiz</option><option value="flashcard">Flashcard</option><option value="essay">Essay</option></FSelect></FormField></div>
      <FormField label="Video / Content URL"><FInput value={lessonForm.contentUrl} onChange={v=>setLessonForm((f:any)=>({...f,contentUrl:v}))} placeholder="https://youtube.com/watch?v=..." /></FormField>
      <div className="grid md:grid-cols-2 gap-3"><div><label className="text-xs font-bold">Markdown content</label><textarea value={lessonForm.content} onChange={e=>setLessonForm((f:any)=>({...f,content:e.target.value}))} className="mt-2 w-full min-h-64 border border-border rounded-xl p-3 text-sm font-mono" /></div><div><label className="text-xs font-bold">Preview</label><div className="mt-2 min-h-64 border border-border rounded-xl p-4 text-sm whitespace-pre-wrap bg-muted/20">{lessonForm.content || "Markdown preview sẽ hiển thị ở đây"}</div></div></div>
      <div><div className="flex justify-between items-center"><label className="text-xs font-bold">Attached files</label><button onClick={()=>setLessonForm((f:any)=>({...f,attachments:[...f.attachments,{name:"",url:"",mimeType:"",sizeBytes:0}]}))} className="text-xs font-bold text-[#5B6CF0]">+ Thêm file</button></div>{lessonForm.attachments.map((file:any,index:number)=><div key={index} className="grid grid-cols-[1fr_2fr_32px] gap-2 mt-2"><input value={file.name} onChange={e=>setLessonForm((f:any)=>({...f,attachments:f.attachments.map((x:any,i:number)=>i===index?{...x,name:e.target.value}:x)}))} placeholder="Tên file" className="border rounded-lg p-2 text-xs" /><input value={file.url} onChange={e=>setLessonForm((f:any)=>({...f,attachments:f.attachments.map((x:any,i:number)=>i===index?{...x,url:e.target.value}:x)}))} placeholder="URL file" className="border rounded-lg p-2 text-xs" /><button onClick={()=>setLessonForm((f:any)=>({...f,attachments:f.attachments.filter((_:any,i:number)=>i!==index)}))} className="text-red-500"><X size={14}/></button></div>)}</div>
      <div className="grid grid-cols-3 gap-3"><FormField label="Thời lượng"><input type="number" value={lessonForm.durationMinutes} onChange={e=>setLessonForm((f:any)=>({...f,durationMinutes:e.target.value}))} className="w-full border rounded-xl p-2 text-sm" /></FormField><FormField label="Thứ tự"><input type="number" value={lessonForm.orderIndex} onChange={e=>setLessonForm((f:any)=>({...f,orderIndex:e.target.value}))} className="w-full border rounded-xl p-2 text-sm" /></FormField><FormField label="Preview"><input type="checkbox" checked={lessonForm.isPreview} onChange={e=>setLessonForm((f:any)=>({...f,isPreview:e.target.checked}))} className="mt-3 w-4 h-4" /></FormField></div>
      <button onClick={saveLesson} disabled={!lessonForm.title || !lessonForm.courseId} className="w-full py-2.5 bg-[#1C2448] text-white rounded-xl text-sm font-bold disabled:opacity-50">Lưu lesson</button>
    </div></Modal>}
  </div>;

  if (view === "assignments") return <div className="p-6 max-w-6xl mx-auto">
    <h2 className="text-xl font-bold mb-1">Assignments</h2><p className="text-sm text-muted-foreground mb-6">Nộp bài và xem kết quả đánh giá AI</p>
    {libraryError && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm">{libraryError}</div>}
    <div className="grid md:grid-cols-2 gap-4">{studentAssignments.map(item => { const result = item.submissions?.[0]; return <div key={item.id} className="bg-white border border-border rounded-2xl p-5">
      <div className="flex justify-between gap-3"><Badge color="blue">{item.course?.title}</Badge><Badge color={result?.status === "completed" ? "green" : result ? "yellow" : "gray"}>{result?.status ?? "Chưa nộp"}</Badge></div>
      <h3 className="font-bold mt-4">{item.title}</h3><p className="text-sm text-muted-foreground mt-2 line-clamp-3">{item.instructions}</p>
      <div className="flex justify-between text-xs mt-4"><span>{item.maxScore} điểm</span><span>Hạn: {item.dueAt ? new Date(item.dueAt).toLocaleDateString("vi-VN") : "Không giới hạn"}</span></div>
      <button onClick={() => { setSelectedAssignment(item); setSubmissionContent(result?.content ?? ""); setSubmissionResult(result ?? null); }} className="mt-4 w-full py-2.5 bg-[#1C2448] text-white rounded-xl text-sm font-bold">{result ? "Xem bài và kết quả" : "Nộp bài"}</button>
    </div>; })}</div>
    {selectedAssignment && <Modal title={selectedAssignment.title} onClose={() => setSelectedAssignment(null)}><div className="space-y-4 max-h-[75vh] overflow-auto pr-1">
      <div className="bg-muted rounded-xl p-4"><p className="text-sm font-semibold">Yêu cầu</p><p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{selectedAssignment.instructions}</p></div>
      <FormField label="Nội dung bài nộp"><textarea value={submissionContent} onChange={e => setSubmissionContent(e.target.value)} className="w-full min-h-40 border border-border rounded-xl p-3 text-sm" placeholder="Nhập nội dung bài làm..." /></FormField>
      <button onClick={submitAssignment} disabled={submitting || !submissionContent.trim()} className="w-full py-2.5 bg-[#5B6CF0] text-white rounded-xl font-bold text-sm disabled:opacity-50">{submitting ? "Đang gửi..." : submissionResult ? "Nộp lại và chấm lại" : "Nộp bài"}</button>
      {submissionResult && <div className="border-t border-border pt-4">
        <div className="flex justify-between items-center"><h3 className="font-bold">Kết quả đánh giá AI</h3><button onClick={() => refreshAssignmentResult(selectedAssignment.id)} className="text-xs font-bold text-[#5B6CF0] flex items-center gap-1"><RefreshCw size={12} /> Cập nhật</button></div>
        {(submissionResult.status === "pending" || submissionResult.status === "processing") && <div className="mt-3 bg-yellow-50 text-yellow-700 p-3 rounded-xl text-sm">AI đang đánh giá bất đồng bộ. Nhấn “Cập nhật” sau ít phút.</div>}
        {submissionResult.status === "failed" && <div className="mt-3 bg-red-50 text-red-600 p-3 rounded-xl text-sm">Đánh giá thất bại: {submissionResult.aiError}</div>}
        {submissionResult.status === "completed" && <div className="mt-4"><div className="text-center bg-[#EEF0FF] rounded-xl p-4"><span className="text-sm">Tổng điểm</span><p className="text-3xl font-extrabold text-[#5B6CF0]">{Number(submissionResult.score)}/{selectedAssignment.maxScore}</p></div><p className="mt-4 text-sm leading-6">{submissionResult.feedback}</p>
          <div className="mt-4 space-y-2">{(submissionResult.rubricResult ?? []).map((row:any,index:number)=><div key={index} className="border border-border rounded-xl p-3"><div className="flex justify-between"><b className="text-sm">{row.criterion}</b><b className="text-sm text-[#5B6CF0]">{row.score}/{row.maxScore}</b></div><p className="text-xs text-muted-foreground mt-1">{row.feedback}</p></div>)}</div>
        </div>}
      </div>}
    </div></Modal>}
  </div>;

  if (view === "flashcard") {
    if (FLASHCARDS.length === 0) return <div className="p-8 text-sm text-muted-foreground">Chưa có flashcard.</div>;
    const card = FLASHCARDS[fcIdx];
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Flashcard · ML Fundamentals</h2>
          <Badge color="blue">{fcIdx + 1} / {FLASHCARDS.length}</Badge>
        </div>
        <Bar2 value={((fcIdx + 1) / FLASHCARDS.length) * 100} h="h-1.5" />
        <button onClick={() => setFlipped(v => !v)} className="w-full mt-8 text-left">
          <div className="bg-white border border-border rounded-2xl p-8 min-h-52 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow relative">
            <span className="absolute top-4 right-4 text-xs font-mono text-muted-foreground">{flipped ? "Định nghĩa" : "Thuật ngữ"}</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-5"><Repeat size={11} /> nhấn để lật</div>
            {!flipped
              ? <h3 className="text-3xl font-extrabold text-[#1C2448]">{card.front}</h3>
              : <p className="text-base text-foreground leading-relaxed max-w-sm">{card.back}</p>
            }
          </div>
        </button>
        <div className="flex gap-2 mt-5">
          <button onClick={() => { setFcIdx(i => Math.max(0, i - 1)); setFlipped(false); }} disabled={fcIdx === 0} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-40 flex items-center justify-center gap-1"><ChevronLeft size={14} /> Trước</button>
          <button className="flex-1 py-3 bg-[#FEF2F2] text-[#EF4444] rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">Chưa nhớ</button>
          <button className="flex-1 py-3 bg-[#ECFDF5] text-[#10B981] rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors">Đã nhớ ✓</button>
          <button onClick={() => { setFcIdx(i => Math.min(FLASHCARDS.length - 1, i + 1)); setFlipped(false); }} disabled={fcIdx === FLASHCARDS.length - 1} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-40 flex items-center justify-center gap-1">Tiếp <ChevronRight size={14} /></button>
        </div>
        <div className="mt-5 bg-[#EEF0FF] rounded-2xl p-4 flex items-center gap-3">
          <Brain size={18} className="text-[#5B6CF0] flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-[#1C2448]">AI gợi ý ôn luyện</p>
            <p className="text-xs text-[#5B6CF0] mt-0.5">Bạn nên ôn lại "Gradient Descent" vào ngày mai — thẻ có tỷ lệ quên cao nhất (67%).</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === "quiz") {
    if (QUIZ_QUESTIONS.length === 0) return <div className="p-8 text-sm text-muted-foreground">Chưa có bài kiểm tra.</div>;
    if (done) {
      return (
        <div className="p-8 max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-5">
            <Award size={34} className="text-[#10B981]" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground mb-2">Hoàn thành!</h2>
          <p className="text-muted-foreground mb-6">Điểm số của bạn: <span className="font-extrabold text-[#5B6CF0]">85/100</span></p>
          <div className="bg-[#EEF0FF] rounded-2xl p-4 text-left mb-6">
            <div className="flex items-center gap-2 mb-2"><Sparkles size={14} className="text-[#5B6CF0]" /><span className="text-xs font-bold text-[#1C2448]">Nhận xét từ AI</span></div>
            <p className="text-xs text-[#5B6CF0] leading-relaxed">Bạn nắm vững khái niệm cơ bản! Cần ôn thêm về Gradient Descent và regularization để đạt điểm cao hơn trong kỳ thi tiếp theo.</p>
          </div>
          <button onClick={() => { setQIdx(0); setAnswer(null); setDone(false); }} className="px-6 py-3 bg-[#1C2448] text-white font-bold rounded-xl">Làm lại</button>
        </div>
      );
    }
    const q = QUIZ_QUESTIONS[qIdx];
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Kiểm tra · ML Fundamentals</h2>
          <span className="text-sm text-muted-foreground font-medium">Câu {qIdx + 1}/{QUIZ_QUESTIONS.length}</span>
        </div>
        <Bar2 value={((qIdx + 1) / QUIZ_QUESTIONS.length) * 100} h="h-1.5" />
        <div className="mt-7 bg-white border border-border rounded-2xl p-6">
          <p className="font-bold text-[#1C2448] mb-6">{q.q}</p>
          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const isSelected = answer === i;
              const isCorrect = i === q.correct;
              let cls = "border-border hover:border-[#5B6CF0] hover:bg-[#EEF0FF]";
              if (answer !== null) {
                if (isSelected && isCorrect)  cls = "border-[#10B981] bg-[#ECFDF5] text-[#10B981]";
                else if (isSelected && !isCorrect) cls = "border-[#EF4444] bg-[#FEF2F2] text-[#EF4444]";
                else if (!isSelected && isCorrect) cls = "border-[#10B981] bg-[#ECFDF5] text-[#10B981]";
              }
              return (
                <button key={i} onClick={() => answer === null && setAnswer(i)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${cls}`}>
                  <span className="inline-flex w-5 h-5 rounded-full border border-current items-center justify-center text-xs mr-3">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              );
            })}
          </div>
          {answer !== null && (
            <div className="mt-4 p-3 rounded-xl bg-muted text-sm text-muted-foreground font-medium">
              {answer === q.correct ? "✅ Chính xác!" : `❌ Đáp án đúng: ${q.options[q.correct]}`}
            </div>
          )}
        </div>
        <div className="flex justify-end mt-5">
          <button disabled={answer === null}
            onClick={() => { if (qIdx < QUIZ_QUESTIONS.length - 1) { setQIdx(i => i + 1); setAnswer(null); } else setDone(true); }}
            className="px-6 py-3 bg-[#1C2448] text-white font-bold rounded-xl hover:bg-[#2A3560] disabled:opacity-40 transition-colors">
            {qIdx < QUIZ_QUESTIONS.length - 1 ? "Câu tiếp theo" : "Nộp bài"}
          </button>
        </div>
      </div>
    );
  }

  if (view === "courses") {
    if (courseDetail) {
      const course = courseDetail.course;
      return <div className="p-6 max-w-5xl mx-auto">
        <button onClick={() => setCourseDetail(null)} className="mb-5 flex items-center gap-1 text-sm font-semibold text-[#5B6CF0]"><ArrowLeft size={15} /> Quay lại thư viện</button>
        <div className="bg-white rounded-2xl border border-border p-6 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div><Badge color="blue">{course.category?.name}</Badge><h2 className="text-2xl font-extrabold mt-3">{course.title}</h2><p className="text-sm text-muted-foreground mt-2">Giảng viên: {course.instructor?.fullName}</p></div>
            <Badge color={courseDetail.status === "completed" ? "green" : "yellow"}>{courseDetail.status}</Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground mt-5">{course.description || "Chưa có mô tả."}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 text-sm">
            <div className="bg-muted rounded-xl p-3"><span className="text-muted-foreground">Trình độ</span><b className="block mt-1">{course.level}</b></div>
            <div className="bg-muted rounded-xl p-3"><span className="text-muted-foreground">Tiến độ</span><b className="block mt-1">{Number(courseDetail.progress)}%</b></div>
            <div className="bg-muted rounded-xl p-3"><span className="text-muted-foreground">Số bài học</span><b className="block mt-1">{course.lessons?.length ?? 0}</b></div>
            <div className="bg-muted rounded-xl p-3"><span className="text-muted-foreground">Ngày đăng ký</span><b className="block mt-1">{new Date(courseDetail.enrolledAt).toLocaleDateString("vi-VN")}</b></div>
          </div>
        </div>
        {(course.modules ?? []).length > 0 && <div className="bg-white rounded-2xl border border-border p-6 mb-5"><h3 className="font-bold mb-4">Modules</h3><div className="space-y-3">{course.modules.map((module:any)=><div key={module.id} className="border border-border rounded-xl overflow-hidden"><div className="bg-muted/40 p-4"><b className="text-sm">{module.orderIndex}. {module.title}</b><p className="text-xs text-muted-foreground mt-1">{module.description}</p></div><div className="divide-y divide-border">{(module.contents??[]).map((content:any)=><div key={content.id} className="p-3 flex items-center gap-3"><ContentIcon type={content.type==="lesson"?"video":content.type==="question"?"quiz":content.type}/><div><p className="text-sm font-semibold">{content.title}</p><p className="text-xs text-muted-foreground">{content.type} · {content.description}</p></div></div>)}</div></div>)}</div></div>}
        {activeLesson && <div className="bg-white rounded-2xl border border-border p-6 mb-5">
          <div className="flex items-start justify-between gap-3 mb-4"><div><h3 className="font-bold">{activeLesson.title}</h3><p className="text-xs text-muted-foreground mt-1">{activeLesson.contentType} · {activeLesson.durationMinutes} phút</p></div><button onClick={() => setActiveLesson(null)} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button></div>
          {getYoutubeEmbedUrl(activeLesson.contentUrl) ? <iframe
            src={getYoutubeEmbedUrl(activeLesson.contentUrl)!}
            title={activeLesson.title} className="w-full aspect-video rounded-xl border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
          /> : activeLesson.contentUrl ? <iframe src={activeLesson.contentUrl} title={activeLesson.title} className="w-full h-[520px] rounded-xl border border-border" /> : null}
          {getYoutubeEmbedUrl(activeLesson.contentUrl) && <a href={activeLesson.contentUrl} target="_blank" rel="noreferrer" className="inline-flex mt-3 text-xs font-bold text-[#5B6CF0] hover:underline">Không phát được? Mở trên YouTube</a>}
          {activeLesson.content && <div className="mt-5 border-t border-border pt-5 text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              h1: ({children}) => <h1 className="text-2xl font-extrabold mt-6 mb-3 first:mt-0">{children}</h1>,
              h2: ({children}) => <h2 className="text-xl font-bold mt-6 mb-3 text-[#1C2448]">{children}</h2>,
              h3: ({children}) => <h3 className="text-base font-bold mt-5 mb-2 text-[#1C2448]">{children}</h3>,
              p: ({children}) => <p className="text-sm leading-7 mb-3 text-muted-foreground">{children}</p>,
              ul: ({children}) => <ul className="list-disc pl-6 space-y-2 mb-4 text-sm text-muted-foreground">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal pl-6 space-y-2 mb-4 text-sm text-muted-foreground">{children}</ol>,
              li: ({children}) => <li className="leading-6 pl-1">{children}</li>,
              strong: ({children}) => <strong className="font-bold text-foreground">{children}</strong>,
              blockquote: ({children}) => <blockquote className="border-l-4 border-[#5B6CF0] bg-[#EEF0FF] px-4 py-3 my-4 rounded-r-xl">{children}</blockquote>,
              code: ({children}) => <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-[#5B6CF0]">{children}</code>,
              hr: () => <hr className="my-6 border-border" />,
            }}>{normalizeLessonMarkdown(activeLesson.content)}</ReactMarkdown>
          </div>}
        </div>}
        <div className="bg-white rounded-2xl border border-border p-6"><h3 className="font-bold mb-4">Nội dung khóa học</h3>
          {(course.lessons ?? []).map((lesson: any, index: number) => <div key={lesson.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
            <span className="w-8 h-8 rounded-lg bg-[#EEF0FF] text-[#5B6CF0] flex items-center justify-center text-xs font-bold">{index + 1}</span>
            <div className="flex-1"><p className="text-sm font-semibold">{lesson.title}</p><p className="text-xs text-muted-foreground">{lesson.contentType} · {lesson.durationMinutes} phút</p></div>
            {(lesson.contentUrl || lesson.content) && <button onClick={() => setActiveLesson(lesson)} className="px-3 py-1.5 rounded-lg bg-[#1C2448] text-white text-xs font-bold">Xem nội dung</button>}
            {lesson.isPreview && <Badge color="green">Xem trước</Badge>}
          </div>)}
          {(course.lessons ?? []).length === 0 && <p className="text-sm text-muted-foreground">Khóa học chưa có bài học.</p>}
        </div>
      </div>;
    }
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">Student Library</h2>
        {libraryError && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{libraryError}</div>}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="Tổng khóa học" value={library.stats.totalCourses ?? 0} icon={BookOpen} color="#5B6CF0" />
          <StatCard label="Đang học" value={library.stats.activeCourses ?? 0} icon={Play} color="#10B981" />
          <StatCard label="Hoàn thành" value={library.stats.completedCourses ?? 0} icon={CheckCircle2} color="#F59E0B" />
          <StatCard label="Tiến độ TB" value={`${library.stats.averageProgress ?? 0}%`} icon={TrendingUp} color="#8B5CF6" />
          <StatCard label="Gói còn hạn" value={library.stats.activePackages ?? 0} icon={Package} color="#EF4444" />
        </div>
        <h3 className="font-bold mb-3">Khóa học đã đăng ký</h3>
        <div className="grid md:grid-cols-2 gap-5">
          {library.enrollments.map((item: any) => {
            const c = item.course;
            return <div key={item.id} className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-5">
                <h3 className="font-bold text-[#1C2448] mb-1">{c.title}</h3>
                <p className="text-xs text-muted-foreground mb-4">{c.instructor?.fullName} · {c.category?.name}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>{c.lessons?.length ?? 0} bài học · {item.status}</span>
                  <span className="font-bold text-[#5B6CF0]">{Number(item.progress)}%</span>
                </div>
                <Bar2 value={Number(item.progress)} h="h-1.5" />
                <button disabled={detailLoading} onClick={() => openCourseDetail(c.id)} className="mt-4 w-full py-2 rounded-xl bg-[#1C2448] text-white text-xs font-bold disabled:opacity-50">{detailLoading ? "Đang tải..." : "Xem chi tiết"}</button>
              </div>
            </div>;
          })}
        </div>
        <h3 className="font-bold mt-7 mb-3">Gói đã đăng ký</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {library.subscriptions.map((item: any) => <div key={item.id} className="bg-white rounded-2xl border border-border p-5">
            <div className="flex justify-between"><h4 className="font-bold">{item.package?.name}</h4><Badge color={item.status === "active" ? "green" : "gray"}>{item.status}</Badge></div>
            <p className="text-xs text-muted-foreground mt-2">{item.package?.description}</p>
            <p className="text-xs mt-3">Hết hạn: <b>{new Date(item.expiresAt).toLocaleDateString("vi-VN")}</b></p>
          </div>)}
        </div>
      </div>
    );
  }

  if (view === "progress") {
    const weekly = [
      { day: "T2", min: 45 }, { day: "T3", min: 92 }, { day: "T4", min: 68 },
      { day: "T5", min: 120 }, { day: "T6", min: 85 }, { day: "T7", min: 55 }, { day: "CN", min: 30 },
    ];
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">Tiến độ học tập</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Bài đã học"    value="48"      change="+5 tuần này"  icon={BookOpen}  color="#5B6CF0" />
          <StatCard label="Điểm trung bình" value="85/100" change="+3 điểm"     icon={Star}      color="#F59E0B" />
          <StatCard label="Thẻ đã nhớ"   value="127"     change="+18 hôm nay"  icon={Repeat}    color="#10B981" />
          <StatCard label="Chuỗi ngày học" value="12 ngày" change="Kỷ lục!"    icon={Award}     color="#8B5CF6" />
        </div>
        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="font-bold text-foreground mb-4 text-sm">Thời gian học trong tuần (phút)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart id="chart-student-weekly" data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="min" name="Phút" fill="#5B6CF0" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Student overview
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Chào mừng trở lại, Nguyễn Văn An 👋</h2>
        <p className="text-sm text-muted-foreground mt-1">Bạn đã học <span className="font-bold text-[#5B6CF0]">12 ngày liên tiếp</span> — tiếp tục phát huy!</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Khóa học đang học"  value="2"    icon={BookOpen}  color="#5B6CF0" />
        <StatCard label="Tiến độ trung bình" value="51%"  change="+8% tuần này" icon={TrendingUp} color="#10B981" />
        <StatCard label="Bài kiểm tra"       value="8/10" icon={ListChecks} color="#F59E0B" />
        <StatCard label="Flashcard hôm nay"  value="23"   change="15 còn lại"   icon={Repeat}    color="#8B5CF6" />
      </div>
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm text-foreground mb-4">Tiếp tục học</h3>
          {MY_COURSES.map(c => (
            <div key={c.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
              <div className="w-12 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                <img src={`https://images.unsplash.com/${c.image}?w=80&h=60&fit=crop&auto=format`} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{c.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Bar2 value={c.progress} h="h-1" />
                  <span className="text-xs text-muted-foreground flex-shrink-0 font-medium">{c.progress}%</span>
                </div>
              </div>
              <button className="p-2 bg-[#1C2448] text-white rounded-lg hover:bg-[#2A3560] transition-colors flex-shrink-0">
                <Play size={13} fill="white" />
              </button>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-foreground">Ôn luyện Flashcard</h3>
            <Badge color="blue">45 thẻ</Badge>
          </div>
          <div className="bg-gradient-to-br from-[#EEF0FF] to-[#F0F5FF] rounded-2xl p-5 text-center mb-3">
            <div className="text-xs font-bold text-[#5B6CF0] mb-2 tracking-wide">THUẬT NGỮ</div>
            <div className="text-xl font-extrabold text-[#1C2448]">{FLASHCARDS[0]?.front ?? "Chưa có flashcard"}</div>
          </div>
          <p className="text-xs text-center text-muted-foreground mb-3 font-medium">8 thẻ cần ôn luyện hôm nay</p>
          <button className="w-full py-2.5 bg-[#5B6CF0] text-white text-sm font-bold rounded-xl hover:bg-[#4A5BD0] transition-colors">Ôn luyện ngay</button>
        </div>
      </div>
      <div className="bg-gradient-to-r from-[#1C2448] to-[#2D3870] rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-[#5B6CF0] rounded-2xl flex items-center justify-center flex-shrink-0">
          <Sparkles size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold">Trợ lý AI sẵn sàng hỗ trợ</p>
          <p className="text-[#A8B2D8] text-xs mt-0.5">Hỏi bất cứ điều gì về nội dung bài học — AI sẽ giải thích ngay lập tức.</p>
        </div>
        <button className="px-4 py-2.5 bg-[#5B6CF0] text-white text-sm font-bold rounded-xl hover:bg-[#4A5BD0] transition-colors flex-shrink-0">Chat với AI</button>
      </div>
    </div>
  );
}

// ───────────────────── TEACHER ─────────────────────
type MaterialItem = { id: number; title: string; type: string; desc: string; added: string; size: string };
const INIT_MATERIALS: MaterialItem[] = [
  { id: 1, title: "Slide bài giảng tuần 1-4",   type: "pdf",   desc: "Tổng quan ML và các thuật toán cơ bản",     added: "01/06/2026", size: "4.2 MB" },
  { id: 2, title: "Video hướng dẫn cài môi trường", type: "video", desc: "Cài Python, Jupyter Notebook, scikit-learn", added: "03/06/2026", size: "120 MB" },
  { id: 3, title: "Dataset thực hành",           type: "file",  desc: "Bộ dữ liệu MNIST và Iris cho bài tập",       added: "05/06/2026", size: "8.5 MB" },
  { id: 4, title: "Tài liệu tham khảo ngoại khoá", type: "link", desc: "https://scikit-learn.org/stable/documentation", added: "10/06/2026", size: "—" },
];
const EMPTY_MATERIAL: MaterialItem = { id: 0, title: "", type: "pdf", desc: "", added: "", size: "" };

function TeacherView({ view }: { view: string }) {
  const [sel, setSel] = useState<number | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [essays, setEssays] = useState(ESSAYS_TO_GRADE);

  const [materials, setMaterials] = useState<MaterialItem[]>(INIT_MATERIALS);
  const [matModal, setMatModal] = useState<{ open: boolean; mode: "add"|"edit"; item: MaterialItem }>({ open: false, mode: "add", item: EMPTY_MATERIAL });
  const [matForm, setMatForm] = useState<MaterialItem>(EMPTY_MATERIAL);
  const [matConfirm, setMatConfirm] = useState<number | null>(null);

  function openAddMat() { setMatForm({ ...EMPTY_MATERIAL, id: Date.now(), added: new Date().toLocaleDateString("vi-VN") }); setMatModal({ open: true, mode: "add", item: EMPTY_MATERIAL }); }
  function openEditMat(m: MaterialItem) { setMatForm(m); setMatModal({ open: true, mode: "edit", item: m }); }
  function saveMat() {
    if (!matForm.title.trim()) return;
    if (matModal.mode === "add") setMaterials(ms => [...ms, matForm]);
    else setMaterials(ms => ms.map(m => m.id === matForm.id ? matForm : m));
    setMatModal(m => ({ ...m, open: false }));
  }
  function deleteMat(id: number) { setMaterials(ms => ms.filter(m => m.id !== id)); setMatConfirm(null); }

  const MAT_ICON: Record<string, { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; color: string; bg: string }> = {
    pdf:   { icon: FileText,   color: "#EF4444", bg: "#FEF2F2" },
    video: { icon: Film,       color: "#5B6CF0", bg: "#EEF0FF" },
    file:  { icon: FileUp,     color: "#10B981", bg: "#ECFDF5" },
    link:  { icon: LinkIcon,   color: "#F59E0B", bg: "#FFFBEB" },
  };

  if (view === "grading") {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">Chấm điểm bài luận</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-border">
              <span className="font-bold text-sm">Danh sách bài nộp</span>
              <Badge color="yellow">{essays.filter(e => e.status === "pending").length} chờ chấm</Badge>
            </div>
            {essays.map(essay => (
              <div key={essay.id} onClick={() => setSel(essay.id)}
                className={`p-4 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${sel === essay.id ? "bg-[#EEF0FF]" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{essay.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{essay.student} · {essay.submitted}</p>
                    <p className="text-xs text-muted-foreground">{essay.words} từ</p>
                  </div>
                  <Badge color={essay.status === "pending" ? "yellow" : "green"}>
                    {essay.status === "pending" ? "Chờ chấm" : `${essay.score}/100`}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-border p-5">
            {sel ? (
              <>
                <h3 className="font-bold mb-1">{essays.find(e => e.id === sel)?.title}</h3>
                <p className="text-xs text-muted-foreground mb-4">{essays.find(e => e.id === sel)?.student}</p>
                <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground mb-4 min-h-20 leading-relaxed">
                  Bài viết của học viên về ứng dụng AI trong Y tế — phân tích tác động của trí tuệ nhân tạo trong chẩn đoán bệnh và điều trị cá nhân hóa. Học viên đề cập đến các mô hình học sâu được dùng trong phân tích hình ảnh y tế...
                </div>
                <div className="bg-[#EEF0FF] rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2 mb-1.5"><Sparkles size={13} className="text-[#5B6CF0]" /><span className="text-xs font-bold text-[#5B6CF0]">Nhận xét AI sơ bộ</span></div>
                  <p className="text-xs text-[#1C2448] leading-relaxed">Cấu trúc rõ ràng, lập luận logic. Thiếu dẫn chứng cụ thể ở phần 2. Gợi ý điểm: 78–82.</p>
                </div>
                <div className="mb-3">
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Điểm số (0–100)</label>
                  <input value={grade} onChange={e => setGrade(e.target.value)} className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B6CF0]/20" placeholder="VD: 80" />
                </div>
                <div className="mb-4">
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Nhận xét chi tiết</label>
                  <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B6CF0]/20 resize-none" placeholder="Nhận xét cho học viên..." />
                </div>
                <button
                  onClick={() => {
                    if (!grade) return;
                    setEssays(es => es.map(e => e.id === sel ? { ...e, status: "graded", score: Number(grade) } : e));
                    setSel(null); setGrade(""); setFeedback("");
                  }}
                  disabled={!grade}
                  className="w-full py-2.5 bg-[#1C2448] text-white text-sm font-bold rounded-xl hover:bg-[#2A3560] transition-colors disabled:opacity-40"
                >Xác nhận chấm điểm</button>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-muted-foreground py-20">
                <div><PenTool size={32} className="mx-auto mb-3 opacity-20" /><p className="text-sm">Chọn bài luận để chấm điểm</p></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === "students") {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Theo dõi học viên</h2>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors"><Filter size={13} /> Lọc</button>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors"><Download size={13} /> Xuất</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>{["Học viên", "Tiến độ", "Điểm TB", "Hoạt động cuối", "Bài luận", "Trạng thái"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {STUDENT_PROGRESS.map(s => (
                <tr key={s.id} className="border-t border-border hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Ava initials={s.name.split(" ").slice(-2).map(n => n[0]).join("")} size="sm"
                        color={s.status === "excellent" ? "#10B981" : s.status === "at-risk" ? "#EF4444" : "#5B6CF0"} />
                      <span className="font-semibold text-sm">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Bar2 value={s.progress} h="h-1.5" color={s.progress >= 80 ? "#10B981" : s.progress >= 60 ? "#F59E0B" : "#EF4444"} />
                      <span className="text-xs text-muted-foreground w-8 font-medium">{s.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-sm">{s.score}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.lastActive}</td>
                  <td className="px-4 py-3 text-sm font-medium">{s.essays}</td>
                  <td className="px-4 py-3">
                    <Badge color={s.status === "excellent" ? "green" : s.status === "at-risk" ? "red" : "blue"}>
                      {s.status === "excellent" ? "Xuất sắc" : s.status === "at-risk" ? "Cần chú ý" : "Đúng tiến độ"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (view === "materials") {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Tài liệu lớp học</h2>
            <p className="text-sm text-muted-foreground mt-1">ML-Advanced-2026 · {materials.length} tài liệu</p>
          </div>
          <button onClick={openAddMat} className="flex items-center gap-2 px-4 py-2 bg-[#1C2448] text-white text-sm font-bold rounded-xl hover:bg-[#2A3560] transition-colors">
            <Plus size={14} /> Thêm tài liệu
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {materials.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <FileText size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Chưa có tài liệu nào. Nhấn "Thêm tài liệu" để bắt đầu.</p>
            </div>
          )}
          {materials.map((m, i) => {
            const cfg = MAT_ICON[m.type] ?? MAT_ICON.file;
            return (
              <div key={m.id} className={`flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors group ${i < materials.length - 1 ? "border-b border-border" : ""}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                  <cfg.icon size={17} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{m.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.desc}</p>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs font-mono text-muted-foreground">{m.size}</p>
                  <p className="text-xs text-muted-foreground">{m.added}</p>
                </div>
                <Badge color={m.type === "pdf" ? "red" : m.type === "video" ? "blue" : m.type === "link" ? "yellow" : "green"}>
                  {m.type.toUpperCase()}
                </Badge>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEditMat(m)} className="p-2 text-muted-foreground hover:text-[#5B6CF0] hover:bg-[#EEF0FF] rounded-lg transition-colors" title="Chỉnh sửa"><Edit size={13} /></button>
                  <button onClick={() => setMatConfirm(m.id)} className="p-2 text-muted-foreground hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors" title="Xoá"><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>

        {matModal.open && (
          <Modal title={matModal.mode === "add" ? "Thêm tài liệu mới" : "Chỉnh sửa tài liệu"} onClose={() => setMatModal(m => ({ ...m, open: false }))}>
            <div className="space-y-4">
              <FormField label="Tiêu đề tài liệu">
                <FInput value={matForm.title} onChange={v => setMatForm(f => ({ ...f, title: v }))} placeholder="VD: Slide bài giảng tuần 5" />
              </FormField>
              <FormField label="Loại tài liệu">
                <FSelect value={matForm.type} onChange={v => setMatForm(f => ({ ...f, type: v }))}>
                  <option value="pdf">📄 PDF / Tài liệu</option>
                  <option value="video">🎬 Video</option>
                  <option value="file">📁 File dữ liệu</option>
                  <option value="link">🔗 Liên kết ngoài</option>
                </FSelect>
              </FormField>
              <FormField label={matForm.type === "link" ? "URL liên kết" : "Mô tả / Ghi chú"}>
                <FInput value={matForm.desc} onChange={v => setMatForm(f => ({ ...f, desc: v }))}
                  placeholder={matForm.type === "link" ? "https://..." : "Mô tả nội dung tài liệu..."} />
              </FormField>
              {matForm.type !== "link" && (
                <FormField label="Dung lượng">
                  <FInput value={matForm.size} onChange={v => setMatForm(f => ({ ...f, size: v }))} placeholder="VD: 4.2 MB" />
                </FormField>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setMatModal(m => ({ ...m, open: false }))} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors">Huỷ</button>
                <button onClick={saveMat} className="flex-1 py-2.5 bg-[#1C2448] text-white rounded-xl text-sm font-bold hover:bg-[#2A3560] transition-colors">
                  {matModal.mode === "add" ? "Thêm tài liệu" : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {matConfirm !== null && (
          <ConfirmDialog
            message={`Xoá "${materials.find(m => m.id === matConfirm)?.title}"?`}
            onConfirm={() => deleteMat(matConfirm)}
            onCancel={() => setMatConfirm(null)}
          />
        )}
      </div>
    );
  }

  // Teacher overview
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Tổng quan lớp học</h2>
        <p className="text-sm text-muted-foreground mt-1">ML-Advanced-2026 · 38 học viên đang học</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Học viên"       value="38"  icon={Users}      color="#5B6CF0" />
        <StatCard label="Tiến độ TB"     value="67%" change="+4% tuần qua" icon={TrendingUp} color="#10B981" />
        <StatCard label="Bài luận chờ"  value={String(essays.filter(e => e.status === "pending").length)}   icon={PenTool}    color="#F59E0B" />
        <StatCard label="Cần chú ý"      value="3 HV" icon={AlertCircle} color="#EF4444" />
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-white rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm text-foreground mb-4">Tiến độ & điểm học viên</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart id="chart-teacher-progress" data={STUDENT_PROGRESS.map(s => ({ name: s.name.split(" ").pop(), progress: s.progress, score: s.score }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="progress" fill="#5B6CF0" radius={[4,4,0,0]} name="Tiến độ %" />
              <Bar dataKey="score"    fill="#10B981" radius={[4,4,0,0]} name="Điểm" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm text-foreground mb-4">Học viên cần chú ý</h3>
          {STUDENT_PROGRESS.filter(s => s.status === "at-risk").map(s => (
            <div key={s.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
              <Ava initials={s.name.split(" ").slice(-2).map(n => n[0]).join("")} size="sm" color="#EF4444" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">Tiến độ: {s.progress}%</p>
              </div>
              <Badge color="red">{s.lastActive}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ───────────────────── SME ─────────────────────
type ContentItem = typeof CONTENT_SECTIONS[0];
const EMPTY_CONTENT: ContentItem = { id: 0, title: "", type: "video", meta: "", status: "draft", views: 0 };
const META_PLACEHOLDER: Record<string, string> = { video: "VD: 12:34", document: "VD: 15 trang", quiz: "VD: 20 câu", flashcard: "VD: 45 thẻ", essay: "VD: 1000 từ" };

function SMEView({ view }: { view: string }) {
  const [sections, setSections] = useState<ContentItem[]>(CONTENT_SECTIONS);
  const [modal, setModal] = useState<{ open: boolean; mode: "add" | "edit"; item: ContentItem }>({ open: false, mode: "add", item: EMPTY_CONTENT });
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [form, setForm] = useState<ContentItem>(EMPTY_CONTENT);
  const [smeCourses, setSmeCourses] = useState<any[]>([]);
  const [smeStructure, setSmeStructure] = useState<any>(null);
  const [smeError, setSmeError] = useState("");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentForm, setAssignmentForm] = useState<any>({ id: null, courseId: "", moduleId: "", title: "", instructions: "", rubric: [], maxScore: 100, dueAt: "", status: "draft" });
  const [assignmentEditing, setAssignmentEditing] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [lessons, setLessons] = useState<any[]>([]);
  const [lessonEditing, setLessonEditing] = useState(false);
  const [lessonAiTopic, setLessonAiTopic] = useState("");
  const [lessonAiLoading, setLessonAiLoading] = useState(false);
  const [lessonForm, setLessonForm] = useState<any>({ id: null, courseId: "", title: "", contentType: "document", contentUrl: "", content: "", durationMinutes: 15, orderIndex: 1, isPreview: false, attachments: [] });

  useEffect(() => {
    const token = sessionStorage.getItem("edunexus_token") || localStorage.getItem("edunexus_token");
    if (!token) return;
    fetch(`${API_URL}/sme/courses`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message); return data; })
      .then(setSmeCourses).catch(error => setSmeError(error.message));
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("edunexus_token") || localStorage.getItem("edunexus_token");
    if (!token) return;
    fetch(`${API_URL}/sme-lessons`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(data => Array.isArray(data) && setLessons(data));
  }, []);

  async function generateLesson() {
    const token = sessionStorage.getItem("edunexus_token") || localStorage.getItem("edunexus_token"); setLessonAiLoading(true); setSmeError("");
    try { const response = await fetch(`${API_URL}/sme-lessons/generate`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ topic: lessonAiTopic, audience: "sinh viên", objectives: "hiểu và vận dụng kiến thức" }) }); const data = await response.json(); if (!response.ok) throw new Error(data.message); setLessonForm((form:any) => ({ ...form, title: data.title, content: data.markdownContent, contentType: "document", durationMinutes: data.durationMinutes })); }
    catch (error) { setSmeError(error instanceof Error ? error.message : "Không thể sinh lesson"); } finally { setLessonAiLoading(false); }
  }

  async function extractYoutubeLesson() {
    if (!lessonForm.contentUrl) { setSmeError("Hãy nhập YouTube URL trước"); return; }
    const token = sessionStorage.getItem("edunexus_token") || localStorage.getItem("edunexus_token"); setLessonAiLoading(true); setSmeError("");
    try { const response = await fetch(`${API_URL}/sme-lessons/extract-youtube`, { method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`}, body:JSON.stringify({youtubeUrl:lessonForm.contentUrl,language:"vi"}) }); const data=await response.json(); if(!response.ok) throw new Error(data.message); setLessonForm((form:any)=>({...form,title:data.title,content:data.markdownContent,contentType:"video"})); }
    catch(error){setSmeError(error instanceof Error?error.message:"Không thể lấy transcript");} finally{setLessonAiLoading(false);}
  }

  async function saveLesson() {
    const token = sessionStorage.getItem("edunexus_token") || localStorage.getItem("edunexus_token"); const method = lessonForm.id ? "PUT" : "POST"; const url = lessonForm.id ? `${API_URL}/sme-lessons/${lessonForm.id}` : `${API_URL}/sme-lessons`;
    const payload = { ...lessonForm, courseId: Number(lessonForm.courseId), durationMinutes: Number(lessonForm.durationMinutes), orderIndex: Number(lessonForm.orderIndex), attachments: lessonForm.attachments.filter((file:any) => file.name?.trim() && file.url?.trim()) };
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }); const data = await response.json();
    if (!response.ok) { setSmeError(data.message); return; } setLessons(items => lessonForm.id ? items.map(item => item.id === data.id ? data : item) : [...items, data]); setLessonEditing(false);
  }

  useEffect(() => {
    const token = sessionStorage.getItem("edunexus_token") || localStorage.getItem("edunexus_token");
    if (!token) return;
    fetch(`${API_URL}/assignments`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(data => Array.isArray(data) && setAssignments(data));
  }, []);

  async function generateAssignment() {
    const token = sessionStorage.getItem("edunexus_token") || localStorage.getItem("edunexus_token"); setAiLoading(true); setSmeError("");
    try { const response = await fetch(`${API_URL}/assignments/generate`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ topic: aiTopic, level: "trung cấp" }) }); const data = await response.json(); if (!response.ok) throw new Error(data.message); setAssignmentForm((form: any) => ({ ...form, title: data.title, instructions: data.instructions, rubric: data.rubric, maxScore: 100 })); }
    catch (error) { setSmeError(error instanceof Error ? error.message : "Không thể sinh nội dung"); } finally { setAiLoading(false); }
  }

  async function saveAssignment() {
    const token = sessionStorage.getItem("edunexus_token") || localStorage.getItem("edunexus_token");
    const method = assignmentForm.id ? "PUT" : "POST"; const url = assignmentForm.id ? `${API_URL}/assignments/${assignmentForm.id}` : `${API_URL}/assignments`;
    const payload = { ...assignmentForm, courseId: Number(assignmentForm.courseId), moduleId: assignmentForm.moduleId ? Number(assignmentForm.moduleId) : null, dueAt: assignmentForm.dueAt || null };
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }); const data = await response.json();
    if (!response.ok) { setSmeError(data.message); return; }
    setAssignments(items => assignmentForm.id ? items.map(item => item.id === data.id ? data : item) : [data, ...items]); setAssignmentEditing(false);
  }

  async function openSmeStructure(courseId: number) {
    const token = sessionStorage.getItem("edunexus_token") || localStorage.getItem("edunexus_token");
    const response = await fetch(`${API_URL}/sme/courses/${courseId}/structure`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) { setSmeError(data.message); return; }
    setSmeStructure(data);
  }

  if (view === "lessons") return <div className="p-6 max-w-6xl mx-auto">
    <div className="flex justify-between mb-6"><div><h2 className="text-xl font-bold">Lesson Editor</h2><p className="text-sm text-muted-foreground mt-1">Chỉnh video, Markdown và file đính kèm</p></div><button onClick={() => { setLessonForm({ id:null, courseId:smeCourses[0]?.id ?? "", title:"", contentType:"document", contentUrl:"", content:"", durationMinutes:15, orderIndex:lessons.length+1, isPreview:false, attachments:[] }); setLessonEditing(true); }} className="px-4 py-2 bg-[#1C2448] text-white rounded-xl text-sm font-bold"><Plus size={14} className="inline mr-1"/> Thêm lesson</button></div>
    {smeError && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm">{smeError}</div>}
    <div className="bg-white border border-border rounded-2xl overflow-hidden">{lessons.map(lesson=><button key={lesson.id} onClick={()=>{setLessonForm({...lesson,contentUrl:lesson.contentUrl??"",content:lesson.content??"",attachments:lesson.attachments??[]});setLessonEditing(true);}} className="w-full p-4 flex items-center gap-3 text-left border-b border-border last:border-0 hover:bg-muted/30"><ContentIcon type={lesson.contentType}/><div className="flex-1"><p className="font-semibold text-sm">{lesson.title}</p><p className="text-xs text-muted-foreground mt-1">{lesson.course?.title} · {lesson.contentType} · {lesson.durationMinutes} phút · {lesson.attachments?.length??0} files</p></div><Badge color={lesson.isPreview?"green":"gray"}>{lesson.isPreview?"Preview":"Private"}</Badge><Edit size={14}/></button>)}</div>
    {lessons.length===0&&<div className="py-16 text-center text-sm text-muted-foreground">Chưa có lesson. Nhấn “Thêm lesson” để bắt đầu.</div>}
    {lessonEditing&&<Modal title={lessonForm.id?"Edit Lesson":"AI Lesson Staging"} onClose={()=>setLessonEditing(false)}><div className="space-y-4 max-h-[78vh] overflow-auto pr-1">
      <div className="bg-[#EEF0FF] rounded-xl p-4"><label className="text-xs font-bold">Tạo lesson text bằng Gemini</label><div className="flex gap-2 mt-2"><input value={lessonAiTopic} onChange={e=>setLessonAiTopic(e.target.value)} placeholder="Ví dụ: Neural Network cơ bản" className="flex-1 border rounded-xl px-3 text-sm"/><button onClick={generateLesson} disabled={!lessonAiTopic||lessonAiLoading} className="px-3 py-2 bg-[#5B6CF0] text-white rounded-xl text-xs font-bold disabled:opacity-50">{lessonAiLoading?"Đang tạo...":"Tạo bằng AI"}</button></div><p className="text-xs text-muted-foreground mt-2">AI tạo bản nháp; SME chỉnh sửa trước khi lưu.</p></div>
      <FormField label="Khóa học"><FSelect value={String(lessonForm.courseId)} onChange={v=>setLessonForm((f:any)=>({...f,courseId:v}))}>{smeCourses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</FSelect></FormField>
      <div className="grid grid-cols-2 gap-3"><FormField label="Tiêu đề"><FInput value={lessonForm.title} onChange={v=>setLessonForm((f:any)=>({...f,title:v}))}/></FormField><FormField label="Loại"><FSelect value={lessonForm.contentType} onChange={v=>setLessonForm((f:any)=>({...f,contentType:v}))}><option value="video">Video</option><option value="document">Markdown</option><option value="quiz">Quiz</option><option value="flashcard">Flashcard</option><option value="essay">Essay</option></FSelect></FormField></div>
      <FormField label="Video / Content URL"><FInput value={lessonForm.contentUrl} onChange={v=>setLessonForm((f:any)=>({...f,contentUrl:v}))} placeholder="https://youtube.com/watch?v=..."/></FormField>
      <button onClick={extractYoutubeLesson} disabled={!lessonForm.contentUrl||lessonAiLoading} className="w-full py-2.5 border border-[#5B6CF0] text-[#5B6CF0] rounded-xl text-sm font-bold disabled:opacity-50"><Download size={14} className="inline mr-1"/> Lấy transcript YouTube và tạo lesson summary</button>
      <div className="grid md:grid-cols-2 gap-3"><div><label className="text-xs font-bold">Markdown</label><textarea value={lessonForm.content} onChange={e=>setLessonForm((f:any)=>({...f,content:e.target.value}))} className="mt-2 w-full min-h-64 border border-border rounded-xl p-3 text-sm font-mono"/></div><div><label className="text-xs font-bold">Preview</label><div className="mt-2 min-h-64 border border-border rounded-xl p-4 text-sm whitespace-pre-wrap bg-muted/20">{lessonForm.content||"Markdown preview"}</div></div></div>
      <div><div className="flex justify-between"><label className="text-xs font-bold">Attached files</label><button onClick={()=>setLessonForm((f:any)=>({...f,attachments:[...f.attachments,{name:"",url:""}]}))} className="text-xs font-bold text-[#5B6CF0]">+ Thêm file</button></div>{lessonForm.attachments.map((file:any,index:number)=><div key={index} className="grid grid-cols-[1fr_2fr_32px] gap-2 mt-2"><input value={file.name} onChange={e=>setLessonForm((f:any)=>({...f,attachments:f.attachments.map((x:any,i:number)=>i===index?{...x,name:e.target.value}:x)}))} placeholder="Tên file" className="border rounded-lg p-2 text-xs"/><input value={file.url} onChange={e=>setLessonForm((f:any)=>({...f,attachments:f.attachments.map((x:any,i:number)=>i===index?{...x,url:e.target.value}:x)}))} placeholder="URL file" className="border rounded-lg p-2 text-xs"/><button onClick={()=>setLessonForm((f:any)=>({...f,attachments:f.attachments.filter((_:any,i:number)=>i!==index)}))} className="text-red-500"><X size={14}/></button></div>)}</div>
      <div className="grid grid-cols-3 gap-3"><FormField label="Phút"><input type="number" value={lessonForm.durationMinutes} onChange={e=>setLessonForm((f:any)=>({...f,durationMinutes:e.target.value}))} className="w-full border rounded-xl p-2 text-sm"/></FormField><FormField label="Thứ tự"><input type="number" value={lessonForm.orderIndex} onChange={e=>setLessonForm((f:any)=>({...f,orderIndex:e.target.value}))} className="w-full border rounded-xl p-2 text-sm"/></FormField><FormField label="Preview"><input type="checkbox" checked={lessonForm.isPreview} onChange={e=>setLessonForm((f:any)=>({...f,isPreview:e.target.checked}))} className="mt-3 w-4 h-4"/></FormField></div>
      <button onClick={saveLesson} disabled={!lessonForm.title||!lessonForm.courseId} className="w-full py-2.5 bg-[#1C2448] text-white rounded-xl text-sm font-bold disabled:opacity-50">Lưu lesson</button>
    </div></Modal>}
  </div>;

  if (view === "assignments") return <div className="p-6 max-w-6xl mx-auto">
    <div className="flex justify-between mb-6"><div><h2 className="text-xl font-bold">Assignments</h2><p className="text-sm text-muted-foreground mt-1">Danh sách và rubric bài tập</p></div><button onClick={() => { setAssignmentForm({ id: null, courseId: smeCourses[0]?.id ?? "", moduleId: "", title: "", instructions: "", rubric: [], maxScore: 100, dueAt: "", status: "draft" }); setAssignmentEditing(true); }} className="px-4 py-2 bg-[#1C2448] text-white rounded-xl text-sm font-bold"><Plus size={14} className="inline mr-1" /> Thêm assignment</button></div>
    {smeError && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm">{smeError}</div>}
    <div className="bg-white border border-border rounded-2xl overflow-hidden">{assignments.map(item => <button key={item.id} onClick={() => { setAssignmentForm({ ...item, courseId: item.courseId, moduleId: item.moduleId ?? "", dueAt: item.dueAt ? item.dueAt.slice(0, 10) : "" }); setAssignmentEditing(true); }} className="w-full p-4 flex text-left items-center gap-3 border-b border-border last:border-0 hover:bg-muted/30"><FileText size={18} className="text-[#5B6CF0]" /><div className="flex-1"><p className="font-semibold text-sm">{item.title}</p><p className="text-xs text-muted-foreground mt-1">{item.course?.title} · {item.rubric?.length ?? 0} tiêu chí · {item.maxScore} điểm</p></div><Badge color={item.status === "published" ? "green" : "gray"}>{item.status}</Badge></button>)}</div>
    {assignmentEditing && <Modal title={assignmentForm.id ? "Chi tiết assignment" : "Thêm assignment"} onClose={() => setAssignmentEditing(false)}><div className="space-y-4 max-h-[75vh] overflow-auto pr-1">
      <div className="bg-[#EEF0FF] p-4 rounded-xl"><label className="text-xs font-bold">Sinh nội dung và rubric bằng Gemini</label><div className="flex gap-2 mt-2"><input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="Nhập chủ đề assignment" className="flex-1 border rounded-xl px-3 text-sm" /><button onClick={generateAssignment} disabled={aiLoading || !aiTopic} className="px-3 py-2 bg-[#5B6CF0] text-white rounded-xl text-xs font-bold disabled:opacity-50">{aiLoading ? "Đang sinh..." : "Sinh bằng AI"}</button></div></div>
      <FormField label="Khóa học"><FSelect value={String(assignmentForm.courseId)} onChange={v => setAssignmentForm((f:any) => ({...f,courseId:v,moduleId:""}))}>{smeCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</FSelect></FormField>
      <FormField label="Tiêu đề"><FInput value={assignmentForm.title} onChange={v => setAssignmentForm((f:any)=>({...f,title:v}))} /></FormField>
      <FormField label="Hướng dẫn"><textarea value={assignmentForm.instructions} onChange={e => setAssignmentForm((f:any)=>({...f,instructions:e.target.value}))} className="w-full min-h-28 border border-border rounded-xl p-3 text-sm" /></FormField>
      <div><label className="text-xs font-bold">Rubric</label>{(assignmentForm.rubric ?? []).map((row:any,index:number)=><div key={index} className="grid grid-cols-[1fr_2fr_70px] gap-2 mt-2"><input value={row.criterion} onChange={e=>setAssignmentForm((f:any)=>({...f,rubric:f.rubric.map((r:any,i:number)=>i===index?{...r,criterion:e.target.value}:r)}))} className="border rounded-lg p-2 text-xs" /><input value={row.description} onChange={e=>setAssignmentForm((f:any)=>({...f,rubric:f.rubric.map((r:any,i:number)=>i===index?{...r,description:e.target.value}:r)}))} className="border rounded-lg p-2 text-xs" /><input type="number" value={row.points} onChange={e=>setAssignmentForm((f:any)=>({...f,rubric:f.rubric.map((r:any,i:number)=>i===index?{...r,points:Number(e.target.value)}:r)}))} className="border rounded-lg p-2 text-xs" /></div>)}</div>
      <div className="grid grid-cols-2 gap-3"><FormField label="Hạn nộp"><input type="date" value={assignmentForm.dueAt} onChange={e=>setAssignmentForm((f:any)=>({...f,dueAt:e.target.value}))} className="w-full border rounded-xl p-2 text-sm" /></FormField><FormField label="Trạng thái"><FSelect value={assignmentForm.status} onChange={v=>setAssignmentForm((f:any)=>({...f,status:v}))}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></FSelect></FormField></div>
      <button onClick={saveAssignment} className="w-full py-2.5 bg-[#1C2448] text-white rounded-xl text-sm font-bold">Lưu assignment</button>
    </div></Modal>}
  </div>;

  if (smeStructure) return <div className="p-6 max-w-6xl mx-auto">
    <button onClick={() => setSmeStructure(null)} className="mb-5 flex items-center gap-1 text-sm font-semibold text-[#5B6CF0]"><ArrowLeft size={15} /> Danh sách khóa học</button>
    <div className="bg-white border border-border rounded-2xl p-6 mb-5"><Badge color="blue">{smeStructure.category?.name}</Badge><h2 className="text-2xl font-extrabold mt-3">{smeStructure.title}</h2><p className="text-sm text-muted-foreground mt-2">{smeStructure.description}</p></div>
    <div className="space-y-4">{(smeStructure.modules ?? []).map((module: any) => <div key={module.id} className="bg-white border border-border rounded-2xl overflow-hidden">
      <div className="p-5 bg-muted/40 flex justify-between"><div><h3 className="font-bold">{module.orderIndex}. {module.title}</h3><p className="text-xs text-muted-foreground mt-1">{module.description}</p></div><Badge color={module.status === "published" ? "green" : "gray"}>{module.status}</Badge></div>
      <div className="divide-y divide-border">{(module.contents ?? []).map((content: any) => <div key={content.id} className="p-4 flex items-center gap-3">
        <ContentIcon type={content.type === "lesson" ? "video" : content.type === "question" ? "quiz" : content.type} />
        <div className="flex-1"><p className="text-sm font-semibold">{content.title}</p><p className="text-xs text-muted-foreground mt-0.5">{content.type} · {content.description}</p></div>
        <Badge color={content.status === "published" ? "green" : "gray"}>{content.status}</Badge>
      </div>)}</div>
    </div>)}</div>
  </div>;

  if (view === "dashboard" || view === "content") return <div className="p-6">
    <h2 className="text-xl font-bold">Khóa học SME phụ trách</h2><p className="text-sm text-muted-foreground mt-1 mb-6">{smeCourses.length} khóa học được phân công</p>
    {smeError && <div className="mb-4 bg-red-50 text-red-600 rounded-xl p-3 text-sm">{smeError}</div>}
    <div className="grid md:grid-cols-2 gap-5">{smeCourses.map(course => <div key={course.id} className="bg-white border border-border rounded-2xl p-5">
      <div className="flex justify-between gap-3"><Badge color="blue">{course.category?.name}</Badge><Badge color={course.status === "published" ? "green" : "gray"}>{course.status}</Badge></div>
      <h3 className="font-bold text-lg mt-4">{course.title}</h3><p className="text-xs text-muted-foreground mt-2">{course.modules?.length ?? 0} modules · cập nhật {new Date(course.updatedAt).toLocaleDateString("vi-VN")}</p>
      <button onClick={() => openSmeStructure(course.id)} className="mt-4 w-full py-2.5 bg-[#1C2448] text-white rounded-xl text-sm font-bold">Xem cấu trúc khóa học</button>
    </div>)}</div>
  </div>;

  function openAdd() { setForm({ ...EMPTY_CONTENT, id: Date.now() }); setModal({ open: true, mode: "add", item: EMPTY_CONTENT }); }
  function openEdit(item: ContentItem) { setForm(item); setModal({ open: true, mode: "edit", item }); }
  function closeModal() { setModal(m => ({ ...m, open: false })); }

  function saveContent() {
    if (!form.title.trim()) return;
    if (modal.mode === "add") {
      setSections(s => [...s, { ...form, id: Date.now() }]);
    } else {
      setSections(s => s.map(x => x.id === form.id ? form : x));
    }
    closeModal();
  }

  function deleteContent(id: number) {
    setSections(s => s.filter(x => x.id !== id));
    setConfirmId(null);
  }

  const published = sections.filter(s => s.status === "published").length;

  if (view === "content") {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Nội dung: ML Fundamentals</h2>
            <p className="text-sm text-muted-foreground mt-1">{sections.length} mục · {published} xuất bản · {sections.length - published} chưa xuất bản</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#1C2448] text-white text-sm font-bold rounded-xl hover:bg-[#2A3560] transition-colors">
            <Plus size={14} /> Thêm nội dung
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {sections.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <Layers size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Chưa có nội dung nào. Nhấn "Thêm nội dung" để bắt đầu.</p>
            </div>
          )}
          {sections.map((s, i) => (
            <div key={s.id} className={`flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors group ${i < sections.length - 1 ? "border-b border-border" : ""}`}>
              <span className="text-xs font-mono text-muted-foreground w-5 text-center flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <ContentIcon type={s.type} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.meta}{s.views > 0 ? ` · ${s.views.toLocaleString()} lượt xem` : " · Chưa xuất bản"}</p>
              </div>
              <Badge color={s.status === "published" ? "green" : s.status === "draft" ? "gray" : "yellow"}>
                {s.status === "published" ? "Đã xuất bản" : s.status === "draft" ? "Bản nháp" : "Chờ duyệt"}
              </Badge>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(s)} className="p-2 text-muted-foreground hover:text-[#5B6CF0] hover:bg-[#EEF0FF] rounded-lg transition-colors" title="Chỉnh sửa"><Edit size={13} /></button>
                <button onClick={() => setConfirmId(s.id)} className="p-2 text-muted-foreground hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors" title="Xoá"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>

        {modal.open && (
          <Modal title={modal.mode === "add" ? "Thêm nội dung mới" : "Chỉnh sửa nội dung"} onClose={closeModal}>
            <div className="space-y-4">
              <FormField label="Tiêu đề">
                <FInput value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="VD: Giới thiệu Machine Learning" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Loại nội dung">
                  <FSelect value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))}>
                    <option value="video">🎬 Video bài giảng</option>
                    <option value="document">📄 Tài liệu</option>
                    <option value="quiz">✅ Bài kiểm tra</option>
                    <option value="flashcard">🔁 Flashcard</option>
                    <option value="essay">✍️ Bài luận</option>
                  </FSelect>
                </FormField>
                <FormField label="Thời lượng / Số lượng">
                  <FInput value={form.meta} onChange={v => setForm(f => ({ ...f, meta: v }))} placeholder={META_PLACEHOLDER[form.type] ?? ""} />
                </FormField>
              </div>
              <FormField label="Trạng thái">
                <FSelect value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))}>
                  <option value="draft">Bản nháp</option>
                  <option value="review">Chờ duyệt</option>
                  <option value="published">Đã xuất bản</option>
                </FSelect>
              </FormField>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors">Huỷ</button>
                <button onClick={saveContent} className="flex-1 py-2.5 bg-[#1C2448] text-white rounded-xl text-sm font-bold hover:bg-[#2A3560] transition-colors">
                  {modal.mode === "add" ? "Thêm nội dung" : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {confirmId !== null && (
          <ConfirmDialog
            message={`Xoá "${sections.find(s => s.id === confirmId)?.title}"? Hành động này không thể hoàn tác.`}
            onConfirm={() => deleteContent(confirmId)}
            onCancel={() => setConfirmId(null)}
          />
        )}
      </div>
    );
  }

  // SME overview
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Không gian soạn thảo</h2>
        <p className="text-sm text-muted-foreground mt-1">2 khóa học được phân công</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Bài giảng"  value={String(sections.filter(s => s.type === "video").length + 45)} change="+3 tháng này" icon={Film}       color="#5B6CF0" />
        <StatCard label="Câu hỏi"    value="240" icon={HelpCircle} color="#F59E0B" />
        <StatCard label="Flashcard"  value="180" change="+45 mới"  icon={Repeat}   color="#10B981" />
        <StatCard label="Bài luận"   value={String(sections.filter(s => s.type === "essay").length + 11)} icon={PenTool} color="#8B5CF6" />
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm mb-4">Khóa học được phân công</h3>
          {COURSES.slice(0, 2).map(c => (
            <div key={c.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
              <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                <img src={`https://images.unsplash.com/${c.image}?w=60&h=60&fit=crop&auto=format`} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.lessons} bài · {c.students.toLocaleString()} HV đang học</p>
              </div>
              <button className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl hover:bg-muted transition-colors">Mở</button>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm">Cần xử lý ({sections.filter(s => s.status === "draft" || s.status === "review").length})</h3>
          </div>
          {sections.filter(s => s.status !== "published").slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
              <ContentIcon type={item.type} />
              <p className="flex-1 text-xs font-medium text-foreground leading-relaxed truncate">{item.title}</p>
              <Badge color={item.status === "review" ? "yellow" : "gray"}>{item.status === "review" ? "Chờ duyệt" : "Nháp"}</Badge>
            </div>
          ))}
          {sections.filter(s => s.status !== "published").length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Tất cả nội dung đã được xuất bản ✓</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────── MANAGER ─────────────────────
type ClassItem = { id: number; name: string; course: string; students: number; capacity: number; start: string; status: string };
type PlanItem = { id: number; name: string; price: string; color: string; students: number; features: string[] };

const INIT_CLASSES: ClassItem[] = [
  { id: 1, name: "ML-Advanced-2026-A",     course: "Machine Learning Fundamentals", students: 38, capacity: 50, start: "01/06/2026", status: "active"   },
  { id: 2, name: "ML-Fundamentals-2026-B", course: "Machine Learning Fundamentals", students: 52, capacity: 60, start: "15/06/2026", status: "active"   },
  { id: 3, name: "React-Pro-2026-A",       course: "React & TypeScript Mastery",    students: 29, capacity: 40, start: "20/07/2026", status: "upcoming" },
];

const INIT_PLANS: PlanItem[] = [
  { id: 1, name: "Cơ bản",      price: "299,000",  color: "#5B6CF0", students: 1240, features: ["5 khóa học", "Flashcard cơ bản", "Chứng chỉ hoàn thành"] },
  { id: 2, name: "Pro",         price: "599,000",  color: "#10B981", students: 845,  features: ["Không giới hạn khóa học", "AI Flashcard & Quiz", "Hỗ trợ ưu tiên", "Chấm bài luận AI"] },
  { id: 3, name: "Doanh nghiệp",price: "Liên hệ",  color: "#F59E0B", students: 120,  features: ["Tất cả tính năng Pro", "Quản lý nhóm", "Báo cáo nội bộ", "API tích hợp"] },
];

const EMPTY_CLASS: ClassItem = { id: 0, name: "", course: "", students: 0, capacity: 40, start: "", status: "upcoming" };

function ManagerView({ view }: { view: string }) {
  const [classes, setClasses] = useState<ClassItem[]>(INIT_CLASSES);
  const [classModal, setClassModal] = useState<{ open: boolean; mode: "add"|"edit"; item: ClassItem }>({ open: false, mode: "add", item: EMPTY_CLASS });
  const [classForm, setClassForm] = useState<ClassItem>(EMPTY_CLASS);
  const [classConfirm, setClassConfirm] = useState<number | null>(null);

  const [plans, setPlans] = useState<PlanItem[]>(INIT_PLANS);
  const [planModal, setPlanModal] = useState<{ open: boolean; item: PlanItem | null }>({ open: false, item: null });
  const [planForm, setPlanForm] = useState<PlanItem>({ id: 0, name: "", price: "", color: "#5B6CF0", students: 0, features: [] });
  const [featuresText, setFeaturesText] = useState("");

  function openAddClass() { setClassForm({ ...EMPTY_CLASS, id: Date.now() }); setClassModal({ open: true, mode: "add", item: EMPTY_CLASS }); }
  function openEditClass(c: ClassItem) { setClassForm(c); setClassModal({ open: true, mode: "edit", item: c }); }
  function saveClass() {
    if (!classForm.name.trim()) return;
    if (classModal.mode === "add") setClasses(cs => [...cs, classForm]);
    else setClasses(cs => cs.map(c => c.id === classForm.id ? classForm : c));
    setClassModal(m => ({ ...m, open: false }));
  }
  function deleteClass(id: number) { setClasses(cs => cs.filter(c => c.id !== id)); setClassConfirm(null); }

  function openEditPlan(p: PlanItem) { setPlanForm(p); setFeaturesText(p.features.join("\n")); setPlanModal({ open: true, item: p }); }
  function savePlan() {
    const updated = { ...planForm, features: featuresText.split("\n").map(f => f.trim()).filter(Boolean) };
    setPlans(ps => ps.map(p => p.id === updated.id ? updated : p));
    setPlanModal({ open: false, item: null });
  }

  const classesView = (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Quản lý lớp học</h2>
          <p className="text-sm text-muted-foreground mt-1">{classes.length} lớp · {classes.filter(c => c.status === "active").length} đang hoạt động</p>
        </div>
        <button onClick={openAddClass} className="flex items-center gap-2 px-4 py-2 bg-[#1C2448] text-white text-sm font-bold rounded-xl hover:bg-[#2A3560] transition-colors">
          <Plus size={14} /> Tạo lớp học
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>{["Tên lớp", "Khóa học", "Học viên", "Sĩ số tối đa", "Khai giảng", "Trạng thái", ""].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {classes.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">Chưa có lớp học nào.</td></tr>
            )}
            {classes.map(cls => (
              <tr key={cls.id} className="border-t border-border hover:bg-muted/40 transition-colors">
                <td className="px-4 py-3 font-semibold text-foreground">{cls.name}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-36 truncate">{cls.course}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{cls.students}</span>
                    <div className="w-16">
                      <Bar2 value={(cls.students / cls.capacity) * 100} h="h-1" color={cls.students / cls.capacity > 0.8 ? "#EF4444" : "#5B6CF0"} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-medium">{cls.capacity}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{cls.start}</td>
                <td className="px-4 py-3">
                  <Badge color={cls.status === "active" ? "green" : cls.status === "upcoming" ? "yellow" : "gray"}>
                    {cls.status === "active" ? "Đang học" : cls.status === "upcoming" ? "Sắp khai giảng" : "Đã kết thúc"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEditClass(cls)} className="p-1.5 text-muted-foreground hover:text-[#5B6CF0] hover:bg-[#EEF0FF] rounded-lg transition-colors"><Edit size={13} /></button>
                    <button onClick={() => setClassConfirm(cls.id)} className="p-1.5 text-muted-foreground hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {classModal.open && (
        <Modal title={classModal.mode === "add" ? "Tạo lớp học mới" : "Chỉnh sửa lớp học"} onClose={() => setClassModal(m => ({ ...m, open: false }))}>
          <div className="space-y-4">
            <FormField label="Tên lớp học">
              <FInput value={classForm.name} onChange={v => setClassForm(f => ({ ...f, name: v }))} placeholder="VD: ML-Advanced-2026-C" />
            </FormField>
            <FormField label="Khóa học">
              <FSelect value={classForm.course} onChange={v => setClassForm(f => ({ ...f, course: v }))}>
                {COURSES.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
              </FSelect>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Sĩ số tối đa">
                <FInput type="number" value={String(classForm.capacity)} onChange={v => setClassForm(f => ({ ...f, capacity: Number(v) }))} placeholder="40" />
              </FormField>
              <FormField label="Ngày khai giảng">
                <FInput value={classForm.start} onChange={v => setClassForm(f => ({ ...f, start: v }))} placeholder="DD/MM/YYYY" />
              </FormField>
            </div>
            <FormField label="Trạng thái">
              <FSelect value={classForm.status} onChange={v => setClassForm(f => ({ ...f, status: v }))}>
                <option value="upcoming">Sắp khai giảng</option>
                <option value="active">Đang học</option>
                <option value="ended">Đã kết thúc</option>
              </FSelect>
            </FormField>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setClassModal(m => ({ ...m, open: false }))} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors">Huỷ</button>
              <button onClick={saveClass} className="flex-1 py-2.5 bg-[#1C2448] text-white rounded-xl text-sm font-bold hover:bg-[#2A3560] transition-colors">
                {classModal.mode === "add" ? "Tạo lớp học" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {classConfirm !== null && (
        <ConfirmDialog
          message={`Xoá lớp "${classes.find(c => c.id === classConfirm)?.name}"? Tất cả dữ liệu học viên trong lớp này sẽ bị xoá.`}
          onConfirm={() => deleteClass(classConfirm)}
          onCancel={() => setClassConfirm(null)}
        />
      )}
    </div>
  );

  const subsView = (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Gói đăng ký</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {plans.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-border p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{p.name}</h3>
              <Badge color="gray">{p.students} HV</Badge>
            </div>
            <div className="text-2xl font-extrabold mb-1" style={{ color: p.color }}>{p.price}{p.price !== "Liên hệ" ? " đ/tháng" : ""}</div>
            <ul className="space-y-2 mb-5 flex-1 mt-3">
              {p.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <CheckCircle2 size={13} style={{ color: p.color }} className="flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            <button onClick={() => openEditPlan(p)} className="w-full py-2.5 text-sm font-bold rounded-xl border border-border hover:bg-muted transition-colors flex items-center justify-center gap-2">
              <Edit size={13} /> Chỉnh sửa gói
            </button>
          </div>
        ))}
      </div>

      {planModal.open && planModal.item && (
        <Modal title={`Chỉnh sửa gói: ${planModal.item.name}`} onClose={() => setPlanModal({ open: false, item: null })}>
          <div className="space-y-4">
            <FormField label="Tên gói">
              <FInput value={planForm.name} onChange={v => setPlanForm(f => ({ ...f, name: v }))} />
            </FormField>
            <FormField label="Giá (để trống = Liên hệ)">
              <div className="relative">
                <FInput value={planForm.price === "Liên hệ" ? "" : planForm.price} onChange={v => setPlanForm(f => ({ ...f, price: v || "Liên hệ" }))} placeholder="VD: 299,000" />
                {planForm.price !== "Liên hệ" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">đ/tháng</span>}
              </div>
            </FormField>
            <FormField label="Màu nhận diện">
              <div className="flex gap-2">
                {["#5B6CF0","#10B981","#F59E0B","#EF4444","#8B5CF6"].map(c => (
                  <button key={c} onClick={() => setPlanForm(f => ({ ...f, color: c }))}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{ backgroundColor: c, borderColor: planForm.color === c ? "#1C2448" : "transparent" }} />
                ))}
              </div>
            </FormField>
            <FormField label="Tính năng (mỗi dòng một tính năng)">
              <textarea value={featuresText} onChange={e => setFeaturesText(e.target.value)} rows={5}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B6CF0]/20 focus:border-[#5B6CF0] transition-all resize-none" />
            </FormField>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setPlanModal({ open: false, item: null })} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors">Huỷ</button>
              <button onClick={savePlan} className="flex-1 py-2.5 bg-[#1C2448] text-white rounded-xl text-sm font-bold hover:bg-[#2A3560] transition-colors">Lưu thay đổi</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );

  if (view === "revenue") {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">Phân tích doanh thu</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Doanh thu T6/26"  value="94M đ"  change="+12% vs T5"    icon={DollarSign} color="#10B981" />
          <StatCard label="Đăng ký mới"       value="215 HV" change="+17"           icon={Users}      color="#5B6CF0" />
          <StatCard label="Tỷ lệ hoàn tiền"  value="1.2%"                          icon={RefreshCw}  color="#F59E0B" />
          <StatCard label="ARPU"              value="437K đ" change="+5%"           icon={TrendingUp} color="#8B5CF6" />
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 bg-white rounded-2xl border border-border p-5">
            <h3 className="font-bold text-sm mb-4">Doanh thu & Đăng ký 6 tháng (triệu đồng)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart id="chart-mgr-revenue" data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="grad-manager-revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5B6CF0" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#5B6CF0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#5B6CF0" fill="url(#grad-manager-revenue)" strokeWidth={2.5} name="Doanh thu (M)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-bold text-sm mb-4">Theo danh mục</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart id="chart-mgr-pie">
                <Pie data={CATEGORY_DATA} cx="50%" cy="50%" outerRadius={60} dataKey="value">
                  {CATEGORY_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {CATEGORY_DATA.map(c => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />{c.name}</div>
                  <span className="font-bold">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "subscriptions") return subsView;
  if (view === "classes") return classesView;

  // Manager overview
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Nhóm khóa học: AI & Technology</h2>
        <p className="text-sm text-muted-foreground mt-1">{classes.length} lớp · {classes.filter(c => c.status === "active").length} đang hoạt động</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Tổng doanh thu"    value="487M đ" change="+18% QoQ"      icon={DollarSign} color="#10B981" />
        <StatCard label="Học viên đăng ký"  value="2,205"  change="+215 tháng này" icon={Users}      color="#5B6CF0" />
        <StatCard label="Lớp hoạt động"     value={String(classes.filter(c => c.status === "active").length)} icon={BookOpen} color="#F59E0B" />
        <StatCard label="Gói đang bán"      value={String(plans.length)}           icon={Package}    color="#8B5CF6" />
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm mb-4">Doanh thu theo tháng</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart id="chart-mgr-overview" data={REVENUE_DATA}>
              <defs>
                <linearGradient id="grad-manager-overview" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="url(#grad-manager-overview)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm">Lớp học ({classes.length})</h3>
            <button onClick={openAddClass} className="flex items-center gap-1 text-xs font-bold text-[#5B6CF0] hover:underline"><Plus size={11} /> Tạo lớp</button>
          </div>
          {classes.map(cls => (
            <div key={cls.id} className="flex items-center justify-between py-3 border-b border-border last:border-0 group">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{cls.name}</p>
                <p className="text-xs text-muted-foreground">{cls.students}/{cls.capacity} HV · {cls.start}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge color={cls.status === "active" ? "green" : "yellow"}>
                  {cls.status === "active" ? "Đang học" : "Sắp khai giảng"}
                </Badge>
                <button onClick={() => openEditClass(cls)} className="p-1 text-muted-foreground hover:text-[#5B6CF0] rounded opacity-0 group-hover:opacity-100 transition-all"><Edit size={12} /></button>
                <button onClick={() => setClassConfirm(cls.id)} className="p-1 text-muted-foreground hover:text-[#EF4444] rounded opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {classModal.open && (
        <Modal title={classModal.mode === "add" ? "Tạo lớp học mới" : "Chỉnh sửa lớp học"} onClose={() => setClassModal(m => ({ ...m, open: false }))}>
          <div className="space-y-4">
            <FormField label="Tên lớp học">
              <FInput value={classForm.name} onChange={v => setClassForm(f => ({ ...f, name: v }))} placeholder="VD: ML-Advanced-2026-C" />
            </FormField>
            <FormField label="Khóa học">
              <FSelect value={classForm.course} onChange={v => setClassForm(f => ({ ...f, course: v }))}>
                {COURSES.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
              </FSelect>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Sĩ số tối đa">
                <FInput type="number" value={String(classForm.capacity)} onChange={v => setClassForm(f => ({ ...f, capacity: Number(v) }))} placeholder="40" />
              </FormField>
              <FormField label="Ngày khai giảng">
                <FInput value={classForm.start} onChange={v => setClassForm(f => ({ ...f, start: v }))} placeholder="DD/MM/YYYY" />
              </FormField>
            </div>
            <FormField label="Trạng thái">
              <FSelect value={classForm.status} onChange={v => setClassForm(f => ({ ...f, status: v }))}>
                <option value="upcoming">Sắp khai giảng</option>
                <option value="active">Đang học</option>
                <option value="ended">Đã kết thúc</option>
              </FSelect>
            </FormField>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setClassModal(m => ({ ...m, open: false }))} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors">Huỷ</button>
              <button onClick={saveClass} className="flex-1 py-2.5 bg-[#1C2448] text-white rounded-xl text-sm font-bold hover:bg-[#2A3560] transition-colors">
                {classModal.mode === "add" ? "Tạo lớp học" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {classConfirm !== null && (
        <ConfirmDialog
          message={`Xoá lớp "${classes.find(c => c.id === classConfirm)?.name}"?`}
          onConfirm={() => deleteClass(classConfirm)}
          onCancel={() => setClassConfirm(null)}
        />
      )}
    </div>
  );
}

// ───────────────────── ADMIN ─────────────────────
type UserItem = typeof USERS[0];
const ROLE_COLORS: Record<string, string> = { Student: "blue", Teacher: "green", SME: "yellow", Manager: "purple", Admin: "red" };
const ROLE_HEX: Record<string, string> = { Student: "#5B6CF0", Teacher: "#10B981", SME: "#F59E0B", Manager: "#8B5CF6", Admin: "#EF4444" };
const EMPTY_USER: UserItem = { id: 0, name: "", email: "", role: "Student", status: "active", joined: "", courses: 0, avatar: "" };

function AdminView({ view }: { view: string }) {
  const [users, setUsers] = useState<UserItem[]>(USERS);
  const [filterRole, setFilterRole] = useState("All");
  const [modal, setModal] = useState<{ open: boolean; mode: "add"|"edit"; item: UserItem }>({ open: false, mode: "add", item: EMPTY_USER });
  const [form, setForm] = useState<UserItem>(EMPTY_USER);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [formErr, setFormErr] = useState<Record<string, string>>({});

  function openAdd() { setForm({ ...EMPTY_USER, id: Date.now() }); setFormErr({}); setModal({ open: true, mode: "add", item: EMPTY_USER }); }
  function openEdit(u: UserItem) { setForm(u); setFormErr({}); setModal({ open: true, mode: "edit", item: u }); }
  function closeModal() { setModal(m => ({ ...m, open: false })); }

  function saveUser() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Họ tên không được để trống";
    if (!form.email.includes("@")) errs.email = "Email không hợp lệ";
    if (Object.keys(errs).length) { setFormErr(errs); return; }
    const initials = form.name.split(" ").slice(-2).map(n => n[0]).join("").toUpperCase();
    const today = new Date().toLocaleDateString("vi-VN");
    if (modal.mode === "add") setUsers(us => [...us, { ...form, avatar: initials, joined: form.joined || today }]);
    else setUsers(us => us.map(u => u.id === form.id ? { ...form, avatar: initials } : u));
    closeModal();
  }

  function deleteUser(id: number) { setUsers(us => us.filter(u => u.id !== id)); setConfirmId(null); }

  const filtered = filterRole === "All" ? users : users.filter(u => u.role === filterRole);

  if (view === "users") {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Quản lý tài khoản</h2>
            <p className="text-sm text-muted-foreground mt-1">{users.length} người dùng · {users.filter(u => u.status === "active").length} hoạt động</p>
          </div>
          <div className="flex gap-2">
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-border rounded-xl text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#5B6CF0]/20 cursor-pointer">
              <option value="All">Tất cả vai trò</option>
              {["Student","Teacher","SME","Manager","Admin"].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#1C2448] text-white text-sm font-bold rounded-xl hover:bg-[#2A3560] transition-colors">
              <Plus size={14} /> Thêm tài khoản
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>{["Người dùng", "Vai trò", "Trạng thái", "Ngày tham gia", "KH", "Hành động"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">Không tìm thấy tài khoản nào.</td></tr>
              )}
              {filtered.map(u => (
                <tr key={u.id} className="border-t border-border hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Ava initials={u.avatar || u.name.split(" ").slice(-2).map(n => n[0]).join("")} size="sm" color={ROLE_HEX[u.role] ?? "#5B6CF0"} />
                      <div>
                        <p className="font-semibold text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge color={ROLE_COLORS[u.role] ?? "default"}>{u.role}</Badge></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setUsers(us => us.map(x => x.id === u.id ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x))}>
                      <Badge color={u.status === "active" ? "green" : "gray"}>{u.status === "active" ? "Hoạt động" : "Không HĐ"}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.joined}</td>
                  <td className="px-4 py-3 font-semibold">{u.courses}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-muted-foreground hover:text-[#5B6CF0] hover:bg-[#EEF0FF] rounded-lg transition-colors" title="Chỉnh sửa"><Edit size={12} /></button>
                      <button onClick={() => setConfirmId(u.id)} className="p-1.5 text-muted-foreground hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors" title="Xoá"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {modal.open && (
          <Modal title={modal.mode === "add" ? "Thêm tài khoản mới" : "Chỉnh sửa tài khoản"} onClose={closeModal}>
            <div className="space-y-4">
              <FormField label="Họ và tên" error={formErr.name}>
                <FInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Nguyễn Văn A" />
              </FormField>
              <FormField label="Email" error={formErr.email}>
                <FInput type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="name@edunexus.vn" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Vai trò">
                  <FSelect value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))}>
                    {["Student","Teacher","SME","Manager","Admin"].map(r => <option key={r} value={r}>{r}</option>)}
                  </FSelect>
                </FormField>
                <FormField label="Trạng thái">
                  <FSelect value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))}>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </FSelect>
                </FormField>
              </div>
              <FormField label="Khóa học đã tham gia">
                <FInput type="number" value={String(form.courses)} onChange={v => setForm(f => ({ ...f, courses: Number(v) }))} placeholder="0" />
              </FormField>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors">Huỷ</button>
                <button onClick={saveUser} className="flex-1 py-2.5 bg-[#1C2448] text-white rounded-xl text-sm font-bold hover:bg-[#2A3560] transition-colors">
                  {modal.mode === "add" ? "Thêm tài khoản" : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {confirmId !== null && (
          <ConfirmDialog
            message={`Xoá tài khoản "${users.find(u => u.id === confirmId)?.name}"? Hành động này không thể hoàn tác.`}
            onConfirm={() => deleteUser(confirmId)}
            onCancel={() => setConfirmId(null)}
          />
        )}
      </div>
    );
  }

  if (view === "reports") {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">Báo cáo hệ thống</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Tổng người dùng"    value="58,241" change="+1,205"  icon={Users}      color="#5B6CF0" />
          <StatCard label="Doanh thu tháng"     value="94M đ"  change="+12%"   icon={DollarSign} color="#10B981" />
          <StatCard label="Khóa học hoạt động" value="240"    change="+8 mới"  icon={BookOpen}   color="#F59E0B" />
          <StatCard label="Yêu cầu hoàn tiền"  value="7"      icon={RefreshCw} color="#EF4444"  />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-bold text-sm mb-4">Đăng ký & Doanh thu 6 tháng</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart id="chart-admin-line" data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="enrollments" stroke="#5B6CF0" strokeWidth={2.5} dot={{ r: 4 }} name="Đăng ký" />
                <Line type="monotone" dataKey="revenue"     stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} name="Doanh thu (M)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-bold text-sm mb-4">Phân bố danh mục khóa học</h3>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart id="chart-admin-pie">
                <Pie data={CATEGORY_DATA} cx="50%" cy="50%" outerRadius={65} dataKey="value">
                  {CATEGORY_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-1">
              {CATEGORY_DATA.map(c => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />{c.name} {c.value}%
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin overview
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Quản trị hệ thống EduNexus</h2>
        <p className="text-sm text-muted-foreground mt-1">Cập nhật lúc 09:35 · 22/06/2026</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Tổng người dùng"    value="58,241" change="+1,205"   icon={Users}      color="#5B6CF0" />
        <StatCard label="Doanh thu T6/26"    value="94M đ"  change="+12%"     icon={DollarSign} color="#10B981" />
        <StatCard label="Khóa học"           value="240"    change="+8 mới"   icon={BookOpen}   color="#F59E0B" />
        <StatCard label="Sự cố hệ thống"     value="0"                         icon={Shield}     color="#10B981" />
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-white rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm mb-4">Hoạt động 6 tháng</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart id="chart-admin-overview" data={REVENUE_DATA}>
              <defs>
                <linearGradient id="grad-admin-enroll" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B6CF0" stopOpacity={0.15} /><stop offset="100%" stopColor="#5B6CF0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-admin-revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.15} /><stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="enrollments" stroke="#5B6CF0" fill="url(#grad-admin-enroll)" strokeWidth={2} name="Đăng ký mới" />
              <Area type="monotone" dataKey="revenue"     stroke="#10B981" fill="url(#grad-admin-revenue)" strokeWidth={2} name="Doanh thu (M)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wide mb-3">Phân bố người dùng</h3>
            {[
              { role: "Student", count: 55820, color: "#5B6CF0" },
              { role: "Teacher", count: 318,   color: "#10B981" },
              { role: "SME",     count: 84,    color: "#F59E0B" },
              { role: "Manager", count: 19,    color: "#8B5CF6" },
            ].map(r => (
              <div key={r.role} className="flex items-center gap-2 mb-2 last:mb-0">
                <span className="text-xs text-muted-foreground w-14 font-medium">{r.role}</span>
                <div className="flex-1 bg-muted rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${(r.count / 58241) * 100}%`, backgroundColor: r.color }} />
                </div>
                <span className="text-xs font-bold w-14 text-right">{r.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#ECFDF5] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={15} className="text-[#10B981]" />
              <span className="text-sm font-bold text-[#1C2448]">Hệ thống ổn định</span>
            </div>
            <p className="text-xs text-muted-foreground">Uptime: 99.97% · Latency: 42ms · DB: OK</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-4">
            <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wide mb-3">Hoàn tiền chờ xử lý</h3>
            {[
              { user: "Nguyễn T. Hải", amount: "990,000đ", reason: "Không phù hợp" },
              { user: "Lê Văn Bình",   amount: "750,000đ", reason: "Lỗi thanh toán" },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-xs font-semibold">{r.user}</p>
                  <p className="text-xs text-muted-foreground">{r.reason}</p>
                </div>
                <span className="text-xs font-bold text-[#EF4444]">{r.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────── AUTH SCREENS ─────────────────────

const DEMO_ACCOUNTS: { role: Role; label: string; email: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; color: string; desc: string }[] = [
  { role: "student", label: "Học viên",      email: "student@edunexus.vn", icon: GraduationCap, color: "#5B6CF0", desc: "Học & luyện tập" },
  { role: "teacher", label: "Giảng viên",    email: "teacher@edunexus.vn", icon: BookOpen,      color: "#10B981", desc: "Quản lý lớp học" },
  { role: "sme",     label: "Chuyên gia ND", email: "sme@edunexus.vn",     icon: BookMarked,    color: "#F59E0B", desc: "Soạn thảo nội dung" },
  { role: "manager", label: "Quản lý KH",    email: "manager@edunexus.vn", icon: Briefcase,     color: "#8B5CF6", desc: "Doanh thu & lớp học" },
  { role: "admin",   label: "Admin",          email: "admin@edunexus.vn",   icon: UserCog,       color: "#EF4444", desc: "Toàn quyền hệ thống" },
];

function AuthLeft() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-10 h-full" style={{ background: "linear-gradient(145deg, #1C2448 0%, #2D3870 60%, #1a3a5c 100%)" }}>
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-[#5B6CF0] flex items-center justify-center">
          <Sparkles size={17} className="text-white" />
        </div>
        <span className="font-extrabold text-white text-xl tracking-tight">EduNexus</span>
      </div>

      {/* Feature highlights */}
      <div className="space-y-5">
        <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
          Nền tảng học tập<br />thông minh nhất<br /><span style={{ color: "#A5B4FC" }}>Việt Nam</span>
        </h2>
        <div className="space-y-3">
          {[
            { icon: Brain,      text: "AI cá nhân hóa lộ trình học tập",      color: "#A5B4FC" },
            { icon: Zap,        text: "Chấm điểm bài luận tự động trong 5 giây", color: "#6EE7B7" },
            { icon: Target,     text: "Flashcard thông minh với spaced repetition",color: "#FCD34D" },
            { icon: BarChart3,  text: "Báo cáo tiến độ chi tiết theo thời gian thực", color: "#F9A8D4" },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${f.color}18` }}>
                <f.icon size={14} style={{ color: f.color }} />
              </div>
              <span className="text-sm text-white/75 font-medium">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[["58K+", "Học viên"], ["240+", "Khóa học"], ["4.8★", "Đánh giá"]].map(([v, l]) => (
          <div key={l} className="bg-white/8 rounded-2xl p-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
            <div className="text-lg font-extrabold text-white">{v}</div>
            <div className="text-xs text-white/50 font-medium mt-0.5">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoginPage({ onLogin, onGoRegister, onBack }: {
  onLogin: (r: Role) => void; onGoRegister: () => void; onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"form" | "demo">("form");
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "685335819825-bm9cg5kepjnvkn0obit93m2qm7e2qv47.apps.googleusercontent.com";

  useEffect(() => {
    const clientId = googleClientId;
    if (!clientId) return;
    const initialize = () => {
      const google = (window as any).google;
      if (!google || !googleButtonRef.current) return;
      google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }: { credential: string }) => {
        setLoading(true);
        try {
          const response = await fetch(`${API_URL}/auth/google`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || "Google Login thất bại");
          const storage = remember ? localStorage : sessionStorage;
          storage.setItem("edunexus_token", data.token);
          storage.setItem("edunexus_user", JSON.stringify(data.user));
          onLogin(getAuthenticatedRole(data.user));
        } catch (err) { setError(err instanceof Error ? err.message : "Google Login thất bại"); }
        finally { setLoading(false); }
      },
      });
      googleButtonRef.current.innerHTML = "";
      google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard", theme: "outline", size: "large",
        text: "signin_with", shape: "rectangular", width: 350,
      });
    };
    if ((window as any).google) { initialize(); return; }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = initialize;
    document.head.appendChild(script);
  }, [googleClientId, remember, onLogin]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Vui lòng nhập đầy đủ thông tin."); return; }
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Đăng nhập thất bại");
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("edunexus_token", data.token);
      storage.setItem("edunexus_user", JSON.stringify(data.user));
      (remember ? sessionStorage : localStorage).removeItem("edunexus_token");
      (remember ? sessionStorage : localStorage).removeItem("edunexus_user");
      onLogin(getAuthenticatedRole(data.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  }

  function handleDemoLogin(role: Role) {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(role); }, 800);
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 sm:px-12 bg-white">
        {/* Back */}
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 w-fit">
          <ArrowLeft size={15} /> Trang chủ
        </button>

        <div className="max-w-sm w-full mx-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-[#1C2448] flex items-center justify-center"><Sparkles size={15} className="text-white" /></div>
            <span className="font-extrabold text-[#1C2448] text-lg">EduNexus</span>
          </div>

          <h1 className="text-2xl font-extrabold text-[#1C2448] mb-1 tracking-tight">Chào mừng trở lại</h1>
          <p className="text-sm text-muted-foreground mb-7">Đăng nhập để tiếp tục hành trình học tập</p>

          {/* Tab switcher */}
          <div className="flex rounded-xl bg-muted p-1 mb-6">
            <button onClick={() => setTab("form")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tab === "form" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>Đăng nhập</button>
            <button onClick={() => setTab("demo")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tab === "demo" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>Demo vai trò</button>
          </div>

          {tab === "demo" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium mb-3">Chọn vai trò để khám phá giao diện:</p>
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.role}
                  onClick={() => handleDemoLogin(acc.role)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-transparent hover:shadow-md transition-all text-left group"
                  style={{ ["--hover-bg" as string]: `${acc.color}08` }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${acc.color}08`)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${acc.color}15` }}>
                    <acc.icon size={17} style={{ color: acc.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{acc.label}</p>
                    <p className="text-xs text-muted-foreground">{acc.desc}</p>
                  </div>
                  <ChevronRight size={15} className="text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-2 uppercase tracking-wide">Đăng nhập với tư cách</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {DEMO_ACCOUNTS.map(acc => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => { setSelectedRole(acc.role); setEmail(acc.email); }}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-semibold transition-all ${selectedRole === acc.role ? "border-transparent text-white shadow-md" : "border-border text-muted-foreground hover:border-border"}`}
                      style={selectedRole === acc.role ? { backgroundColor: acc.color, borderColor: acc.color } : {}}
                    >
                      <acc.icon size={14} />
                      <span className="leading-none text-center" style={{ fontSize: "9px" }}>{acc.label.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="name@edunexus.vn"
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B6CF0]/25 focus:border-[#5B6CF0] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Mật khẩu</label>
                  <button type="button" className="text-xs font-semibold text-[#5B6CF0] hover:underline">Quên mật khẩu?</button>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B6CF0]/25 focus:border-[#5B6CF0] transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <div className="flex items-center gap-2">
                <input id="remember" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded border-border accent-[#5B6CF0]" />
                <label htmlFor="remember" className="text-xs text-muted-foreground font-medium cursor-pointer">Ghi nhớ đăng nhập</label>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-[#FEF2F2] rounded-xl text-xs text-[#EF4444] font-medium">
                  <AlertCircle size={13} /> {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
                style={{ backgroundColor: DEMO_ACCOUNTS.find(a => a.role === selectedRole)?.color ?? "#5B6CF0", boxShadow: `0 8px 24px ${DEMO_ACCOUNTS.find(a => a.role === selectedRole)?.color ?? "#5B6CF0"}40` }}
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang đăng nhập...</>
                ) : "Đăng nhập"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium">hoặc tiếp tục với</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Social */}
              {googleClientId ? (
                <div ref={googleButtonRef} className="flex min-h-11 w-full items-center justify-center overflow-hidden rounded-xl" />
              ) : (
                <button type="button" onClick={() => setError("Thiếu VITE_GOOGLE_CLIENT_ID trong FE/.env")}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors">
                  <span className="font-extrabold text-sm text-[#EA4335]">G</span> Google
                </button>
              )}
            </form>
          )}

          <p className="text-xs text-center text-muted-foreground mt-6 font-medium">
            Chưa có tài khoản?{" "}
            <button onClick={onGoRegister} className="font-bold text-[#5B6CF0] hover:underline">Đăng ký miễn phí</button>
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="hidden lg:block w-1/2">
        <AuthLeft />
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 border border-border">
            <div className="w-12 h-12 rounded-2xl bg-[#5B6CF0] flex items-center justify-center">
              <Sparkles size={22} className="text-white" />
            </div>
            <div className="space-y-1 text-center">
              <p className="font-bold text-foreground text-sm">Đang đăng nhập...</p>
              <p className="text-xs text-muted-foreground">Vui lòng chờ trong giây lát</p>
            </div>
            <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-[#5B6CF0] rounded-full animate-[loading_1.2s_ease-in-out_forwards]" style={{ width: "100%", transform: "translateX(-100%)", animation: "slide 1.2s ease-out forwards" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RegisterPage({ onLogin, onGoLogin, onBack }: {
  onLogin: (r: Role) => void; onGoLogin: () => void; onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [accountType, setAccountType] = useState<"student" | "internal">("student");
  const [internalRole, setInternalRole] = useState<Role>("teacher");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<1 | 2>(1);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Vui lòng nhập họ tên";
    if (!email.includes("@")) e.email = "Email không hợp lệ";
    if (password.length < 8) e.password = "Mật khẩu tối thiểu 8 ký tự";
    if (password !== confirm) e.confirm = "Mật khẩu không khớp";
    if (!agreed) e.agreed = "Bạn cần đồng ý với điều khoản";
    return e;
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(accountType === "student" ? "student" : internalRole); }, 1400);
  }

  const strengthScore = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const strengthLabel = ["", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"][strengthScore];
  const strengthColor = ["", "#EF4444", "#F59E0B", "#10B981", "#5B6CF0"][strengthScore];

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Left visual */}
      <div className="hidden lg:block w-1/2">
        <AuthLeft />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 sm:px-12 bg-white overflow-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 w-fit">
          <ArrowLeft size={15} /> Trang chủ
        </button>

        <div className="max-w-sm w-full mx-auto">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-[#1C2448] flex items-center justify-center"><Sparkles size={15} className="text-white" /></div>
            <span className="font-extrabold text-[#1C2448] text-lg">EduNexus</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${step >= s ? "bg-[#5B6CF0] text-white" : "bg-muted text-muted-foreground"}`}>
                  {step > s ? <Check size={13} /> : s}
                </div>
                {s < 2 && <div className={`h-px w-8 transition-all ${step > s ? "bg-[#5B6CF0]" : "bg-border"}`} />}
              </div>
            ))}
            <span className="text-xs text-muted-foreground font-medium ml-2">{step === 1 ? "Loại tài khoản" : "Thông tin cá nhân"}</span>
          </div>

          <h1 className="text-2xl font-extrabold text-[#1C2448] mb-1 tracking-tight">Tạo tài khoản</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {step === 1 ? "Chọn loại tài khoản phù hợp với bạn" : "Điền thông tin để hoàn tất đăng ký"}
          </p>

          <form onSubmit={handleNext} className="space-y-4">
            {step === 1 ? (
              <>
                {/* Account type */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setAccountType("student")}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${accountType === "student" ? "border-[#5B6CF0] bg-[#EEF0FF]" : "border-border hover:border-[#5B6CF0]/40"}`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${accountType === "student" ? "bg-[#5B6CF0]" : "bg-muted"}`}>
                      <GraduationCap size={20} className={accountType === "student" ? "text-white" : "text-muted-foreground"} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-foreground">Học viên</p>
                        <Badge color="blue">Miễn phí</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Đăng ký khóa học, học flashcard, làm bài kiểm tra</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${accountType === "student" ? "border-[#5B6CF0] bg-[#5B6CF0]" : "border-border"}`}>
                      {accountType === "student" && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType("internal")}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${accountType === "internal" ? "border-[#1C2448] bg-[#F0F2FA]" : "border-border hover:border-[#1C2448]/40"}`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${accountType === "internal" ? "bg-[#1C2448]" : "bg-muted"}`}>
                      <Briefcase size={20} className={accountType === "internal" ? "text-white" : "text-muted-foreground"} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-foreground">Tài khoản nội bộ</p>
                        <Badge color="gray">Cần duyệt</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Giảng viên, chuyên gia nội dung, quản lý khóa học</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${accountType === "internal" ? "border-[#1C2448] bg-[#1C2448]" : "border-border"}`}>
                      {accountType === "internal" && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                </div>

                {/* Internal role picker */}
                {accountType === "internal" && (
                  <div className="bg-[#F8F9FD] rounded-2xl p-4 space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Vai trò đề nghị</p>
                    {DEMO_ACCOUNTS.filter(a => a.role !== "student" && a.role !== "admin").map(acc => (
                      <button
                        key={acc.role}
                        type="button"
                        onClick={() => setInternalRole(acc.role)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${internalRole === acc.role ? "border-transparent" : "border-transparent hover:bg-white"}`}
                        style={internalRole === acc.role ? { backgroundColor: `${acc.color}12`, borderColor: `${acc.color}30` } : {}}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${acc.color}18` }}>
                          <acc.icon size={14} style={{ color: acc.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-foreground">{acc.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{acc.desc}</span>
                        </div>
                        {internalRole === acc.role && <CheckCircle2 size={15} style={{ color: acc.color }} />}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Full name */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">Họ và tên</label>
                  <div className="relative">
                    <UserIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A"
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B6CF0]/25 focus:border-[#5B6CF0] transition-all" />
                  </div>
                  {errors.name && <p className="text-xs text-[#EF4444] mt-1 font-medium">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B6CF0]/25 focus:border-[#5B6CF0] transition-all" />
                  </div>
                  {errors.email && <p className="text-xs text-[#EF4444] mt-1 font-medium">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự"
                      className="w-full pl-10 pr-11 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B6CF0]/25 focus:border-[#5B6CF0] transition-all" />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{ backgroundColor: i <= strengthScore ? strengthColor : "#E5E7EB" }} />
                        ))}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: strengthColor }}>{strengthLabel}</span>
                    </div>
                  )}
                  {errors.password && <p className="text-xs text-[#EF4444] mt-1 font-medium">{errors.password}</p>}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPw ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Nhập lại mật khẩu"
                      className="w-full pl-10 pr-11 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B6CF0]/25 focus:border-[#5B6CF0] transition-all" />
                    {confirm && password === confirm && <CheckCircle2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#10B981]" />}
                  </div>
                  {errors.confirm && <p className="text-xs text-[#EF4444] mt-1 font-medium">{errors.confirm}</p>}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2.5">
                  <input id="terms" type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-border accent-[#5B6CF0] flex-shrink-0" />
                  <label htmlFor="terms" className="text-xs text-muted-foreground font-medium cursor-pointer leading-relaxed">
                    Tôi đồng ý với <button type="button" className="text-[#5B6CF0] font-bold hover:underline">Điều khoản sử dụng</button> và <button type="button" className="text-[#5B6CF0] font-bold hover:underline">Chính sách bảo mật</button> của EduNexus
                  </label>
                </div>
                {errors.agreed && <p className="text-xs text-[#EF4444] font-medium">{errors.agreed}</p>}
              </>
            )}

            <div className="flex gap-3 pt-1">
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-xl font-bold text-sm border border-border hover:bg-muted transition-colors flex items-center justify-center gap-2">
                  <ChevronLeft size={15} /> Quay lại
                </button>
              )}
              <button
                type="submit" disabled={loading}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
                style={{ backgroundColor: "#1C2448", boxShadow: "0 8px 24px rgba(28,36,72,0.25)" }}
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang tạo tài khoản...</>
                ) : step === 1 ? "Tiếp tục" : "Tạo tài khoản"}
              </button>
            </div>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6 font-medium">
            Đã có tài khoản?{" "}
            <button onClick={onGoLogin} className="font-bold text-[#5B6CF0] hover:underline">Đăng nhập</button>
          </p>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 border border-border">
            <div className="w-12 h-12 rounded-2xl bg-[#5B6CF0] flex items-center justify-center">
              <Sparkles size={22} className="text-white" />
            </div>
            <div className="space-y-1 text-center">
              <p className="font-bold text-foreground text-sm">Đang tạo tài khoản...</p>
              <p className="text-xs text-muted-foreground">Vui lòng chờ trong giây lát</p>
            </div>
            <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-[#5B6CF0] rounded-full" style={{ width: "70%" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────── MAIN APP ─────────────────────
type Screen = "landing" | "login" | "register" | "app";

export default function App() {
  const getStoredToken = () => sessionStorage.getItem("edunexus_token") || localStorage.getItem("edunexus_token");
  const getStoredUser = (): AuthUser | null => {
    const raw = sessionStorage.getItem("edunexus_user") || localStorage.getItem("edunexus_user");
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  };
  const initialUser = getStoredUser();
  const [screen, setScreen] = useState<Screen>(() => getStoredToken() && initialUser ? "app" : "landing");
  const [role, setRole] = useState<Role>(() => {
    try { return initialUser ? getAuthenticatedRole(initialUser) : "student"; } catch { return "student"; }
  });
  const [authUser, setAuthUser] = useState<AuthUser | null>(initialUser);
  const [view, setView] = useState(() => localStorage.getItem("edunexus_view") || sessionStorage.getItem("edunexus_view") || "dashboard");

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        if (!response.ok) throw new Error("Phiên đăng nhập đã hết hạn");
        const user = await response.json();
        setAuthUser(user);
        setRole(getAuthenticatedRole(user));
        const storage = localStorage.getItem("edunexus_token") ? localStorage : sessionStorage;
        storage.setItem("edunexus_user", JSON.stringify(user));
      })
      .catch(() => {
        localStorage.removeItem("edunexus_token"); localStorage.removeItem("edunexus_user"); localStorage.removeItem("edunexus_view");
        sessionStorage.removeItem("edunexus_token"); sessionStorage.removeItem("edunexus_user"); sessionStorage.removeItem("edunexus_view");
        setAuthUser(null); setScreen("login");
      });
  }, []);

  useEffect(() => {
    if (screen !== "app") return;
    const storage = localStorage.getItem("edunexus_token") ? localStorage : sessionStorage;
    storage.setItem("edunexus_view", view);
  }, [screen, view]);

  function loginAs(r: Role) {
    const rawUser = sessionStorage.getItem("edunexus_user") || localStorage.getItem("edunexus_user");
    try { setAuthUser(rawUser ? JSON.parse(rawUser) : null); } catch { setAuthUser(null); }
    setRole(r);
    setView(localStorage.getItem("edunexus_view") || sessionStorage.getItem("edunexus_view") || "dashboard");
    setScreen("app");
  }

  function changeRole(r: Role) {
    if (r === "guest") { setScreen("landing"); return; }
    setRole(r);
    setView("dashboard");
  }

  if (screen === "landing") return (
    <LandingPage
      onLogin={() => setScreen("login")}
    />
  );
  if (screen === "login") return (
    <LoginPage
      onLogin={loginAs}
      onGoRegister={() => setScreen("register")}
      onBack={() => setScreen("landing")}
    />
  );
  if (screen === "register") return (
    <RegisterPage
      onLogin={loginAs}
      onGoLogin={() => setScreen("login")}
      onBack={() => setScreen("landing")}
    />
  );

  if (screen !== "app") return null;

  const renderContent = () => {
    switch (role) {
      case "student": return <StudentView  view={view} />;
      case "teacher": return <TeacherView  view={view} />;
      case "sme":     return <SMEView     view={view} />;
      case "manager": return <ManagerView view={view} />;
      case "admin":   return <AdminView   view={view} />;
      default:        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar role={role} user={authUser} currentView={view} onNavigate={setView} onHome={() => setScreen("landing")} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar role={role} onRoleChange={(r) => { if (r === "guest") setScreen("landing"); else changeRole(r); }} onLogout={() => {
          localStorage.removeItem("edunexus_token"); localStorage.removeItem("edunexus_user");
          localStorage.removeItem("edunexus_view");
          sessionStorage.removeItem("edunexus_token"); sessionStorage.removeItem("edunexus_user"); sessionStorage.removeItem("edunexus_view");
          setAuthUser(null); setScreen("login");
        }} />
        <main className="flex-1 overflow-auto" style={{ backgroundColor: "#F8F9FD" }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
