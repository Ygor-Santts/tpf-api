import { Migration } from '@mikro-orm/migrations';

export class Migration20260509000003_create_rating extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table \`rating\` (
        \`id\` int unsigned not null auto_increment primary key,
        \`worker_id\` int unsigned not null,
        \`author_id\` int unsigned not null,
        \`score\` tinyint not null,
        \`comment\` text null,
        \`createdAt\` timestamp not null default CURRENT_TIMESTAMP
      ) default character set utf8mb4 engine = InnoDB;
    `);
    this.addSql(`
      alter table \`rating\`
        add constraint \`rating_worker_id_foreign\`
        foreign key (\`worker_id\`) references \`worker\` (\`id\`)
        on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table \`rating\`
        add constraint \`rating_author_id_foreign\`
        foreign key (\`author_id\`) references \`user\` (\`id\`)
        on update cascade on delete cascade;
    `);
    this.addSql(`
      create unique index \`rating_worker_author_unique\` on \`rating\` (\`worker_id\`, \`author_id\`);
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists \`rating\`;`);
  }
}
