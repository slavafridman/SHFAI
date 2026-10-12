package bzq.shf.utils;



import java.util.Vector;

import org.apache.log4j.Logger;
import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.shf.forms.FormsConstants;

/**
 * Insert the type's description here.
 * Creation date: (27/01/2002 14:50:02)
 * @author: Administrator
 */
public class ComplexCodeTable {
	private static Logger logger = Logger.getLogger(ComplexCodeTable.class);
	
/**
 * Table constructor comment.
 */
public ComplexCodeTable(){
	
}

public Vector getTimeoffTypes() throws DBException{
	String sql="select t.wm_timeoff_type_id as CODE,t.wm_name as DESCRIPTION,t.wm_short_name,t.wm_site_id,t.wm_paid,t.wm_has_limit,t.wm_trade_rule from shifter.shf_timeoff_types t";
	return getRows(sql,FormsConstants.TIMEOFF_TYPE_TABLE);
}

public Vector getInnerJobs() throws DBException{
	String sql="select t.inner_job_id as CODE , t.inner_job_name as DESCRIPTION , t.org_unit_id , t.active , t.group_id from shifter.shf_inner_jobs t order by t.inner_job_name";
	return getRows(sql,FormsConstants.INNER_JOB_TABLE);
}

public Vector getCompletions() throws DBException{
	String sql="select t.completion_code as CODE , t.completion_desc as DESCRIPTION , t.SAP_PAY as SAP_PAY , "+
	"t.Update_Date as UPDATE_DATE , t.update_id as UPDATE_ID " +
	"from shifter.shf_cti_completions t " +
	"order by t.completion_code ";
	return getRows(sql,FormsConstants.COMPLETION_TABLE);
}

public Vector getActivitiesRows() throws DBException {
	String sql="select t.activity_type_id as CODE,t.activity_type_name as DESCRIPTION , "+
	"t.short_name as SHORT_NAME , t.site_id as SITE_ID , "+
	"s.sou_org_unit_id as MOKED, t.virtual_activity_id from SHIFTER.shf_activity_type t "+
	"left join SHIFTER.shf_org_units_shf_sites s on t.site_id=s.ss_site_id";
	return getRows(sql,FormsConstants.ACTIVITY_TABLE);
}

public java.util.Vector getJobRows() throws bzq.db.DBException {
	String sql ="SELECT e.JOB_ID AS CODE ,e.JOB_NAME AS DESCRIPTION FROM SHIFTER.SHF_EMPLOYEES e WHERE e.JOB_ID>0 and e.status_id="+SHFConstants.EMPLOYEE_STATUS_ACTIVE;
	sql += " GROUP BY e.JOB_ID,e.JOB_NAME order by e.JOB_NAME";
	return getRows(sql,FormsConstants.CODE_TABLE);
}

public java.util.Vector getEventReasonRows() throws bzq.db.DBException {
	String sql="select t.reason_id as code,t.reason_desc as description, "+
			"t.branch_id,t.reported,t.report_requested,t.ser_type "+
			"from SHIFTER.shf_event_reason t order by t.reported, t.reason_id desc";
	
	return getRows(sql,FormsConstants.EVENT_REASON_CODE);
}

public java.util.Vector getUnitRows() throws bzq.db.DBException {

    String sql ="SELECT ";
    sql+= "SHF_ORG_UNIT.ORG_UNIT_ID AS CODE , SHF_ORG_UNIT.ORG_UNIT_NAME AS DESCRIPTION, SHF_ORG_UNIT.UNIT_TYPE_ID AS TYPE , SHF_ORG_UNIT.PARENT_UNIT AS PARENT ";
	sql+= " FROM SHIFTER.SHF_ORG_UNIT ORDER BY SHF_ORG_UNIT.ORG_UNIT_NAME";
	return getRows(sql,FormsConstants.UNIT_CODE);
}

public java.util.Vector getSystemParameters() throws bzq.db.DBException {	
	String sql ="SELECT p.param_key as CODE,p.param_desc as DESCRIPTION,t.param_value as PARAM_VALUE,"+
		"p.default_value as DEFAULT_VALUE,t.org_unit_id as UNIT_CODE,t.midification_user as MODUSER,t.midification_time as MODTIME "+
		"FROM SHIFTER.shf_system_param p LEFT JOIN SHIFTER.shf_unit_param t on p.param_key=t.param_key";
	return getRows(sql,FormsConstants.PARAMETERS_TABLE);
}

public java.util.Vector getMobileAuditRef() throws bzq.db.DBException {	
	String sql ="SELECT r.action_id as CODE, r.action_name AS DESCRIPTION "+
		"FROM SHIFTER.shf_mobile_audit_ref r";
	return getRows(sql,FormsConstants.MOBILE_AUDIT_REF_TABLE);
}


public Vector getExceptionTypes() throws bzq.db.DBException{
	String sql="select e.exception_type_id as CODE , e.exception_type_name as DESCRIPTION, "+
			"e.full_day , e.onsite , e.convertable_to_dayoff , e.paid, e.short_name, "+
			"e.site_id , e.used_as_vacation , e.used_in_meeting , e.optional2 , e.optional1, e.split_shift "+
			"from SHIFTER.shf_exception_type e ";
	return getRows(sql,FormsConstants.EXCEPTION_TABLE);
}


public java.util.Vector getRows(String sql,String formName) throws bzq.db.DBException {

	Vector table = new Vector();
	DBAccess dbAccess = null;
	try{
		dbAccess = new DBAccess();
		dbAccess.prepareStatement(sql); 
		dbAccess.executeQuery();
		dbAccess.populate(formName , table );
	} finally {
		dbAccess.close();
	}
	return table;
}





}
