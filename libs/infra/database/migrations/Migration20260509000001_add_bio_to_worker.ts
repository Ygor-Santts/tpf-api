import { Migration } from '@mikro-orm/migrations';

export class Migration20260509000001_add_bio_to_worker extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table \`worker\` add \`bio\` varchar(500) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table \`worker\` drop column \`bio\`;`);
  }
}
