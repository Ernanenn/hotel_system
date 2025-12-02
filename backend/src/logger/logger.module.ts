import { Module, Global } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        
        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'debug',
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: false,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                  },
                },
            serializers: {
              req: (req) => ({
                id: req.id,
                method: req.method,
                url: req.url,
                headers: {
                  host: req.headers.host,
                  'user-agent': req.headers['user-agent'],
                },
              }),
              res: (res) => ({
                statusCode: res.statusCode,
              }),
              err: (err) => ({
                type: err.type,
                message: err.message,
                stack: err.stack,
              }),
            },
            customProps: (req) => ({
              context: 'HTTP',
            }),
            customLogLevel: (req, res, err) => {
              if (res.statusCode >= 400 && res.statusCode < 500) {
                return 'warn';
              } else if (res.statusCode >= 500 || err) {
                return 'error';
              }
              return 'info';
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class LoggerModule {}

