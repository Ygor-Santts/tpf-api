import { Migration } from '@mikro-orm/migrations';

// Goes into every login token; raising it signs the account out everywhere.
export class Migration20261110000001_add_token_version_to_user extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table \`user\` add \`token_version\` int not null default 0;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table \`user\` drop column \`token_version\`;`);
  }
}
