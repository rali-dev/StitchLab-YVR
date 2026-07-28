import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Email,
  PASSWORD_HASHER,
  USER_REPOSITORY,
  UserEntity,
  type IPasswordHasher,
  type IUserRepository,
} from '@stitchlab-yvr/backend-auth-domain';
import {
  ResourceConflictException,
  type UserDto,
} from '@stitchlab-yvr/shared-contracts';
import { toUserDto } from '../../mappers/user.mapper.js';
import { RegisterCommand } from './register.command.js';

@CommandHandler(RegisterCommand)
export class RegisterHandler
  implements ICommandHandler<RegisterCommand, UserDto>
{
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
  ) {}

  async execute(command: RegisterCommand): Promise<UserDto> {
    // Über das Value Object normalisieren, BEVOR gesucht wird: sonst würde
    // `Anna@Example.com` als frei gelten, obwohl `anna@example.com` existiert -
    // und der Unique-Index der Datenbank würde den Fehler erst beim Speichern
    // melden, mit einer viel schlechteren Meldung.
    const email = Email.create(command.email).toString();

    if (await this.users.findByEmail(email)) {
      // Bewusste Abwägung: Diese Meldung verrät, dass die Adresse vergeben ist.
      // Das ist bei einer Registrierung kaum vermeidbar - die Alternative wäre,
      // Erfolg vorzutäuschen und per E-Mail zu informieren, was ohne
      // Mail-Versand nicht geht. Der LOGIN verrät dagegen nichts (siehe dort).
      throw new ResourceConflictException(
        'an account with this email already exists.',
      );
    }

    const user = UserEntity.register({
      email: command.email,
      hashedPassword: await this.hasher.hash(command.password),
    });

    return toUserDto(await this.users.save(user));
  }
}
