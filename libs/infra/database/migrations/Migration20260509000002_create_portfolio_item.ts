import { Migration } from '@mikro-orm/migrations';

export class Migration20260509000002_create_portfolio_item extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table \`portfolio_item\` (
        \`id\` int unsigned not null auto_increment primary key,
        \`worker_id\` int unsigned not null,
        \`type\` varchar(10) not null,
        \`url\` varchar(500) not null,
        \`caption\` varchar(200) null,
        \`createdAt\` timestamp not null default CURRENT_TIMESTAMP
      ) default character set utf8mb4 engine = InnoDB;
    `);
    this.addSql(`
      alter table \`portfolio_item\`
        add constraint \`portfolio_item_worker_id_foreign\`
        foreign key (\`worker_id\`) references \`worker\` (\`id\`)
        on update cascade on delete cascade;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists \`portfolio_item\`;`);
  }
}
