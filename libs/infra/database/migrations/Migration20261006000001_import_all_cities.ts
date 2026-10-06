import { Migration } from '@mikro-orm/migrations';
import { CITIES } from '../data/cities';

// IBGE codes of the 20 cities the first data migration inserted.
const INITIAL_CITIES = [
  3550308, 3304557, 3106200, 4106902, 4314902, 2927408, 2611606, 2304400,
  1302603, 5300108, 1501402, 5208707, 3509502, 2111300, 2704302, 2408102,
  2211001, 2507507, 2800308, 4205407,
];

const quote = (s: string) => `'${s.replace(/'/g, "''")}'`;

/**
 * Imports every Brazilian city with its coordinates, so the worker search can
 * filter by distance. Cities already in the table keep their ids, so the
 * workers linked to them are untouched.
 */
export class Migration20261006000001_import_all_cities extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      alter table \`city\`
        add \`ibge_id\` int unsigned null,
        add \`latitude\` double null,
        add \`longitude\` double null,
        add unique \`city_ibge_id_unique\` (\`ibge_id\`);
    `);

    this.addSql(`
      create temporary table \`city_import\` (
        \`ibge_id\` int unsigned not null primary key,
        \`name\` varchar(255) not null,
        \`state\` varchar(255) not null,
        \`latitude\` double not null,
        \`longitude\` double not null
      ) default character set utf8mb4;
    `);
    for (let i = 0; i < CITIES.length; i += 1000) {
      const values = CITIES.slice(i, i + 1000)
        .map(
          ([ibge, name, state, lat, lng]) =>
            `(${ibge}, ${quote(name)}, ${quote(state)}, ${lat}, ${lng})`,
        )
        .join(',\n');
      this.addSql(
        `insert into \`city_import\` (\`ibge_id\`, \`name\`, \`state\`, \`latitude\`, \`longitude\`) values ${values};`,
      );
    }

    // Existing rows (matched by exact name and state) get their coordinates.
    this.addSql(`
      update \`city\` c
        join \`city_import\` i
          on binary i.\`name\` = binary c.\`name\` and i.\`state\` = c.\`state\`
        set c.\`ibge_id\` = i.\`ibge_id\`,
            c.\`latitude\` = i.\`latitude\`,
            c.\`longitude\` = i.\`longitude\`
        where c.\`ibge_id\` is null;
    `);
    this.addSql(`
      insert into \`city\` (\`name\`, \`state\`, \`ibge_id\`, \`latitude\`, \`longitude\`)
        select i.\`name\`, i.\`state\`, i.\`ibge_id\`, i.\`latitude\`, i.\`longitude\`
        from \`city_import\` i
        where not exists (select 1 from \`city\` c where c.\`ibge_id\` = i.\`ibge_id\`)
        order by i.\`ibge_id\`;
    `);
    this.addSql(`drop temporary table \`city_import\`;`);
  }

  override async down(): Promise<void> {
    this.addSql(
      `delete from \`city\` where \`ibge_id\` not in (${INITIAL_CITIES.join(', ')});`,
    );
    this.addSql(`
      alter table \`city\`
        drop index \`city_ibge_id_unique\`,
        drop column \`ibge_id\`,
        drop column \`latitude\`,
        drop column \`longitude\`;
    `);
  }
}
