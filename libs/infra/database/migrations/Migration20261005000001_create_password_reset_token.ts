import { Migration } from '@mikro-orm/migrations';

export class Migration20261005000001_create_password_reset_token extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table \`password_reset_token\` (
        \`id\` int unsigned not null auto_increment primary key,
        \`user_id\` int unsigned not null,
        \`tokenHash\` char(64) not null,
        \`expiresAt\` timestamp not null,
        \`usedAt\` timestamp null,
        \`createdAt\` timestamp not null default CURRENT_TIMESTAMP
      ) default character set utf8mb4 engine = InnoDB;
    `);
    this.addSql(`
      alter table \`password_reset_token\`
        add unique \`password_reset_token_tokenHash_unique\`(\`tokenHash\`);
    `);
    this.addSql(`
      alter table \`password_reset_token\`
        add constraint \`password_reset_token_user_id_foreign\`
        foreign key (\`user_id\`) references \`user\` (\`id\`)
        on update cascade on delete cascade;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists \`password_reset_token\`;`);
  }
}
