export type ColumnValuePairs = {
  [column: string]: unknown;
};

/**
 * Holds information about an SQL query section.
 * Includes the escaped SQL statement that won't be touched again,
 * and the parameters that will replace any "?" characters in the SQL string.
 * @example trx.raw('SET "foo" = foo') // SET "foo" = foo
 */
export class RawSql {
  sql: string = '';
  parameters: any[] = [];
  constructor(sql: string, parameters: any[] = []) {
    this.sql = sql;
    this.parameters = parameters;
  }
}

/** Escape a value based on it's JavaScript type */
const escapeValue = (value: unknown) => {
  // Number, can be used directly
  if (typeof value == 'number' && !isNaN(value)) {
    return value;
  }

  // Null, will be used as is
  if (value === null) {
    return null;
  }

  // Array, will be converted to "(value, value)"
  if (Array.isArray(value)) {
    return `(${value.map((subvalue) => escapeValue(subvalue)).join(', ')})`;
  }

  // Raw, will be used as is
  if (value instanceof RawSql) {
    return value.sql;
  }

  // Date, will be converted to an ISO string
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Object, needs to be stringified
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }

  // Everything else will be converted to a string
  return `${value}`;
};

/**
 * Escape an SQL table name
 * @example trx.table('testName') // "testName"
 */
export const table = (name: string) => raw(`"${name}"`);

/**
 * Create a raw SQL string with parameters that won't be escaped in any way.
 * @example trx.raw('SET "foo" = ?', ['foo']) // SET "foo" = 'foo'
 */
export const raw = (sql: string, parameters: any[] = []) =>
  new RawSql(sql, parameters);

/**
 * Generates SQL SELECT statement columns from an object or array.
 * Won't escape column names.
 * @example trx.select({ foo: 'foo', bar: 123 }) // "foo", "bar"
 * trx.select(['foo', 'bar']) // "foo", "bar"
 */
export const select = <T = ColumnValuePairs>(data: T) => {
  const columns = (Array.isArray(data) ? [...data] : Object.keys(data))
    .map((column) => `"${column}"`)
    .join(', ');

  return raw(columns);
};

/**
 * Generates SQL INSERT statement columns and values automatically from an object.
 * Escapes values, won't escape column names.
 * @example trx.insert({ foo: 'bar' }) // ("foo") VALUES ('bar')
 */
export const insert = <T = ColumnValuePairs>(data: T) => {
  const columns = Object.keys(data)
    .map((column) => `"${column}"`)
    .join(', ');
  const values = Object.values(data).map((value) => escapeValue(value));

  return raw(
    `(${columns}) VALUES (${values.map(() => '?').join(', ')})`,
    values
  );
};

/**
 * Generates SQL UPDATE statement columns and values automatically from an object.
 * Escapes values, won't escape column names.
 * @example trx.update({ foo: 'bar' }) // "foo" = 'bar'
 */
export const update = <T = ColumnValuePairs>(data: T) => {
  const columnsToValues = Object.keys(data)
    .map((column) => `"${column}" = ?`)
    .join(', ');
  const values = Object.values(data).map(escapeValue);

  return raw(columnsToValues, values);
};

/**
 * Generate a SQL statement from a template literal and escape all given arguments
 * @example trx.sql`SELECT * FROM "test" WHERE "foo" = ${123} AND "bar" = ${"test"}`;
 * // SELECT * FROM "test" WHERE "foo" = 123 AND "bar" = 'test'
 */
export const query = (
  strings: TemplateStringsArray,
  ...properties: unknown[]
) => {
  let preparedStatement = '';
  let queryParameters = [];
  let partIndex = 0;

  // Loop trough all parts
  for (const part of strings) {
    preparedStatement += part;

    // If this is not the last part, escape and insert the value that comes after
    if (partIndex < properties.length) {
      if (properties[partIndex] instanceof RawSql) {
        const rawSql = properties[partIndex] as RawSql;
        preparedStatement += rawSql.sql;
        queryParameters.push(...rawSql.parameters);
      } else {
        preparedStatement += '?';
        queryParameters.push(escapeValue(properties[partIndex]));
      }
    }

    partIndex++;
  }

  return raw(preparedStatement, queryParameters);
};
