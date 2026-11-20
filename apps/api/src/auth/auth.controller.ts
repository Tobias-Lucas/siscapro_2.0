import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { AuthGuard } from '../common/auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';

class LoginDto { @IsString() identifier!: string; @IsString() @MinLength(1) password!: string; }
class ChangePasswordDto { @IsString() currentPassword!: string; @IsString() @MinLength(10) newPassword!: string; }

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post('login') async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto.identifier, dto.password, req.ip);
    res.cookie('proativa_session', result.token, { httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true', maxAge: 8 * 60 * 60 * 1000, path: '/' });
    return { user: result.user };
  }
  @Post('logout') logout(@Res({ passthrough: true }) res: Response) { res.clearCookie('proativa_session', { path: '/' }); return { ok: true }; }
  @UseGuards(AuthGuard) @Get('me') me(@CurrentUser() user: any) { return this.auth.me(user.sub); }
  @UseGuards(AuthGuard) @Post('change-password') changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) { return this.auth.changePassword(user.sub, dto.currentPassword, dto.newPassword); }
}
