/* eslint-disable prettier/prettier */
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const moduleName = this.getModuleFromRequest(request);
    const operation = this.getOperationFromRequest(request);
    const prefix = `${moduleName}_${operation}`;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = `${prefix}: Terjadi kesalahan.`;

    switch (exception.code) {
      case 'P2025': {
        // Error: data not found (misalnya, relasi yang tidak ada)
        statusCode = HttpStatus.NOT_FOUND;
        const missingFields = Array.isArray(exception.meta?.target)
          ? (exception.meta?.target as string[]).join(', ')
          : 'data';
        message = `${prefix}: Tidak ditemukan ${missingFields} yang diperlukan.`;
        break;
      }
      case 'P2002': {
        // Error: unique constraint violation
        statusCode = HttpStatus.CONFLICT;
        const conflictFields = exception.meta?.target
          ? (exception.meta.target as string[]).join(', ')
          : 'Field';
        message = `${prefix}: Duplikasi nilai, ${conflictFields} harus unik.`;
        break;
      }
      default: {
        message = `${prefix}: Terjadi kesalahan dengan kode ${exception.code}.`;
        break;
      }
    }

    // Buat response error
    const errorResponse: any = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      code: exception.code,
    };

    // Tambahkan stack trace hanya untuk development
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.stack = exception.stack?.split('\n').map(line => line.trim());
    }

    response.status(statusCode).json(errorResponse);
  }

  private getModuleFromRequest(request: any): string {
    // Misalnya, ambil segment kedua dari URL untuk menentukan module
    const segments = request.url.split('/');
    return segments.length > 1 ? segments[1].toUpperCase() : 'UNKNOWN_MODULE';
  }

  private getOperationFromRequest(request: any): string {
    // Tetapkan operasi berdasarkan HTTP method
    switch (request.method) {
      case 'POST':
        return 'CREATE';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      case 'GET':
        return 'FETCH';
      default:
        return 'UNKNOWN_OPERATION';
    }
  }
}
