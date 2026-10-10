import { Migration } from '@mikro-orm/migrations';

// Whether the person confirmed their email through the link we send them.
// Accounts that already exist start as not confirmed too.
export class Migration20261009000002_add_email_verified_to_user extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table \`user\` add \`email_verified\` tinyint(1) not null default false;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table \`user\` drop column \`email_verified\`;`);
  }
}
