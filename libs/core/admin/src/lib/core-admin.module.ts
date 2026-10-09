import { Module } from '@nestjs/common';
import { CoreAuthModule } from '@tpf/auth';
import { AdminController } from './presenter/admin.controller';
import { AdminTaxonomyService } from './services/admin-taxonomy.service';
import { AdminUsersService } from './services/admin-users.service';

@Module({
  imports: [CoreAuthModule],
  controllers: [AdminController],
  providers: [AdminTaxonomyService, AdminUsersService],
})
export class CoreAdminModule {}
