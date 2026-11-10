import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { open, unlink } from 'fs/promises';
import { IPortfolioRepository } from '../data-access/repositories';
import { IWorkerProfileRepository } from '../data-access/repositories';

export const PORTFOLIO_MAX_ITEMS = 30;
const CAPTION_MAX = 200;

export abstract class IUploadPortfolioItem {
  abstract execute(workerId: number, file: any, caption?: string): Promise<any>;
}

/**
 * The file is already on disk when this runs (multer saves it first). Any
 * failure deletes it, so nothing stays public without a portfolio item.
 */
@Injectable()
export class UploadPortfolioItem implements IUploadPortfolioItem {
  constructor(
    private readonly portfolioRepo: IPortfolioRepository,
    private readonly workerRepo: IWorkerProfileRepository,
  ) {}

  async execute(workerId: number, file: any, caption?: string): Promise<any> {
    if (!file)
      throw new BadRequestException('Selecione uma imagem ou um vídeo.');
    try {
      return await this.save(workerId, file, caption);
    } catch (error) {
      await unlink(file.path).catch(() => {});
      throw error;
    }
  }

  private async save(workerId: number, file: any, caption?: string) {
    if (
      caption !== undefined &&
      (typeof caption !== 'string' || caption.length > CAPTION_MAX)
    )
      throw new BadRequestException(
        `A descrição pode ter no máximo ${CAPTION_MAX} caracteres.`,
      );
    if (!(await matchesType(file.path, file.mimetype)))
      throw new BadRequestException(
        'O arquivo não é uma imagem ou um vídeo válido.',
      );

    const worker = await this.workerRepo.findById(workerId);
    if (!worker) throw new NotFoundException('Worker não encontrado');
    const items = await this.portfolioRepo.findByWorker(workerId);
    if (items.length >= PORTFOLIO_MAX_ITEMS)
      throw new BadRequestException(
        `O portfólio aceita até ${PORTFOLIO_MAX_ITEMS} itens. Apague algum para enviar outro.`,
      );

    const isVideo = file.mimetype?.startsWith('video/');
    const type: 'image' | 'video' = isVideo ? 'video' : 'image';
    const url = `/uploads/portfolio/${workerId}/${file.filename}`;

    const item = this.portfolioRepo.create({ worker, type, url, caption });
    await this.portfolioRepo.save(item);

    return {
      id: item.id,
      type: item.type,
      url: item.url,
      caption: item.caption,
      createdAt: item.createdAt,
    };
  }
}

// The type the phone declares is not proof: the first bytes must match it.
async function matchesType(path: string, mimetype: string): Promise<boolean> {
  const handle = await open(path, 'r');
  const head = Buffer.alloc(12);
  try {
    await handle.read(head, 0, 12, 0);
  } finally {
    await handle.close();
  }
  const ascii = (start: number, end: number) =>
    head.toString('latin1', start, end);
  switch (mimetype) {
    case 'image/jpeg':
      return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    case 'image/png':
      return head
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/webp':
      return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
    case 'video/mp4':
      return ascii(4, 8) === 'ftyp';
    case 'video/quicktime':
      // Older QuickTime files may start with another atom than ftyp.
      return ['ftyp', 'moov', 'mdat', 'wide', 'free', 'skip'].includes(
        ascii(4, 8),
      );
    case 'video/webm':
      return head.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    default:
      return false;
  }
}
