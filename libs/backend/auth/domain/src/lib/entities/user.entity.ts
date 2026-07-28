import { DomainException, Role } from '@stitchlab-yvr/shared-contracts';
import { Email } from '../value-objects/email.value-object.js';

/**
 * Flache Sicht auf einen Nutzer - die Form, in der er die Domäne Richtung
 * Datenbank verlässt und aus ihr zurückkehrt.
 *
 * `hashedPassword` und `hashedRefreshToken` sind Hashes, keine Geheimnisse im
 * Klartext. Trotzdem verlassen sie den Server nie (siehe `UserDto`).
 */
export interface UserSnapshot {
  id: string;
  email: string;
  hashedPassword: string;
  hashedRefreshToken: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Der Nutzer - Aggregatwurzel der Auth-Domäne.
 *
 * Diese Entity kennt **kein bcrypt und kein JWT**. Sie bekommt bereits gehashte
 * Werte gereicht und weiß nur, dass es Hashes sind. Das Hashen selbst ist ein
 * technisches Verfahren, das sich ändern kann (bcrypt → argon2), ohne dass sich
 * an der Fachlichkeit "ein Nutzer hat ein Passwort" etwas ändert - deshalb liegt
 * es hinter einem Port (`IPasswordHasher`) und nicht hier.
 *
 * Wie `ProductEntity` unveränderlich: Änderungen liefern eine neue Instanz.
 */
export class UserEntity {
  private constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly hashedPassword: string,
    public readonly hashedRefreshToken: string | null,
    public readonly role: Role,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Neues Konto. `hashedPassword` ist bereits gehasht - ein Klartext-Passwort
   * darf gar nicht erst bis hierher kommen.
   */
  static register(props: {
    email: string;
    hashedPassword: string;
    role?: Role;
  }): UserEntity {
    if (!props.hashedPassword || props.hashedPassword.trim().length === 0) {
      throw new DomainException('hashedPassword must not be empty.');
    }

    const now = new Date();

    return new UserEntity(
      crypto.randomUUID(),
      Email.create(props.email),
      props.hashedPassword,
      // Ein frisch registriertes Konto hat noch keine Sitzung.
      null,
      props.role ?? Role.USER,
      now,
      now,
    );
  }

  static restore(snapshot: UserSnapshot): UserEntity {
    return new UserEntity(
      snapshot.id,
      Email.create(snapshot.email),
      snapshot.hashedPassword,
      snapshot.hashedRefreshToken,
      snapshot.role,
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }

  /**
   * Merkt sich den Hash des zuletzt ausgegebenen Refresh-Tokens.
   *
   * Gespeichert wird der **Hash**, nicht das Token: Wer die Datenbank liest,
   * kann damit keine Sitzung übernehmen. Und weil bei jedem Refresh ein neues
   * Token ausgegeben wird, entwertet dieser Schritt zugleich das vorherige.
   */
  withRefreshToken(hashedRefreshToken: string): UserEntity {
    if (!hashedRefreshToken || hashedRefreshToken.trim().length === 0) {
      throw new DomainException('hashedRefreshToken must not be empty.');
    }

    return new UserEntity(
      this.id,
      this.email,
      this.hashedPassword,
      hashedRefreshToken,
      this.role,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Beendet die Sitzung serverseitig. Danach ist jedes noch kursierende
   * Refresh-Token wertlos - der Abgleich in der Datenbank schlägt fehl.
   */
  withoutRefreshToken(): UserEntity {
    return new UserEntity(
      this.id,
      this.email,
      this.hashedPassword,
      null,
      this.role,
      this.createdAt,
      new Date(),
    );
  }

  /** `true`, wenn der Nutzer eine aktive Sitzung hat (Logout setzt das zurück). */
  hasActiveSession(): boolean {
    return this.hashedRefreshToken !== null;
  }

  isAdmin(): boolean {
    return this.role === Role.ADMIN;
  }

  toSnapshot(): UserSnapshot {
    return {
      id: this.id,
      email: this.email.toString(),
      hashedPassword: this.hashedPassword,
      hashedRefreshToken: this.hashedRefreshToken,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
