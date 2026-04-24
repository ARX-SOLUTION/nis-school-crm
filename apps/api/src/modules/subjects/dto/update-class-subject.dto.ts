import { OmitType, PartialType } from '@nestjs/swagger';
import { AssignSubjectDto } from './assign-subject.dto';

/**
 * To change the subject on a class assignment, delete the row and create a new one.
 * All other fields (teacherId, hoursPerWeek, academicYear) are optional updates.
 */
export class UpdateClassSubjectDto extends PartialType(
  OmitType(AssignSubjectDto, ['subjectId'] as const),
) {}
