import { Migration } from '@mikro-orm/migrations';

export class Migration20250412213826_create_initial_tables extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table \`city\` (\`id\` int unsigned not null auto_increment primary key, \`name\` varchar(255) not null, \`state\` varchar(255) not null, \`country\` varchar(255) not null, \`enabled\` tinyint(1) not null, \`ibge_id\` int not null) default character set utf8mb4 engine = InnoDB;`,
    );

    this.addSql(
      `create table \`job_category\` (\`id\` int unsigned not null auto_increment primary key, \`name\` varchar(255) not null) default character set utf8mb4 engine = InnoDB;`,
    );

    this.addSql(
      `create table \`job_occupation\` (\`id\` int unsigned not null auto_increment primary key, \`name\` varchar(255) not null, \`category_id\` int unsigned not null) default character set utf8mb4 engine = InnoDB;`,
    );
    this.addSql(
      `alter table \`job_occupation\` add index \`job_occupation_category_id_index\`(\`category_id\`);`,
    );

    this.addSql(
      `create table \`user\` (\`id\` int unsigned not null auto_increment primary key, \`name\` varchar(255) not null, \`password\` varchar(255) not null, \`email\` varchar(255) not null, \`phone\` varchar(255) not null, \`worker_id\` int unsigned null) default character set utf8mb4 engine = InnoDB;`,
    );
    this.addSql(
      `alter table \`user\` add unique \`user_email_unique\`(\`email\`);`,
    );
    this.addSql(
      `alter table \`user\` add unique \`user_phone_unique\`(\`phone\`);`,
    );
    this.addSql(
      `alter table \`user\` add unique \`user_worker_id_unique\`(\`worker_id\`);`,
    );

    this.addSql(
      `create table \`worker\` (\`id\` int unsigned not null auto_increment primary key, \`user_id\` int unsigned not null) default character set utf8mb4 engine = InnoDB;`,
    );
    this.addSql(
      `alter table \`worker\` add unique \`worker_user_id_unique\`(\`user_id\`);`,
    );

    this.addSql(
      `create table \`worker_job_occupations\` (\`worker_id\` int unsigned not null, \`job_occupation_id\` int unsigned not null, primary key (\`worker_id\`, \`job_occupation_id\`)) default character set utf8mb4 engine = InnoDB;`,
    );
    this.addSql(
      `alter table \`worker_job_occupations\` add index \`worker_job_occupations_worker_id_index\`(\`worker_id\`);`,
    );
    this.addSql(
      `alter table \`worker_job_occupations\` add index \`worker_job_occupations_job_occupation_id_index\`(\`job_occupation_id\`);`,
    );

    this.addSql(
      `create table \`worker_operation_cities\` (\`worker_id\` int unsigned not null, \`city_id\` int unsigned not null, primary key (\`worker_id\`, \`city_id\`)) default character set utf8mb4 engine = InnoDB;`,
    );
    this.addSql(
      `alter table \`worker_operation_cities\` add index \`worker_operation_cities_worker_id_index\`(\`worker_id\`);`,
    );
    this.addSql(
      `alter table \`worker_operation_cities\` add index \`worker_operation_cities_city_id_index\`(\`city_id\`);`,
    );

    this.addSql(
      `alter table \`job_occupation\` add constraint \`job_occupation_category_id_foreign\` foreign key (\`category_id\`) references \`job_category\` (\`id\`) on update cascade;`,
    );

    this.addSql(
      `alter table \`user\` add constraint \`user_worker_id_foreign\` foreign key (\`worker_id\`) references \`worker\` (\`id\`) on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table \`worker\` add constraint \`worker_user_id_foreign\` foreign key (\`user_id\`) references \`user\` (\`id\`) on update cascade;`,
    );

    this.addSql(
      `alter table \`worker_job_occupations\` add constraint \`worker_job_occupations_worker_id_foreign\` foreign key (\`worker_id\`) references \`worker\` (\`id\`) on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table \`worker_job_occupations\` add constraint \`worker_job_occupations_job_occupation_id_foreign\` foreign key (\`job_occupation_id\`) references \`job_occupation\` (\`id\`) on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table \`worker_operation_cities\` add constraint \`worker_operation_cities_worker_id_foreign\` foreign key (\`worker_id\`) references \`worker\` (\`id\`) on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table \`worker_operation_cities\` add constraint \`worker_operation_cities_city_id_foreign\` foreign key (\`city_id\`) references \`city\` (\`id\`) on update cascade on delete cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table \`worker_operation_cities\` drop foreign key \`worker_operation_cities_city_id_foreign\`;`,
    );

    this.addSql(
      `alter table \`job_occupation\` drop foreign key \`job_occupation_category_id_foreign\`;`,
    );

    this.addSql(
      `alter table \`worker_job_occupations\` drop foreign key \`worker_job_occupations_job_occupation_id_foreign\`;`,
    );

    this.addSql(
      `alter table \`worker\` drop foreign key \`worker_user_id_foreign\`;`,
    );

    this.addSql(
      `alter table \`user\` drop foreign key \`user_worker_id_foreign\`;`,
    );

    this.addSql(
      `alter table \`worker_job_occupations\` drop foreign key \`worker_job_occupations_worker_id_foreign\`;`,
    );

    this.addSql(
      `alter table \`worker_operation_cities\` drop foreign key \`worker_operation_cities_worker_id_foreign\`;`,
    );

    this.addSql(`drop table if exists \`city\`;`);

    this.addSql(`drop table if exists \`job_category\`;`);

    this.addSql(`drop table if exists \`job_occupation\`;`);

    this.addSql(`drop table if exists \`user\`;`);

    this.addSql(`drop table if exists \`worker\`;`);

    this.addSql(`drop table if exists \`worker_job_occupations\`;`);

    this.addSql(`drop table if exists \`worker_operation_cities\`;`);
  }
}
