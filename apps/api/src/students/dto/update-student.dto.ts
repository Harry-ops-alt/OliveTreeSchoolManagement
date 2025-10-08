import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  GENDER_VALUES,
  STUDENT_STATUS_VALUES,
  GenderValue,
  StudentStatusValue,
} from '../students.constants';
import { GuardianLinkDto, InlineGuardianDto } from './create-student.dto';

export class UpdateGuardianLinkDto implements Partial<GuardianLinkDto> {
  @IsOptional()
  @IsUUID()
  linkId?: string;

  @IsOptional()
  @IsUUID()
  guardianId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  relationship?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateInlineGuardianDto implements Partial<InlineGuardianDto> {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsPhoneNumber('NG', { message: 'phone must be a valid Nigerian number' })
  phone?: string;

  @IsOptional()
  @IsPhoneNumber('NG', {
    message: 'alternatePhone must be a valid Nigerian number',
  })
  alternatePhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @IsOptional()
  @IsString()
  @Length(3, 12)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  relationship?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  classroomId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  studentNumber?: string;

  @IsOptional()
  @IsDateString()
  dateJoined?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsPhoneNumber('NG', { message: 'phone must be a valid Nigerian number' })
  phone?: string;

  @IsOptional()
  @IsPhoneNumber('NG', {
    message: 'alternatePhone must be a valid Nigerian number',
  })
  alternatePhone?: string;

  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;

  @IsOptional()
  @IsIn(STUDENT_STATUS_VALUES)
  status?: StudentStatusValue;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsIn(GENDER_VALUES)
  gender?: GenderValue;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  gradeLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  homeroom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  primaryLanguage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  additionalSupportNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  medicalNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @IsOptional()
  @IsString()
  @Length(3, 12)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateGuardianLinkDto)
  @IsArray()
  @ArrayMaxSize(5)
  guardians?: UpdateGuardianLinkDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateInlineGuardianDto)
  @IsArray()
  @ArrayMaxSize(5)
  inlineGuardians?: UpdateInlineGuardianDto[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  classScheduleIds?: string[];

  @IsOptional()
  @IsBoolean()
  archive?: boolean;

  @IsOptional()
  @IsDateString()
  archivedAt?: string;
}
