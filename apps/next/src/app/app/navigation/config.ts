import type { LucideIcon } from 'lucide-react';
import {
  BarChart,
  BookOpen,
  Briefcase,
  Calendar,
  CalendarCheck,
  Globe,
  Folder,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Share2,
  Users,
  UserPlus,
  Wallet,
} from 'lucide-react';

export type Role =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'OPERATIONS_MANAGER'
  | 'BRANCH_MANAGER'
  | 'ADMISSIONS_OFFICER'
  | 'FINANCE_MANAGER'
  | 'FINANCE_OFFICER'
  | 'TEACHER'
  | 'TEACHING_ASSISTANT'
  | 'TRAINER'
  | 'TRAINEE'
  | 'SUPPORT_STAFF'
  | 'PARENT_GUARDIAN'
  | 'STUDENT';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navigationGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/app',
        icon: LayoutDashboard,
        roles: [
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'OPERATIONS_MANAGER',
          'BRANCH_MANAGER',
          'ADMISSIONS_OFFICER',
          'FINANCE_MANAGER',
          'FINANCE_OFFICER',
          'TEACHER',
          'TEACHING_ASSISTANT',
          'TRAINER',
          'TRAINEE',
          'SUPPORT_STAFF',
          'PARENT_GUARDIAN',
          'STUDENT',
        ],
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Admissions',
        href: '/app/admissions',
        icon: UserPlus,
        roles: [
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'OPERATIONS_MANAGER',
          'BRANCH_MANAGER',
          'ADMISSIONS_OFFICER',
        ],
      },
      {
        label: 'Students',
        href: '/app/students',
        icon: Users,
        roles: [
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'OPERATIONS_MANAGER',
          'BRANCH_MANAGER',
          'TEACHER',
          'TEACHING_ASSISTANT',
          'SUPPORT_STAFF',
        ],
      },
      {
        label: 'Classes & Timetable',
        href: '/app/classes',
        icon: Calendar,
        roles: [
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'OPERATIONS_MANAGER',
          'BRANCH_MANAGER',
          'TEACHER',
          'TEACHING_ASSISTANT',
          'SUPPORT_STAFF',
        ],
      },
      {
        label: 'Teachers & Staff',
        href: '/app/staff',
        icon: Briefcase,
        roles: [
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'OPERATIONS_MANAGER',
          'BRANCH_MANAGER',
        ],
      },
      {
        label: 'Attendance',
        href: '/app/attendance',
        icon: CalendarCheck,
        roles: [
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'OPERATIONS_MANAGER',
          'BRANCH_MANAGER',
          'TEACHER',
          'TEACHING_ASSISTANT',
          'SUPPORT_STAFF',
        ],
      },
      {
        label: 'Finance',
        href: '/app/finance',
        icon: Wallet,
        roles: [
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'FINANCE_MANAGER',
          'FINANCE_OFFICER',
        ],
      },
    ],
  },
  {
    label: 'Learning',
    items: [
      {
        label: 'LMS',
        href: '/app/lms',
        icon: BookOpen,
        roles: [
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'OPERATIONS_MANAGER',
          'BRANCH_MANAGER',
          'TEACHER',
          'TEACHING_ASSISTANT',
          'STUDENT',
          'PARENT_GUARDIAN',
        ],
      },
      {
        label: 'Teacher Training',
        href: '/app/training',
        icon: GraduationCap,
        roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TRAINER', 'TRAINEE'],
      },
    ],
  },
  {
    label: 'Growth',
    items: [
      {
        label: 'Website',
        href: '/app/website',
        icon: Globe,
        roles: [
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'OPERATIONS_MANAGER',
          'BRANCH_MANAGER',
        ],
      },
      {
        label: 'Referrals & Marketing',
        href: '/app/marketing',
        icon: Share2,
        roles: [
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'OPERATIONS_MANAGER',
          'BRANCH_MANAGER',
        ],
      },
      {
        label: 'Reports & Analytics',
        href: '/app/reports',
        icon: BarChart,
        roles: [
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'OPERATIONS_MANAGER',
          'BRANCH_MANAGER',
          'FINANCE_MANAGER',
          'FINANCE_OFFICER',
        ],
      },
      {
        label: 'Messages & Communication',
        href: '/app/messages',
        icon: MessageSquare,
        roles: [
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'OPERATIONS_MANAGER',
          'BRANCH_MANAGER',
          'TEACHER',
          'TEACHING_ASSISTANT',
          'SUPPORT_STAFF',
        ],
      },
      {
        label: 'Documents & Resources',
        href: '/app/documents',
        icon: Folder,
        roles: [
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'OPERATIONS_MANAGER',
          'BRANCH_MANAGER',
          'TEACHER',
          'TEACHING_ASSISTANT',
          'SUPPORT_STAFF',
        ],
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'Settings & Admin',
        href: '/app/settings',
        icon: Settings,
        roles: [
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'OPERATIONS_MANAGER',
          'BRANCH_MANAGER',
        ],
      },
    ],
  },
];
