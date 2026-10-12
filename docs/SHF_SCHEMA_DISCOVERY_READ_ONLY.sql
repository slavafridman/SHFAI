SELECT SYS_CONTEXT('USERENV', 'SESSION_USER') AS session_user,
       SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') AS current_schema,
       SYS_CONTEXT('USERENV', 'DB_NAME') AS database_name
FROM dual;

SELECT product, version, status
FROM product_component_version;

SELECT parameter, value
FROM nls_database_parameters
WHERE parameter IN ('NLS_CHARACTERSET', 'NLS_NCHAR_CHARACTERSET',
                    'NLS_DATE_FORMAT', 'NLS_TIMESTAMP_FORMAT')
ORDER BY parameter;

SELECT owner, object_name, object_type, status
FROM all_objects
WHERE owner IN ('SHIFTER', 'WFM')
  AND object_type IN ('TABLE', 'VIEW', 'SEQUENCE', 'FUNCTION', 'PROCEDURE',
                      'PACKAGE', 'PACKAGE BODY', 'TRIGGER', 'TYPE')
ORDER BY owner, object_type, object_name;

SELECT owner, table_name, column_id, column_name, data_type, data_length,
       data_precision, data_scale, nullable, char_used, char_length, data_default
FROM all_tab_columns
WHERE owner IN ('SHIFTER', 'WFM')
ORDER BY owner, table_name, column_id;

SELECT owner, table_name, column_name, comments
FROM all_col_comments
WHERE owner IN ('SHIFTER', 'WFM')
ORDER BY owner, table_name, column_name;

SELECT constraint_def.owner, constraint_def.table_name,
       constraint_def.constraint_name, constraint_def.constraint_type,
       constraint_def.status, constraint_def.validated,
       constraint_def.deferrable, constraint_def.deferred,
       constraint_column.position, constraint_column.column_name,
       parent_constraint.owner AS referenced_owner,
       parent_constraint.table_name AS referenced_table,
       parent_column.column_name AS referenced_column,
       constraint_def.delete_rule, constraint_def.search_condition
FROM all_constraints constraint_def
LEFT JOIN all_cons_columns constraint_column
       ON constraint_column.owner = constraint_def.owner
      AND constraint_column.constraint_name = constraint_def.constraint_name
LEFT JOIN all_constraints parent_constraint
       ON parent_constraint.owner = constraint_def.r_owner
      AND parent_constraint.constraint_name = constraint_def.r_constraint_name
LEFT JOIN all_cons_columns parent_column
       ON parent_column.owner = parent_constraint.owner
      AND parent_column.constraint_name = parent_constraint.constraint_name
      AND parent_column.position = constraint_column.position
WHERE constraint_def.owner IN ('SHIFTER', 'WFM')
ORDER BY constraint_def.owner, constraint_def.table_name,
         constraint_def.constraint_name, constraint_column.position;

SELECT index_def.owner AS index_owner, index_def.index_name,
       index_def.table_owner, index_def.table_name, index_def.uniqueness,
       index_def.index_type, index_def.status,
       index_column.column_position, index_column.column_name,
       index_column.descend
FROM all_indexes index_def
LEFT JOIN all_ind_columns index_column
       ON index_column.index_owner = index_def.owner
      AND index_column.index_name = index_def.index_name
WHERE index_def.table_owner IN ('SHIFTER', 'WFM')
ORDER BY index_def.table_owner, index_def.table_name,
         index_def.index_name, index_column.column_position;

SELECT sequence_owner, sequence_name, min_value, max_value, increment_by,
       cycle_flag, order_flag, cache_size, last_number
FROM all_sequences
WHERE sequence_owner IN ('SHIFTER', 'WFM')
ORDER BY sequence_owner, sequence_name;

SELECT owner, synonym_name, table_owner, table_name, db_link
FROM all_synonyms
WHERE owner IN ('SHIFTER', 'WFM')
   OR (owner = 'PUBLIC' AND
       (synonym_name LIKE 'SHF\_%' ESCAPE '\'
        OR synonym_name LIKE 'WM\_%' ESCAPE '\'))
ORDER BY owner, synonym_name;

SELECT owner, name, type, referenced_owner, referenced_name, referenced_type,
       referenced_link_name, dependency_type
FROM all_dependencies
WHERE owner IN ('SHIFTER', 'WFM')
ORDER BY owner, name, referenced_owner, referenced_name;

SELECT owner, package_name, object_name, overload, argument_name,
       position, sequence, data_level, in_out, data_type,
       data_length, data_precision, data_scale
FROM all_arguments
WHERE owner IN ('SHIFTER', 'WFM')
ORDER BY owner, package_name, object_name, overload, sequence;

SELECT owner, name, type, line, text
FROM all_source
WHERE owner = 'SHIFTER'
  AND name = 'SHF_INS_AND_RETURN_LASTID'
ORDER BY type, line;

SELECT owner, trigger_name, trigger_type, triggering_event,
       table_owner, table_name, status, when_clause
FROM all_triggers
WHERE table_owner IN ('SHIFTER', 'WFM')
ORDER BY table_owner, table_name, trigger_name;

SELECT grantee, table_schema, table_name, privilege, grantable
FROM all_tab_privs
WHERE table_schema IN ('SHIFTER', 'WFM')
ORDER BY table_schema, table_name, grantee, privilege;