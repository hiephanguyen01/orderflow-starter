import { Injectable, OnModuleInit } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';

@Injectable()
export class PasswordService implements OnModuleInit {
  private dummyPasswordHash = '';

  async onModuleInit(): Promise<void> {
    this.dummyPasswordHash = await this.hash(randomUUID());
  }

  hash(plainText: string): Promise<string> {
    return argon2.hash(plainText, {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
  }

  async verify(passwordHash: string, plainText: string): Promise<boolean> {
    try {
      return await argon2.verify(passwordHash, plainText);
    } catch {
      return false;
    }
  }

  verifyWithFallback(passwordHash: string | null, plainText: string): Promise<boolean> {
    return this.verify(passwordHash ?? this.dummyPasswordHash, plainText);
  }
}
