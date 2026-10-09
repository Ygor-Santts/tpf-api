import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { ApiProperty } from '@nestjs/swagger';
import { removeAccount } from '@tpf/auth';

export type AdminUserFilter = 'all' | 'workers' | 'clients' | 'disabled';

export class AdminUserDTO {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
  @ApiProperty() phone!: string;
  @ApiProperty() enabled!: boolean;
  @ApiProperty() isAdmin!: boolean;
  @ApiProperty() isWorker!: boolean;
  @ApiProperty({ required: false }) workerId?: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty({ required: false }) lastAccess?: Date;
  @ApiProperty() occupations!: number;
  @ApiProperty() cities!: number;
}

export class AdminUserDetailDTO extends AdminUserDTO {
  @ApiProperty({ required: false }) bio?: string;
  @ApiProperty() occupationNames!: string[];
  @ApiProperty() cityNames!: string[];
  @ApiProperty() ratingsReceived!: number;
  @ApiProperty() portfolioItems!: number;
}

export class AdminUserPageDTO {
  @ApiProperty({ type: AdminUserDTO, isArray: true }) data!: AdminUserDTO[];
  @ApiProperty() total!: number;
  @ApiProperty() pages!: number;
}

const FILTERS: Record<AdminUserFilter, string> = {
  all: '1 = 1',
  workers: 'w.id is not null',
  clients: 'w.id is null',
  disabled: 'u.enabled = false',
};

const SELECT = `select u.id, u.name, u.email, u.phone, u.enabled, u.is_admin,
    u.createdAt as created_at, u.lastAccess as last_access, w.id as worker_id,
    (select count(*) from worker_job_occupations wo where wo.worker_id = w.id) as occupations,
    (select count(*) from worker_operation_cities wc where wc.worker_id = w.id) as cities
  from user u
  left join worker w on w.user_id = u.id`;

const toDTO = (row: any): AdminUserDTO => ({
  id: Number(row.id),
  name: row.name,
  email: row.email,
  phone: row.phone,
  enabled: Boolean(row.enabled),
  isAdmin: Boolean(row.is_admin),
  isWorker: row.worker_id != null,
  workerId: row.worker_id != null ? Number(row.worker_id) : undefined,
  createdAt: row.created_at,
  lastAccess: row.last_access ?? undefined,
  occupations: Number(row.occupations),
  cities: Number(row.cities),
});

/** Admin view of the accounts: find test accounts, turn them off or delete them. */
@Injectable()
export class AdminUsersService {
  constructor(private readonly em: EntityManager) {}

  async list(
    search = '',
    filter: AdminUserFilter = 'all',
    page = 1,
    limit = 20,
  ): Promise<AdminUserPageDTO> {
    const like = `%${search.trim()}%`;
    const where = `where (u.name like ? or u.email like ? or u.phone like ?) and ${FILTERS[filter]}`;
    const [{ total }] = await this.em.execute(
      `select count(*) as total from user u left join worker w on w.user_id = u.id ${where}`,
      [like, like, like],
    );
    const rows = await this.em.execute(
      `${SELECT} ${where} order by u.id desc limit ? offset ?`,
      [like, like, like, limit, (page - 1) * limit],
    );
    return {
      data: rows.map(toDTO),
      total: Number(total),
      pages: Math.ceil(Number(total) / limit),
    };
  }

  async get(id: number): Promise<AdminUserDetailDTO> {
    const [row] = await this.em.execute(`${SELECT} where u.id = ?`, [id]);
    if (!row) throw new NotFoundException('Usuário não encontrado.');
    const user = toDTO(row);
    if (!user.workerId)
      return {
        ...user,
        occupationNames: [],
        cityNames: [],
        ratingsReceived: 0,
        portfolioItems: 0,
      };

    const workerId = user.workerId;
    const [[worker], occupations, cities, [ratings], [portfolio]] =
      await Promise.all([
        this.em.execute('select bio from worker where id = ?', [workerId]),
        this.em.execute(
          `select o.name from worker_job_occupations wo
            join job_occupation o on o.id = wo.job_occupation_id
            where wo.worker_id = ? order by o.name`,
          [workerId],
        ),
        this.em.execute(
          `select concat(c.name, ' - ', c.state) as name from worker_operation_cities wc
            join city c on c.id = wc.city_id
            where wc.worker_id = ? order by c.state, c.name`,
          [workerId],
        ),
        this.em.execute(
          'select count(*) as total from rating where worker_id = ?',
          [workerId],
        ),
        this.em.execute(
          'select count(*) as total from portfolio_item where worker_id = ?',
          [workerId],
        ),
      ]);
    return {
      ...user,
      bio: worker?.bio ?? undefined,
      occupationNames: occupations.map((o: any) => o.name),
      cityNames: cities.map((c: any) => c.name),
      ratingsReceived: Number(ratings.total),
      portfolioItems: Number(portfolio.total),
    };
  }

  /** A deactivated account can't sign in and doesn't show in search. */
  async setEnabled(
    adminId: number,
    id: number,
    enabled: boolean,
  ): Promise<void> {
    const user = await this.findOther(adminId, id);
    if (user.is_admin && !enabled)
      throw new BadRequestException(
        'Não é possível desativar um administrador.',
      );
    await this.em.execute('update user set enabled = ? where id = ?', [
      enabled,
      id,
    ]);
  }

  /** Deletes the account for good, like the user deleting it themselves. */
  async remove(adminId: number, id: number): Promise<void> {
    const user = await this.findOther(adminId, id);
    if (user.is_admin)
      throw new BadRequestException('Não é possível excluir um administrador.');
    await removeAccount(this.em, id, user.worker_id ?? undefined);
  }

  private async findOther(adminId: number, id: number) {
    if (adminId === id)
      throw new BadRequestException(
        'Use a sua própria conta pelo menu do app.',
      );
    const [user] = await this.em.execute(
      `select u.id, u.is_admin, w.id as worker_id from user u
        left join worker w on w.user_id = u.id where u.id = ?`,
      [id],
    );
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user;
  }
}
