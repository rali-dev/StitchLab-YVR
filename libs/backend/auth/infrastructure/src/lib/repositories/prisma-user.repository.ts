import { Injectable } from '@nestjs/common';
import {
  UserEntity,
  type IUserRepository,
} from '@stitchlab-yvr/backend-auth-domain';
import {
  Prisma,
  PrismaService,
  type User,
} from '@stitchlab-yvr/backend-shared-database';
import {
  ResourceConflictException,
  type Role,
} from '@stitchlab-yvr/shared-contracts';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

/**
 * Prisma-Implementierung des Nutzer-Ports.
 *
 * Wie beim Product-Repository gilt: Prisma hängt an der Domäne, nicht umgekehrt.
 */
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });

    return row ? PrismaUserRepository.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    // Die Adresse kommt bereits kleingeschrieben aus dem `Email`-Value-Object -
    // das Value Object ist die einzige Stelle, die normalisiert, damit Suche und
    // Speicherung garantiert dieselbe Schreibweise verwenden.
    const row = await this.prisma.user.findUnique({ where: { email } });

    return row ? PrismaUserRepository.toEntity(row) : null;
  }

  async save(user: UserEntity): Promise<UserEntity> {
    const snapshot = user.toSnapshot();

    try {
      const row = await this.prisma.user.upsert({
        where: { id: snapshot.id },
        create: {
          id: snapshot.id,
          email: snapshot.email,
          hashedPassword: snapshot.hashedPassword,
          hashedRefreshToken: snapshot.hashedRefreshToken,
          role: snapshot.role,
          createdAt: snapshot.createdAt,
        },
        update: {
          email: snapshot.email,
          hashedPassword: snapshot.hashedPassword,
          // Auch `null` muss geschrieben werden - das ist der Logout.
          hashedRefreshToken: snapshot.hashedRefreshToken,
          role: snapshot.role,
        },
      });

      return PrismaUserRepository.toEntity(row);
    } catch (error) {
      // Der Unique-Index auf `email` ist die letzte Instanz: Zwei gleichzeitige
      // Registrierungen mit derselben Adresse überholen die Vorabprüfung im
      // Handler, hier nicht.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new ResourceConflictException(
          'an account with this email already exists.',
        );
      }

      throw error;
    }
  }

  private static toEntity(row: User): UserEntity {
    return UserEntity.restore({
      id: row.id,
      email: row.email,
      hashedPassword: row.hashedPassword,
      hashedRefreshToken: row.hashedRefreshToken,
      // Prisma erzeugt einen eigenen Enum-Typ mit denselben Werten wie unser
      // `Role` in shared-contracts - beide stammen aus demselben Schema.
      role: row.role as Role,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
