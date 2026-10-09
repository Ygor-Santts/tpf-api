import { Migration } from '@mikro-orm/migrations';

// Admin accounts, and a review step for the categories and occupations that
// workers add themselves. What already exists stays approved.
export class Migration20261009000001_admin_and_approval extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table \`user\` add \`is_admin\` tinyint(1) not null default false;`,
    );
    this.addSql(
      `alter table \`job_category\` add \`approved\` tinyint(1) not null default true;`,
    );
    this.addSql(
      `alter table \`job_occupation\` add \`approved\` tinyint(1) not null default true;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table \`job_occupation\` drop column \`approved\`;`);
    this.addSql(`alter table \`job_category\` drop column \`approved\`;`);
    this.addSql(`alter table \`user\` drop column \`is_admin\`;`);
  }
}
