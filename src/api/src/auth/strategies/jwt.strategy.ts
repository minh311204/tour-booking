import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PrismaService } from '../../prisma/prima.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required')
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
    })
  }

  async validate(payload: any) {
    const userId = Number(payload?.sub)
    const jti: string | undefined = payload?.jti

    if (!userId) throw new UnauthorizedException()
    if (jti) {
      const blacklisted = await this.prisma.blacklistedAccessToken.findFirst({
        where: {
          userId,
          jti,
          expiredDateTimeUtc: { gt: new Date() },
        },
      })

      if (blacklisted) {
        throw new UnauthorizedException()
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) throw new UnauthorizedException()

    return {
      ...user,
      jti,
    }
  }
}