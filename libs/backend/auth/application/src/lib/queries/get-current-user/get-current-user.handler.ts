import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '@stitchlab-yvr/backend-auth-domain';
import {
  ResourceNotFoundException,
  type UserDto,
} from '@stitchlab-yvr/shared-contracts';
import { toUserDto } from '../../mappers/user.mapper.js';
import { GetCurrentUserQuery } from './get-current-user.query.js';

@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserHandler
  implements IQueryHandler<GetCurrentUserQuery, UserDto>
{
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(query: GetCurrentUserQuery): Promise<UserDto> {
    const user = await this.users.findById(query.userId);

    // Der Fall ist selten, aber real: gültiges Token, Konto zwischenzeitlich
    // gelöscht. Dann existiert der Nutzer aus dem Token nicht mehr.
    if (!user) {
      throw new ResourceNotFoundException('user does not exist.');
    }

    return toUserDto(user);
  }
}
