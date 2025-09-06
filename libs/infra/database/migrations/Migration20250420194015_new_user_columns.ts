import { Migration } from '@mikro-orm/migrations';

export class Migration20250420194015_new_user_columns extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table \`user\` add \`createdAt\` timestamp not null default CURRENT_TIMESTAMP, add \`updatedAt\` timestamp not null, add \`lastAccess\` timestamp null, add \`enabled\` tinyint(1) not null default true;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table \`user\` drop column \`createdAt\`, drop column \`updatedAt\`, drop column \`lastAccess\`, drop column \`enabled\`;`,
    );
  }
}
