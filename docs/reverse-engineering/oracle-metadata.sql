set echo off verify off feedback off heading on pagesize 50000 linesize 32767 trimspool on
set markup csv on delimiter , quote on
set long 1000000 longchunksize 1000000
whenever oserror exit failure
whenever sqlerror exit failure rollback
set transaction read only;
spool docs\reverse-engineering\oracle-context.csv
select systimestamp captured_at, sys_context('USERENV','SESSION_USER') session_user,
       sys_context('USERENV','CURRENT_SCHEMA') current_schema,
       sys_context('USERENV','DB_NAME') db_name from dual;
spool off
spool docs\reverse-engineering\oracle-server-version.csv
select product, version, status from product_component_version;
spool off
spool docs\reverse-engineering\oracle-nls.csv
select parameter, value from nls_database_parameters
where parameter in ('NLS_CHARACTERSET', 'NLS_NCHAR_CHARACTERSET', 'NLS_TERRITORY', 'NLS_LANGUAGE')
order by parameter;
spool off
spool docs\reverse-engineering\oracle-timezones.csv
select dbtimezone database_timezone, sessiontimezone session_timezone from dual;
spool off
spool docs\reverse-engineering\oracle-objects.csv
select object_name, object_type, status,
       to_char(created, 'YYYY-MM-DD HH24:MI:SS') created,
       to_char(last_ddl_time, 'YYYY-MM-DD HH24:MI:SS') last_ddl_time
from user_objects order by object_type, object_name;
spool off
set markup csv off
set linesize 200
column table_name format a36
column column_name format a36
column data_default format a100
spool docs\reverse-engineering\oracle-column-defaults.txt
select table_name, column_name, data_default from user_tab_columns
where default_length > 0 order by table_name, column_id;
spool off
set markup csv on delimiter , quote on
set linesize 32767
spool docs\reverse-engineering\oracle-columns.csv
select table_name, column_id, column_name, data_type, data_length, data_precision,
       data_scale, nullable, char_used, char_length from user_tab_columns order by table_name, column_id;
spool off
set markup csv off
set linesize 200
column constraint_name format a36
column search_condition format a100
spool docs\reverse-engineering\oracle-check-conditions.txt
select table_name, constraint_name, search_condition from user_constraints
where constraint_type = 'C' order by table_name, constraint_name;
spool off
set markup csv on delimiter , quote on
set linesize 32767
spool docs\reverse-engineering\oracle-constraints.csv
select c.table_name, c.constraint_name, c.constraint_type, c.status, c.validated,
       c.deferrable, c.deferred, c.delete_rule, c.r_owner, c.r_constraint_name,
       cc.column_name, cc.position, r.table_name referenced_table, rc.column_name referenced_column
from user_constraints c
left join user_cons_columns cc on cc.constraint_name = c.constraint_name
left join all_constraints r on r.owner = c.r_owner and r.constraint_name = c.r_constraint_name
left join all_cons_columns rc on rc.owner = r.owner and rc.constraint_name = r.constraint_name and rc.position = cc.position
order by c.table_name, c.constraint_name, cc.position;
spool off
set markup csv off
set linesize 200
column index_name format a36
column column_expression format a100
spool docs\reverse-engineering\oracle-index-expressions.txt
select index_name, table_name, column_position, column_expression
from user_ind_expressions order by index_name, column_position;
spool off
set markup csv on delimiter , quote on
set linesize 32767
spool docs\reverse-engineering\oracle-indexes.csv
select i.table_name, i.index_name, i.index_type, i.uniqueness, i.status,
       c.column_position, c.column_name, c.descend
from user_indexes i left join user_ind_columns c on c.index_name = i.index_name
order by i.table_name, i.index_name, c.column_position;
spool off
spool docs\reverse-engineering\oracle-procedures.csv
select object_name, procedure_name, object_type, subprogram_id, authid
from user_procedures order by object_name, subprogram_id;
spool off
spool docs\reverse-engineering\oracle-sequences.csv
select sequence_name, min_value, max_value, increment_by, cycle_flag, order_flag, cache_size
from user_sequences order by sequence_name;
spool off
spool docs\reverse-engineering\oracle-arguments.csv
select package_name, object_name, overload, subprogram_id, argument_name, position,
       sequence, data_level, data_type, in_out, defaulted, type_owner, type_name, type_subname
from user_arguments order by package_name, object_name, subprogram_id, sequence;
spool off
spool docs\reverse-engineering\oracle-dependencies.csv
select name, type, referenced_owner, referenced_name, referenced_type, dependency_type
from user_dependencies order by name, type, referenced_owner, referenced_name;
spool off
spool docs\reverse-engineering\oracle-synonyms.csv
select synonym_name, table_owner, table_name, db_link from user_synonyms order by synonym_name;
spool off
spool docs\reverse-engineering\oracle-triggers.csv
select trigger_name, trigger_type, triggering_event, table_name, status
from user_triggers order by trigger_name;
spool off
spool docs\reverse-engineering\oracle-source-summary.csv
select name, type, count(*) source_lines,
       sum(case when regexp_like(text, '(^|[^A-Z])(COMMIT|ROLLBACK)([^A-Z]|$)', 'i') then 1 else 0 end) transaction_keyword_lines,
       sum(case when regexp_like(text, '(^|[^A-Z])(INSERT|UPDATE|DELETE|MERGE)([^A-Z]|$)', 'i') then 1 else 0 end) mutation_keyword_lines
from user_source group by name, type order by name, type;
spool off
set markup csv off
set linesize 200
column view_name format a36
column text format a150
spool docs\reverse-engineering\oracle-view-definitions.txt
select view_name, text_length, text from user_views order by view_name;
spool off
set markup csv on delimiter , quote on
set linesize 32767
spool docs\reverse-engineering\oracle-transaction-function.csv
select name, type, line, text from user_source
where name = 'SHF_INS_AND_RETURN_LASTID' and type = 'FUNCTION' order by line;
spool off
rollback;
exit success
