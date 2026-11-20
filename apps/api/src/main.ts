import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { enforceWriteOrigin } from './common/origin-guard.js';

async function bootstrap(){
  const secret=process.env.JWT_SECRET||'';
  if(secret.length<48 || secret.includes('change-me') || secret.startsWith('replace-')) throw new Error('JWT_SECRET forte e exclusivo e obrigatorio.');
  const app=await NestFactory.create(AppModule,{cors:false});
  app.setGlobalPrefix('api');
  app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
  app.use(cookieParser());
  app.use(enforceWriteOrigin);
  app.useGlobalPipes(new ValidationPipe({whitelist:true,transform:true,forbidNonWhitelisted:false}));
  const origins=(process.env.WEB_ORIGIN||'http://localhost:8080').split(',').map(x=>x.trim());
  type CorsAllowedOrigin = boolean | string | RegExp | Array<string | RegExp>;
  type CorsOriginCallback = (error: Error | null, allow?: CorsAllowedOrigin) => void;
  app.enableCors({origin:(origin: string | undefined, cb: CorsOriginCallback)=>!origin||origins.includes(origin)?cb(null,true):cb(new Error('Origin not allowed'),false),credentials:true,methods:['GET','POST','PATCH','DELETE','OPTIONS']});
  const port=Number(process.env.API_PORT||3000);
  await app.listen(port,process.env.NODE_ENV==='development'?'127.0.0.1':'0.0.0.0');
  console.log(`Proativa 2.0 API listening on ${port}`);
}
bootstrap();
