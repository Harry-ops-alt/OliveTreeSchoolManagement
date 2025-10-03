export const GENDER_VALUES = ['MALE', 'FEMALE', 'NON_BINARY', 'UNSPECIFIED'] as const;
export type GenderValue = (typeof GENDER_VALUES)[number];

export const STUDENT_STATUS_VALUES = [
  'PROSPECT',
  'APPLIED',
  'ENROLLED',
  'INACTIVE',
  'GRADUATED',
  'WITHDRAWN',
  'ARCHIVED',
] as const;
export type StudentStatusValue = (typeof STUDENT_STATUS_VALUES)[number];

export const DEFAULT_STUDENT_PAGE_SIZE = 25;
export const MAX_STUDENT_PAGE_SIZE = 100;
