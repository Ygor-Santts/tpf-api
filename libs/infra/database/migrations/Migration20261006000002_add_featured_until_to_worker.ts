import { Migration } from '@mikro-orm/migrations';

export class Migration20261006000002_add_featured_until_to_worker extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table \`worker\` add \`featured_until\` datetime null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table \`worker\` drop column \`featured_until\`;`);
  }
}
