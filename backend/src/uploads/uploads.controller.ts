import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { AuthGuard } from '../common/auth.guard';

const maxFileSize = 2 * 1024 * 1024;
const uploadRoot = () => resolve(process.env.UPLOADS_DIR || join(process.cwd(), 'uploads'));
const registrationDirectory = () => join(uploadRoot(), 'registration');
const extensionsByMime: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
};

function isAllowedSignature(mimeType: string, header: Buffer) {
  if (mimeType === 'image/jpeg') return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (mimeType === 'image/png') return header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === 'application/pdf') return header.subarray(0, 5).toString('ascii') === '%PDF-';
  return false;
}

function getPublicFileUrl(filePath: string) {
  const configuredUrl = process.env.UPLOADS_PUBLIC_URL?.trim();
  if (!configuredUrl) return filePath;

  let baseUrl: URL;
  try {
    baseUrl = new URL(configuredUrl);
  } catch {
    throw new Error('UPLOADS_PUBLIC_URL must be a valid absolute URL.');
  }
  if (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') {
    throw new Error('UPLOADS_PUBLIC_URL must use HTTP or HTTPS.');
  }

  return new URL(filePath, baseUrl.origin).toString();
}

@Controller('uploads')
@UseGuards(AuthGuard)
export class UploadsController {
  @Post(':kind')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_request, _file, callback) => {
        fs.mkdir(registrationDirectory(), { recursive: true })
          .then(() => callback(null, registrationDirectory()))
          .catch((error: NodeJS.ErrnoException) => callback(error, registrationDirectory()));
      },
      filename: (_request, file, callback) => {
        callback(null, `${randomUUID()}${extensionsByMime[file.mimetype] || extname(file.originalname).toLowerCase()}`);
      },
    }),
    limits: { fileSize: maxFileSize },
    fileFilter: (_request, file, callback) => {
      if (!extensionsByMime[file.mimetype]) {
        callback(new BadRequestException('Upload a JPG, PNG, or PDF file.'), false);
        return;
      }
      callback(null, true);
    },
  }))
  async upload(
    @Param('kind') kind: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!['photo', 'address-proof', 'bank-proof'].includes(kind)) {
      if (file) await fs.unlink(file.path);
      throw new NotFoundException('Upload category not found.');
    }
    if (!file) throw new BadRequestException('Choose a file to upload.');
    if (kind === 'photo' && file.mimetype === 'application/pdf') {
      await fs.unlink(file.path);
      throw new BadRequestException('Candidate photo must be a JPG or PNG image.');
    }

    const handle = await fs.open(file.path, 'r');
    let header: Buffer;
    try {
      header = Buffer.alloc(8);
      await handle.read(header, 0, header.length, 0);
    } finally {
      await handle.close();
    }
    if (!isAllowedSignature(file.mimetype, header)) {
      await fs.unlink(file.path);
      throw new BadRequestException('The uploaded file content does not match its file type.');
    }

    const fileUrl = `/uploads/registration/${encodeURIComponent(file.filename)}`;
    return {
      url: getPublicFileUrl(fileUrl),
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  @Get('registration/:filename')
  async getRegistrationFile(
    @Param('filename') filename: string,
    @Res() response: Response,
  ) {
    if (!/^[0-9a-f-]{36}\.(jpg|png|pdf)$/i.test(filename)) {
      throw new NotFoundException('File not found.');
    }
    const filePath = join(registrationDirectory(), filename);
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException('File not found.');
    }
    response.setHeader('Cache-Control', 'private, max-age=3600');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.sendFile(filePath);
  }
}
