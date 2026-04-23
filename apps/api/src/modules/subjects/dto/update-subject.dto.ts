import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateSubjectDto } from './create-subject.dto';

/**
 * Subject code is immutable after creation — consumers must delete and re-create
 * to change a code. All other fields are optional partial updates.
 */
export class UpdateSubjectDto extends PartialType(OmitType(CreateSubjectDto, ['code'] as const)) {}
