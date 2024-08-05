import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AuthDto, SignupDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(payload: SignupDto) {
    try {
      const passwordHash = await bcrypt.hash(payload.password, 3);
      const user = await this.prisma.user.create({
        data: {
          email: payload.email,
          password: passwordHash,
          organizationId: payload.organizationId,
        },
      });
      return await this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code == 'P2002') {
          throw new ForbiddenException('Credentials invalid');
        }
      }
      throw error;
    }
  }

  async signin(payload: AuthDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: payload.email,
        },
      });
      if (!user) throw new ForbiddenException('Credentials incorrect');
      const pwMatches = await bcrypt.compare(payload.password, user.password);

      if (!pwMatches) {
        throw new ForbiddenException('Credentials incorrect');
      }
      return this.signToken(user.id, user.email);
    } catch (error) {
      throw error;
    }
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const secret = this.config.get('JWT_SECRET');
    const payload = { sub: userId, email };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: secret,
    });

    return { access_token: token };
  }
}
