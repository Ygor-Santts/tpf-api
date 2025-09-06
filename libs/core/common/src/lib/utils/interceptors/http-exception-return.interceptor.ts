import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class HttpExceptionReturnInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => {
        if (data instanceof HttpException) {
          const status = data.getStatus();
          const responseBody = data.getResponse();

          response
            .status(status)
            .json(
              typeof responseBody === 'string'
                ? { statusCode: status, message: responseBody }
                : responseBody,
            );

          return;
        }

        return data;
      }),
    );
  }
}
