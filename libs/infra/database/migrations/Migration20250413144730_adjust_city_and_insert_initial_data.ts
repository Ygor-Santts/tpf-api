import { Migration } from '@mikro-orm/migrations';

export class Migration20250413144730_adjust_city_and_insert_initial_data extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table \`city\` drop column \`country\`, drop column \`enabled\`, drop column \`ibge_id\`;`,
    );

    this.addSql(`
      insert into \`city\` (\`name\`, \`state\`)
      values 
        ('São Paulo', 'SP'),
        ('Rio de Janeiro', 'RJ'),
        ('Belo Horizonte', 'MG'),
        ('Curitiba', 'PR'),
        ('Porto Alegre', 'RS'),
        ('Salvador', 'BA'),
        ('Recife', 'PE'),
        ('Fortaleza', 'CE'),
        ('Manaus', 'AM'),
        ('Brasília', 'DF'),
        ('Belém', 'PA'),
        ('Goiânia', 'GO'),
        ('Campinas', 'SP'),
        ('São Luís', 'MA'),
        ('Maceió', 'AL'),
        ('Natal', 'RN'),
        ('Teresina', 'PI'),
        ('João Pessoa', 'PB'),
        ('Aracaju', 'SE'),
        ('Florianópolis', 'SC');
    `);

    this.addSql(`
      insert into \`job_category\` (\`id\`, \`name\`)
      values (1, 'Construção Civil');
    `);

    this.addSql(`
      insert into \`job_occupation\` (\`name\`, \`category_id\`)
      values
        ('Pedreiro', 1),
        ('Encanador', 1),
        ('Eletricista Residencial', 1),
        ('Pintor de Paredes', 1),
        ('Carpinteiro', 1),
        ('Jardineiro', 1),
        ('Marceneiro', 1),
        ('Serralheiro', 1),
        ('Vidraceiro', 1),
        ('Gesseiro', 1);
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`delete from \`job_occupation\`;`);
    this.addSql(`delete from \`job_category\`;`);
    this.addSql(`delete from \`city\`;`);

    this.addSql(
      `alter table \`city\` add \`country\` varchar(255) not null, add \`enabled\` tinyint(1) not null, add \`ibge_id\` int not null;`,
    );
  }
}
