/*
 * Created on 25/12/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.model;

import java.util.Calendar;
import java.util.Date;
import java.util.Vector;

import org.apache.commons.validator.GenericValidator;
import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.EmployeeBean;
import bzq.shf.bean.EmployeeCompletionBean;
import bzq.shf.bean.EmployeeEventBean;
import bzq.shf.bean.EmployeeSkillBean;
import bzq.shf.bean.ExceptionBean;
import bzq.shf.forms.EmployeeActivitiesForm;
import bzq.shf.forms.EmployeeDataForm;
import bzq.shf.forms.EmployeeInforceListForm;
import bzq.shf.forms.EmployeeListForm;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.utils.BaseConvert;
import bzq.utils.ConvertException;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class EmployeeDataModel {
	
	private static Logger logger = Logger.getLogger(EmployeeDataModel.class);
	private EmployeeDataForm employeeData;
	private EmployeeEventBean eventForm;
	private EmployeeInforceListForm employeeInforce;
	private Vector vec;
	
	public EmployeeDataModel(EmployeeDataForm form){
		this.employeeData=form;
	}
	
	public EmployeeDataModel(EmployeeEventBean form){
		this.eventForm=form;
	}
	
	public EmployeeDataModel(EmployeeInforceListForm form){
		this.employeeInforce=form;
	}

	/*
	 * this method set the parameter defaults
	 */
	public void setActivitiesDefaults() throws ShfException{
		logger.debug("Starting setActivitiesDefaults()");
		
		Calendar cal=Calendar.getInstance();
		cal.add(Calendar.DATE,-14);
		cal.set(Calendar.HOUR_OF_DAY,0);
		cal.set(Calendar.MINUTE,0);
		cal.set(Calendar.SECOND,0);
		((EmployeeActivitiesForm)employeeData).setFrom(cal.getTime());
		cal.add(Calendar.DATE,21);
		cal.set(Calendar.HOUR_OF_DAY,23);
		cal.set(Calendar.MINUTE,59);
		cal.set(Calendar.SECOND,59);
		
		((EmployeeActivitiesForm)employeeData).setTo(cal.getTime());
		populateActivities();
	}

	private void validatePopulateActivities() throws ShfException {
		
	}
		
	public Vector populateActivities() throws ShfException{
		logger.debug("EmployeeActivitiesModel: beginning of populate employee activities.");
		validatePopulateActivities();
		int param=1;
		
		StringBuffer sSql=new StringBuffer();
		
		sSql.append("(");
		sSql.append("select d.wm_shift_start_datetime AS shift_start, ");
		sSql.append("D.*,  ");
		sSql.append(" NULL AS NEW_ACTIVITY, ");  
		sSql.append("NULL AS NEW_DAY_END, ");  
		sSql.append("NULL AS NEW_DAY_START, ");
		sSql.append("NULL AS NEW_DAY_TYPE, ");  
		sSql.append("NULL AS NEW_EMPLOYEE_ID,  "); 
		sSql.append("NULL AS NEW_EXCEPTION_TYPE_ID, ");  
		sSql.append("NULL AS NEW_PAID_MINUTES, ");  
        sSql.append("NULL AS NEW_SHIFT_END, ");  
		sSql.append("NULL AS NEW_SHIFT_START, ");  
		sSql.append("NULL AS NEW_SITE_ID, "); 
		sSql.append("NULL AS NEW_TIMEOFF_TYPE_ID, ");  
		sSql.append("NULL AS NEW_WORK_MINUTES , ");
		sSql.append("NULL AS START_CHANGE_REASON, ");  
		sSql.append("NULL AS END_CHANGE_REASON, ");  
		sSql.append("NULL AS SWITCH_DAY_ID, "); 
		sSql.append("NULL AS MODIFICATION_TIME,   ");
		sSql.append("NULL AS MODIFICATION_USER, ");
		sSql.append("NULL AS NEW_WORK_FROM_HOME, ");
		sSql.append("NULL AS NEW_SPLIT_SHIFT, ");
		sSql.append("NULL AS NEW_SPLIT_START, ");
		sSql.append("NULL AS NEW_SPLIT_END, ");
	   	
		sSql.append("e.EMPLOYEE_ID, ");
		sSql.append("e.LAST_NAME, ");
		sSql.append("e.FIRST_NAME, ");
		sSql.append("e.JOB_ID, ");
		sSql.append("e.ORG_UNIT_ID, ");
		sSql.append("e.INNER_JOB_ID, ");

		sSql.append("e_old.EMPLOYEE_ID AS EMPLOYEE_ID_OLD, ");//add for employee card
		sSql.append("e_old.LAST_NAME AS LAST_NAME_OLD, ");//add for employee card
		sSql.append("e_old.FIRST_NAME AS FIRST_NAME_OLD ");	//add for employee card
				
		sSql.append("from SHIFTER.shf_employee_day d ");
		sSql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = d.EMP_ID_NUMBER ");
		sSql.append("left join SHIFTER.shf_employees e_old on substr(e_old.emp_id_number,1,8) = d.emp_id_number "); //add for employee card 
		
		sSql.append("where e.employee_id is not null ");
		sSql.append("and e.employee_id = ? ");
		sSql.append("and d.wm_shift_start_datetime >= ? ");
		sSql.append("and d.wm_shift_end_datetime < ?+1 ");
		sSql.append("and d.wm_day_type = ? ");
		sSql.append("AND D.SHF_EMPLOYEE_DAY_ID  IN ");  
	    sSql.append(" (SELECT D.SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_EMPLOYEE_DAY D  MINUS SELECT C.SHF_EMPLOYEE_DAY_ID "); 
	    sSql.append(" FROM SHIFTER.SHF_DAY_CHANGES C) ");
		
		sSql.append(" ) UNION ALL ");
		sSql.append("(");
	   	sSql.append("SELECT ");
	   	sSql.append("C.NEW_SHIFT_START AS shift_start,");
	    sSql.append("D.*, ");
	   	sSql.append("C.NEW_ACTIVITY, "); 
	   	sSql.append("C.NEW_DAY_END, "); 
	   	sSql.append("C.NEW_DAY_START, "); 
	   	sSql.append("C.NEW_DAY_TYPE, "); 
	   	sSql.append("C.NEW_EMPLOYEE_ID, "); 
	   	sSql.append("C.NEW_EXCEPTION_TYPE_ID, "); 
	   	sSql.append("C.NEW_PAID_MINUTES, "); 
	   	sSql.append("C.NEW_SHIFT_END, "); 
	   	sSql.append("C.NEW_SHIFT_START, "); 
	   	sSql.append("C.NEW_SITE_ID, ");
	   	sSql.append("C.NEW_TIMEOFF_TYPE_ID, "); 
	   	sSql.append("C.NEW_WORK_MINUTES , ");
	   	sSql.append("C.START_CHANGE_REASON, ");
	   	sSql.append("C.END_CHANGE_REASON, ");
	   	sSql.append("C.SWITCH_DAY_ID, ");
	   	sSql.append("C.MODIFICATION_TIME, ");
	   	sSql.append("C.MODIFICATION_USER, ");
	   	sSql.append("C.NEW_WORK_FROM_HOME, ");
	   	sSql.append("C.NEW_SPLIT_SHIFT, ");
	   	sSql.append("C.NEW_SPLIT_START, ");
	   	sSql.append("C.NEW_SPLIT_END, ");
		sSql.append("e.EMPLOYEE_ID, ");
		sSql.append("e.LAST_NAME, ");
		sSql.append("e.FIRST_NAME, ");
		sSql.append("e.JOB_ID, ");
		sSql.append("e.ORG_UNIT_ID, ");
		sSql.append("e.INNER_JOB_ID, ");

		sSql.append("e_old.EMPLOYEE_ID AS EMPLOYEE_ID_OLD, ");//add for employee card
		sSql.append("e_old.LAST_NAME AS LAST_NAME_OLD, ");//add for employee card
		sSql.append("e_old.FIRST_NAME AS FIRST_NAME_OLD ");	//add for employee card
				
		sSql.append("from SHIFTER.shf_employee_day d ");
		sSql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sSql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = c.NEW_EMPLOYEE_ID ");
		sSql.append("left join SHIFTER.shf_employees e_old on substr(e_old.emp_id_number,1,8) = d.emp_id_number "); //add for employee card 
		
		sSql.append("where e.employee_id is not null ");
		sSql.append("and e.employee_id = ? ");
		sSql.append("and c.NEW_SHIFT_START >= ? ");
		sSql.append("and c.NEW_SHIFT_END < ?+1 ");
		sSql.append("and c.NEW_DAY_TYPE = ? ");
		sSql.append(")");
		sSql.append("order by shift_start desc ");

		DBAccess dBAccess=null;
		try{
			dBAccess=new DBAccess();
			//String ffff = sSql.toString();
			dBAccess.prepareStatement(sSql.toString());
			//PARAM - SELECT - 1
			dBAccess.setInt(param++,employeeData.getEmployeeId());
			dBAccess.setTimestamp(param++,((EmployeeActivitiesForm)employeeData).getFrom());
			dBAccess.setDate(param++,((EmployeeActivitiesForm)employeeData).getTo());
			dBAccess.setInt(param++,SHFConstants.DAY_TYPE_ACTIVITY);

			//PARAM - SELECT - 2
			dBAccess.setInt(param++,employeeData.getEmployeeId());
			dBAccess.setTimestamp(param++,((EmployeeActivitiesForm)employeeData).getFrom());
			dBAccess.setDate(param++,((EmployeeActivitiesForm)employeeData).getTo());
			dBAccess.setInt(param++,SHFConstants.DAY_TYPE_ACTIVITY);

			dBAccess.executeQuery();
			Vector activities=new Vector();
			dBAccess.populate("bzq.shf.bean.AgentDayBean",activities);
			
			return activities;
			
		} catch(DBQueryNoRowsException e){

		} catch (DBException e) {
			logger.error("error on employee activities populate: " + e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error on employee activities db close: " + e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return null;
	}
		
	public Vector populateSkills(int leng) throws ShfException{
		logger.debug("Starting populateSkills()");
		
		StringBuffer sql=new StringBuffer();
		sql.append("select t.SKILL_ID,t.SKILL_LEVEL,t.SKILL_ON,t.SKILL_DATE ");
		sql.append("FROM SHIFTER.SHF_SKILLS U, SHIFTER.SHF_EMPLOYEE_SKILLS t ");
		sql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES e ON substr(e.emp_id_number,1,8) = t.EMP_ID_NUMBER ");
		sql.append("WHERE U.SKILL_ID = T.SKILL_ID ");
		sql.append("AND t.SKILL_ON=1 ");
		//sql.append("AND t.SKILL_LEVEL > 0 ");
		sql.append("AND e.employee_id = ? ");
		if ( (leng == 0)||(leng == 1) ) { sql.append("AND U.IS_LANGUAGE = ? "); } 
		
		Vector<EmployeeSkillBean> skills=new Vector<EmployeeSkillBean>();

		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(1,employeeData.getEmployeeId());
			if ( (leng == 0)||(leng == 1) ) { 
				db.setInt(2, leng); 
			}
			db.executeQuery();
			db.populate("bzq.shf.bean.EmployeeSkillBean",skills);
			
		} catch (DBQueryNoRowsException e) {
			
		} catch (DBException e) {
			logger.error("error in populateSkills() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in populateSkills() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return skills;
	}

	public Vector populateCourses(){
		logger.debug("populateCourses(): beginning of populating employee courses");
		Vector cources=new Vector();
		return cources;
	}

	public Vector populateEvents() throws ShfException{
		logger.debug("populateEvents(): beginning of populating employee events");
		vec=new Vector();
		
		populateAttendanceEvents(SHFConstants.MISSING_REASON);
		populateAttendanceEvents(SHFConstants.LATE_REASON);
		populateAttendanceEvents(SHFConstants.STAGE_LATE_REASON);
		populateOthers();
		
		return vec;
	}
	
	public void populateTaxiOrders(){
		
	}
	
	private void populateExceptionLate(int type)throws ShfException{
		logger.debug("Starting populateExceptionLate()");
		
		StringBuffer sql=new StringBuffer();
		sql.append("select * from SHIFTER.shf_employee_exceptions x ");
		sql.append("left join SHIFTER.shf_employee_day d on x.agent_day_id=d.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_day_changes c on c.shf_employee_day_id=d.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on nvl(c.new_employee_id,d.emp_id_number)=substr(e.emp_id_number,1,8) ");
		sql.append("where x.exit_time < x.entry_time AND x.duration < ((x.entry_time-x.exit_time)*24*60) -? ");
		sql.append("AND x.state_type=? AND e.employee_id=? ");
		
		int param=Integer.parseInt(SHFParameters.getMinimalBreakLate(employeeData.getAllowedMoked()).getValue());

		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(1,param);
			db.setInt(2,type);
			db.setInt(3,employeeData.getEmployeeId());
			db.executeQuery();
			while(db.next()){
				EmployeeEventBean event=new EmployeeEventBean();
				ExceptionBean exceptionBean=new ExceptionBean();
				db.populate(exceptionBean);
				event.setEventType(SHFConstants.BREAK_LATE);
				int len=exceptionBean.getDuration()-(SHFUtils.getMinutesBetween(exceptionBean.getExitTime(),exceptionBean.getEntryTime())-param);
				event.setLength(len);
				event.setDate(exceptionBean.getStartTime());
				event.setTime(exceptionBean.getEntryTime());
				vec.add(event);
			}
		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			logger.error("error in populateExceptionLate() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.populateFailed"));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in populateExceptionLate() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}	
	}
	
	private void populateAttendanceEvents(int type) throws ShfException {
		logger.debug("Starting populateAttendanceEvents()");

		StringBuffer sql=new StringBuffer();
		int param=1;
		
		sql.append("(");
		sql.append("select ");
		sql.append("d.wm_shift_start_datetime AS shift_start,");
	   	sql.append("D.*, ");
	   	sql.append("NULL AS NEW_ACTIVITY, "); 
	   	sql.append("NULL AS NEW_DAY_END, "); 
	   	sql.append("NULL AS NEW_DAY_START, "); 
	   	sql.append("NULL AS NEW_DAY_TYPE, "); 
	   	sql.append("NULL AS NEW_EMPLOYEE_ID, "); 
	   	sql.append("NULL AS NEW_EXCEPTION_TYPE_ID, "); 
	   	sql.append("NULL AS NEW_PAID_MINUTES, "); 
	   	sql.append("NULL AS NEW_SHIFT_END, "); 
	   	sql.append("NULL AS NEW_SHIFT_START, "); 
	   	sql.append("NULL AS NEW_SITE_ID, ");
	   	sql.append("NULL AS NEW_TIMEOFF_TYPE_ID, "); 
	   	sql.append("NULL AS NEW_WORK_MINUTES , ");
	   	sql.append("NULL AS START_CHANGE_REASON, "); 
	   	sql.append("NULL AS END_CHANGE_REASON, "); 
	   	sql.append("NULL AS SWITCH_DAY_ID, ");
	   	sql.append("NULL AS MODIFICATION_TIME, "); 
	   	sql.append("NULL AS MODIFICATION_USER, "); 
		
		sql.append("a.STAGE_ARRIVAL_TIME,  ");
		sql.append("a.STATION_ARRIVAL_TIME,  ");
		sql.append("a.STAGE_ARRIVAL_USER, ");
		sql.append("a.STATION_ARRIVAL_USER,  ");
		sql.append("a.LATE_MINUTES, ");
		sql.append("a.LATE_REASON_ID, ");
		sql.append("a.MISS_REASON_ID, ");
		sql.append("a.MISSING_TIME, ");
		sql.append("a.MISSING_REMARK, ");
		sql.append("a.LATE_REMARK, ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");
		sql.append("a.STAGE_LATE_MINUTES, ");
		sql.append("a.STAGE_LATE_REASON_ID, ");
		sql.append("a.STAGE_LATE_REMARK, ");
		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID ");
		
		sql.append("FROM SHIFTER.shf_attendance a ");
		sql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY d ON d.SHF_EMPLOYEE_DAY_ID=a.SHF_EMPLOYEE_DAY_ID ");
		sql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES e ON substr(e.emp_id_number,1,8) = d.emp_id_number ");
		sql.append("WHERE e.employee_id=? ");
		sql.append("AND D.SHF_EMPLOYEE_DAY_ID  IN ");  
	    sql.append(" (SELECT D.SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_EMPLOYEE_DAY D  MINUS SELECT C.SHF_EMPLOYEE_DAY_ID "); 
	    sql.append(" FROM SHIFTER.SHF_DAY_CHANGES C) ");
		if(type==SHFConstants.MISSING_REASON)
			sql.append("and a.MISS_REASON_ID > 0");
		else if(type==SHFConstants.LATE_REASON)
			sql.append("and a.LATE_MINUTES > 0");
		else if(type==SHFConstants.STAGE_LATE_REASON)
			sql.append("and a.STAGE_LATE_MINUTES > 0");
		
		sql.append(") UNION ALL (");
		
		sql.append("SELECT ");
	   	sql.append("C.NEW_SHIFT_START AS shift_start,");
	    sql.append("D.*, ");
	   	sql.append("C.NEW_ACTIVITY, "); 
	   	sql.append("C.NEW_DAY_END, "); 
	   	sql.append("C.NEW_DAY_START, "); 
	   	sql.append("C.NEW_DAY_TYPE, "); 
	   	sql.append("C.NEW_EMPLOYEE_ID, "); 
	   	sql.append("C.NEW_EXCEPTION_TYPE_ID, "); 
	   	sql.append("C.NEW_PAID_MINUTES, "); 
	   	sql.append("C.NEW_SHIFT_END, "); 
	   	sql.append("C.NEW_SHIFT_START, "); 
	   	sql.append("C.NEW_SITE_ID, ");
	   	sql.append("C.NEW_TIMEOFF_TYPE_ID, "); 
	   	sql.append("C.NEW_WORK_MINUTES , ");
	   	sql.append("C.START_CHANGE_REASON, ");
	   	sql.append("C.END_CHANGE_REASON, ");
	   	sql.append("C.SWITCH_DAY_ID, ");
	   	sql.append("C.MODIFICATION_TIME, ");
	   	sql.append("C.MODIFICATION_USER, ");
		
		sql.append("a.STAGE_ARRIVAL_TIME,  ");
		sql.append("a.STATION_ARRIVAL_TIME,  ");
		sql.append("a.STAGE_ARRIVAL_USER, ");
		sql.append("a.STATION_ARRIVAL_USER,  ");
		sql.append("a.LATE_MINUTES, ");
		sql.append("a.LATE_REASON_ID, ");
		sql.append("a.MISS_REASON_ID, ");
		sql.append("a.MISSING_TIME, ");
		sql.append("a.MISSING_REMARK, ");
		sql.append("a.LATE_REMARK, ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");
		sql.append("a.STAGE_LATE_MINUTES, ");
		sql.append("a.STAGE_LATE_REASON_ID, ");
		sql.append("a.STAGE_LATE_REMARK, ");
		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID ");
		
		sql.append("FROM shifter.shf_employee_day d, SHIFTER.shf_attendance a  ");
		sql.append("left join SHIFTER.shf_day_changes c on a.SHF_EMPLOYEE_DAY_ID=c.shf_employee_day_id  ");
		sql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES e ON substr(e.emp_id_number,1,8) = c.new_employee_id ");
		sql.append("WHERE e.employee_id=? ");
		sql.append(" and c.shf_employee_day_id = d.shf_employee_day_id ");
		if(type==SHFConstants.MISSING_REASON)
			sql.append("and a.MISS_REASON_ID > 0");
		else if(type==SHFConstants.LATE_REASON)
			sql.append("and a.LATE_MINUTES > 0");
		else if(type==SHFConstants.STAGE_LATE_REASON)
			sql.append("and a.STAGE_LATE_MINUTES > 0");
		
		sql.append(")");
		sql.append(" ORDER BY shift_start"); 
		DBAccess dBAccess=null;
		try{
			dBAccess = new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			//PARAM - SELECT - 1
			dBAccess.setInt(param++,employeeData.getEmployeeId());
			//PARAM - SELECT - 2
			dBAccess.setInt(param++,employeeData.getEmployeeId());
			dBAccess.executeQuery();
			while(dBAccess.next()){
				EmployeeEventBean event=new EmployeeEventBean();
				AgentDayBean attendance=new AgentDayBean();
				dBAccess.populate(attendance);
				
				event.setEmployee_day_id(attendance.getAgentDayId());
				event.setDate(attendance.getDate());
				
				event.setEventType(type);
				event.setSerType(type);
				if(type==SHFConstants.MISSING_REASON){
					event.setReason(attendance.getMissingReasonId());
					event.setRemark(attendance.getMissingRemark());
					event.setCreation_time(attendance.getMissingTime());
					event.setCreation_user(attendance.getStageArrivalUser());
				}
				else if(type==SHFConstants.LATE_REASON){
					event.setReason(attendance.getLateReasonId());
					event.setLength(attendance.getLateMinutes());
					event.setTime(attendance.getStationArrivalTime());
					event.setRemark(attendance.getLateRemark());
					event.setCreation_time(attendance.getStationArrivalTime());
					event.setCreation_user(attendance.getStationArrivalUser());
				}
				else if(type==SHFConstants.STAGE_LATE_REASON){
					event.setReason(attendance.getStageLateReasonId());
					event.setLength(attendance.getStageLateMinutes());
					event.setTime(attendance.getStageArrivalTime());
					event.setRemark(attendance.getStageLateRemark());
					event.setCreation_time(attendance.getStageArrivalTime());
					event.setCreation_user(attendance.getStageArrivalUser());
				}
				
				vec.add(event);
			}
		}catch(DBQueryNoRowsException e){
		
		}catch(DBException e){
			logger.error("error in populateAttendanceEvents() :"+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.populateFailed"));
			throw new ShfException(actionErrors);
		}finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in populateAttendanceEvents() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}	
	}

	
	private void populateOthers() throws ShfException{
		logger.debug("Starting populateOthers()");

		StringBuffer sql=new StringBuffer();
		sql.append("select ");
		sql.append("t.*,r.REPORTED,r.SER_TYPE ");
		sql.append("from SHIFTER.shf_employee_events t ");
		sql.append("left join SHIFTER.shf_event_reason r on r.reason_id = t.event_type ");
		sql.append("where t.employee_id=?");
		DBAccess db=null;		
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(1,employeeData.getEmployeeId());
			db.executeQuery();
			while(db.next()){
				EmployeeEventBean event=new EmployeeEventBean();
				db.populate(event);
				event.setDate(event.getTime());
				vec.add(event);
			}
		} catch (DBQueryNoRowsException e){ 
			
		} catch (DBException e) {
			logger.error("error in populateOthers() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.populateFailed"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in populateOthers() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}	
	}

	private void validatePopulateEmployeeList() throws ShfException {
	
	}
		
	public Vector populateEmployeeList() throws ShfException {
		logger.debug("EmployeeListModel: beginning of populate.");
		if(GenericValidator.isBlankOrNull(((EmployeeListForm)employeeData).getOptional1())){
			((EmployeeListForm)employeeData).setOptional1("-1");
		}
		validatePopulateEmployeeList();

		int param_index=1;
	
		StringBuffer sSql=new StringBuffer();
		sSql.append("select t.EMPLOYEE_ID EMPLOYEE_ID, t.EMP_ID_NUMBER EMP_ID_NUMBER, t.FIRST_NAME FIRST_NAME, t.LAST_NAME LAST_NAME, t.JOB_TIME JOB_TIME, ");
		sSql.append("t.JOB_ID JOB_ID, t.STATUS_ID STATUS_ID, t.ORG_UNIT_ID ORG_UNIT_ID, t.TAXI_ALLOWED TAXI_ALLOWED, t.SHF_LOCKED SHF_LOCKED, t.TRAINED TRAINED, t.REPLACE_ALLOWED REPLACE_ALLOWED,t.INNER_JOB_ID INNER_JOB_ID, ");
		sSql.append("t.MANAGER_ID MANAGER_ID, t.TAXI_ADDRESS TAXI_ADDRESS, t.OPTIONAL1 OPTIONAL1, t.OPTIONAL2 OPTIONAL2, t.UPDATE_TIME UPDATE_TIME, t.CREATION_TIME CREATION_TIME, u.PARENT_UNIT PARENT_UNIT ");
		sSql.append("FROM SHIFTER.SHF_EMPLOYEES t LEFT JOIN SHIFTER.SHF_ORG_UNIT u ON t.ORG_UNIT_ID = u.ORG_UNIT_ID WHERE rownum<=500 ");
	
		if(!GenericValidator.isBlankOrNull(((EmployeeListForm)employeeData).getFirst_name())){
			sSql.append("AND t.FIRST_NAME like ?||'%' ");
		}
		if(!GenericValidator.isBlankOrNull(((EmployeeListForm)employeeData).getLast_name())){
			sSql.append("AND t.LAST_NAME like ?||'%' ");
		}
		if(!GenericValidator.isBlankOrNull(((EmployeeListForm)employeeData).getId_number())){
			sSql.append("AND t.EMP_ID_NUMBER = ? ");
		}
		if(!("-1".equals(((EmployeeListForm)employeeData).getOptional1()))){
			sSql.append("AND nvl(t.OPTIONAL1,0) = ? ");
		}
		if(!"00".equals(((EmployeeListForm)employeeData).getJob()) && ((EmployeeListForm)employeeData).getJob()!=null){
			sSql.append("AND t.JOB_ID = ? ");
		}
		if(((EmployeeListForm)employeeData).getMoked()!=null && !((EmployeeListForm)employeeData).getMoked().equals("-1")){
			if(((EmployeeListForm)employeeData).getTeam()!=null && !((EmployeeListForm)employeeData).getTeam()[0].equals("00") && !((EmployeeListForm)employeeData).getTeam()[0].equals("-1")){
				sSql.append("AND t.ORG_UNIT_ID in( ");
				String[] array = ((EmployeeListForm)employeeData).getTeam();
				for(int i=0;i<array.length;i++){
					sSql.append(array[i]);
					System.out.println("array: "+array[i]);

					if(i<array.length-1) sSql.append(",");
				}
				sSql.append(") ");
			}
			else{
				sSql.append("AND (u.PARENT_UNIT = ? OR u.ORG_UNIT_ID = ?) ");
			}
		}else{
			sSql.append("AND t.ORG_UNIT_ID IN (");
			Vector allowed=employeeData.getAllowedUnits();
			for(int i=0;i<allowed.size();i++){
				sSql.append((String)allowed.get(i));
				if(i<allowed.size()-1) sSql.append(",");
			}
			sSql.append(") ");
		}
		
		if( ((EmployeeListForm)employeeData).getInnerJob()!=null && (!"00".equals(((EmployeeListForm)employeeData).getInnerJob()[0]))){
			sSql.append("AND t.INNER_JOB_ID in (");
			String[] array = ((EmployeeListForm)employeeData).getInnerJob();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			} 
			sSql.append(")");
		}
		
		if(((EmployeeListForm)employeeData).getStatus()>0){
			sSql.append("AND t.status_id=? ");
			}
		sSql.append(" order by t.FIRST_NAME,t.LAST_NAME ");
	
		DBAccess db=null;
		try {
			db=new DBAccess();
		
			db.prepareStatement(sSql.toString());
//			System.out.println(sSql);
			if(!GenericValidator.isBlankOrNull(((EmployeeListForm)employeeData).getFirst_name())){
				db.setString(param_index,((EmployeeListForm)employeeData).getFirst_name());
				param_index++;	
			}
			if(!GenericValidator.isBlankOrNull(((EmployeeListForm)employeeData).getLast_name())){
				db.setString(param_index,((EmployeeListForm)employeeData).getLast_name());
				param_index++;	
			}
			if(!GenericValidator.isBlankOrNull(((EmployeeListForm)employeeData).getId_number())){
				db.setString(param_index,((EmployeeListForm)employeeData).getId_number());
				param_index++;	
			}
			if(!("-1".equals(((EmployeeListForm)employeeData).getOptional1()))){
				db.setString(param_index,((EmployeeListForm)employeeData).getOptional1());
				param_index++;
			}
			if(!"00".equals(((EmployeeListForm)employeeData).getJob()) && ((EmployeeListForm)employeeData).getJob()!=null){
				db.setString(param_index,((EmployeeListForm)employeeData).getJob());	
				param_index++;
			}
			if(((EmployeeListForm)employeeData).getMoked()!=null && !((EmployeeListForm)employeeData).getMoked().equals("-1")){
				if(((EmployeeListForm)employeeData).getTeam()!=null && !((EmployeeListForm)employeeData).getTeam()[0].equals("00") && !((EmployeeListForm)employeeData).getTeam()[0].equals("-1")){
					//db.setString(param_index++,((EmployeeListForm)employeeData).getTeam());	
				}
				else{
					db.setString(param_index++,((EmployeeListForm)employeeData).getMoked());
					db.setString(param_index++,((EmployeeListForm)employeeData).getMoked());
				}
			}
			if(((EmployeeListForm)employeeData).getStatus()>0){
				db.setInt(param_index++,((EmployeeListForm)employeeData).getStatus());	
			}

			db.executeQuery();
			Vector employees=new Vector();
			db.populate("bzq.shf.bean.EmployeeBean",employees);
//			if ( employees.size()>0 ){
//				System.out.println("emp size: "+employees.size());
//			}
			return employees;	
			
		} catch(DBQueryNoRowsException e){
		
		} catch (DBException e) {
			logger.error("error in populateEmployeeList(): "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.populateFailed"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in populateEmployeeList() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return null;
	}

	public void setFormDefaults() throws ShfException{
		logger.debug("Starting setFormDefaults()");
		((EmployeeListForm)employeeData).setJob("00");
		((EmployeeListForm)employeeData).setStatusId(3);
		((EmployeeListForm)employeeData).setStatus(3);
		((EmployeeListForm)employeeData).setOptional1("-1");
		if(employeeData.getAllowedMoked()!=null){
			((EmployeeListForm)employeeData).setMoked(employeeData.getAllowedMoked());
		}
	}
	
	
	public void populate() throws ShfException{
		logger.debug("Starting populate()");
		
		String sSql="SELECT t.* , "+
					"concat(m.FIRST_NAME ,concat(' ' , m.LAST_NAME)) MANAGER_NAME "+
					"FROM SHIFTER.SHF_EMPLOYEES t "+
					"LEFT JOIN SHIFTER.SHF_EMPLOYEES m ON t.MANAGER_ID = m.EMPLOYEE_ID "+
					"WHERE t.EMPLOYEE_ID = ?";

		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sSql);
			dBAccess.setInt(1,employeeData.getEmployeeId());
			dBAccess.executeQuery();
			dBAccess.populate(employeeData);
		} catch (DBQueryNoRowsException e){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.employeeNotExist", null));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			logger.error("error in populate(): "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in populate() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}	
	
	}
	
	public void populateByEmpIdNum() throws ShfException{
		logger.debug("Starting populateByEmpIdNum()");
		
		String sSql="SELECT t.* " +
					"FROM SHIFTER.SHF_EMPLOYEES t "+
					"WHERE t.EMP_ID_NUMBER = ?";

		DBAccess dBAccess = null;
		try {
			dBAccess = new DBAccess();
			dBAccess.prepareStatement(sSql);
			dBAccess.setString(1,employeeData.getIdNumber());
			dBAccess.executeQuery();
			dBAccess.populate(employeeData);
		} catch (DBQueryNoRowsException e){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.employeeNotExist", null));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			logger.error("error in populateByEmpIdNum(): "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in populateByEmpIdNum() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}	
	
	}

	public void updateEmployeeParameters() throws ShfException{
		logger.debug("Starting updateEmployeeParameters()");
		int param=1;
		String sSql="UPDATE SHIFTER.SHF_EMPLOYEES t SET "+
		"t.TAXI_ALLOWED=?, "+
		"t.TAXI_ADDRESS=?, "+
		"t.SHF_LOCKED=?, "+
		"t.REPLACE_ALLOWED=?, "+
		"t.TRAINED=?, "+
		"t.BENZOOG_TEL=?, "+
		"t.OPTIONAL1=?, "+
		"t.OPTIONAL2=?, "+
		"t.STATUS_ID=?, "+
		"t.INNER_JOB_ID=? ,"+
		"t.WORK_FROM_HOME=? "+
		"WHERE t.EMPLOYEE_ID = ?";

		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sSql);
			dBAccess.setInt(param++,employeeData.getTaxiAllowed());
			dBAccess.setString(param++,employeeData.getMonitAddress());
			dBAccess.setInt(param++,employeeData.getLocked());
			dBAccess.setInt(param++,employeeData.getReplaceAllowed());
			dBAccess.setInt(param++,employeeData.getTrained());
			dBAccess.setString(param++,employeeData.getBenzoogTel());
			dBAccess.setString(param++,employeeData.getOptional1());
			dBAccess.setString(param++,employeeData.getOptional2());
			dBAccess.setInt(param++,employeeData.getStatusId());
			dBAccess.setString(param++,employeeData.getInnerJobId());
			dBAccess.setInt(param++,employeeData.getWorkFromHome());
			dBAccess.setInt(param++,employeeData.getEmployeeId());
			dBAccess.executeUpdate();
		} catch (DBUpdateNoRowsException e){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.employeeNotExist", null));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			logger.error("error in updateEmployeeParameters() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in updateEmployeeParameters() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}	
	}
	
	
	public void populateAllEmployeeInforce() throws ShfException{
		
		StringBuffer sql=new StringBuffer();
		sql.append("select t.EMPLOYEE_ID EMPLOYEE_ID, t.EMP_ID_NUMBER EMP_ID_NUMBER, ");
		sql.append("t.FIRST_NAME FIRST_NAME, t.LAST_NAME LAST_NAME,t.ORG_UNIT_ID ORG_UNIT_ID, t.JOB_TIME JOB_TIME ");
		sql.append("FROM SHIFTER.SHF_EMPLOYEES t ");
		sql.append("LEFT JOIN SHIFTER.SHF_ORG_UNIT u ON t.ORG_UNIT_ID = u.ORG_UNIT_ID ");
		sql.append("WHERE u.PARENT_UNIT = ? OR u.ORG_UNIT_ID = ? ");
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(param++, employeeInforce.getMoked());
			db.setString(param++, employeeInforce.getMoked());
		}catch (DBException e) {
			logger.error("error in populateAllEmployeeInforce() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in populateAllEmployeeInforce() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}	
	}
	
	
	public void populateEployeeInforce() throws ShfException {
		logger.debug("Starting populateEployeeInforce()");

		int param_index=1;
		String shiftRange="0";
		int shiftRangeBefore= Integer.parseInt(SHFParameters.getMinimumTimeFromLastSHift(employeeInforce.getMoked()).getValue())-1;
		int shiftRangeAfter= Integer.parseInt(SHFParameters.getMinimumTimeFromNextSHift(employeeInforce.getMoked()).getValue())-1;
		
		Date shiftStart=null,shiftEnd=null;
		//shiftRange=SHFParameters.getMinHoursBetweenShifts(employeeInforce.getMoked()).getValue();
		String dateStr=BaseConvert.dateToString(employeeInforce.getDate(), "dd/MM/yyyy");
		String startStr=BaseConvert.dateToString(employeeInforce.getShiftStart(), "HH:mm");
		String endStr=BaseConvert.dateToString(employeeInforce.getShiftEnd(), "HH:mm");
		try {
			shiftStart=BaseConvert.stringToDate(dateStr+" "+startStr, "dd/MM/yyyy HH:mm");
			shiftEnd=BaseConvert.stringToDate(dateStr+" "+endStr, "dd/MM/yyyy HH:mm");
		} catch (ConvertException e1) {
			logger.error("ConvertException in populateEployeeInforce() : "+e1.getMessage(), e1);
			throw new ShfException(new ActionError("shf.error.general"));
		}
		StringBuffer sql=new StringBuffer();	
		
		sql.append("(select distinct e.EMPLOYEE_ID EMPLOYEE_ID, e.EMP_ID_NUMBER EMP_ID_NUMBER,e.FIRST_NAME FIRST_NAME, "); 
		sql.append("e.LAST_NAME LAST_NAME,e.ORG_UNIT_ID ORG_UNIT_ID, e.JOB_TIME JOB_TIME, e.CITY ,e.JOB_NAME,");
		sql.append("e.CELLULAR_PHONE,e.HOME_PHONE ,e.WORK_FROM_HOME ,e.BENZOOG_TEL ,e.HOME_PHONE ,e.TRAINED ");
		sql.append("from shifter.shf_employees e  ");
		sql.append("left join shifter.shf_org_unit u on u.org_unit_id=e.org_unit_id ");
		sql.append("left join shifter.shf_category_job c  on c.job_id=e.job_id ");
		sql.append("where (u.parent_unit=? or u.org_unit_id=?) ");
		sql.append("and e.employee_id >0 ");
		if(!employeeInforce.getTeamNumber()[0].equals("00")){
			sql.append("and e.ORG_UNIT_ID in(");
			String[] array = employeeInforce.getTeamNumber();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}
		if(employeeInforce.getInnerJobNumber()[0]!=0){
			sql.append("and e.INNER_JOB_ID in(");
			int[] array = employeeInforce.getInnerJobNumber();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}
		sql.append(" and e.STATUS_ID = ? ");
		
		if(employeeInforce.getCategoryJob()==0){
			sql.append(" and c.CATEGORY_ID = ? ");
		}
		if(employeeInforce.getTrained()==1 ){
			sql.append(" and e.TRAINED = 1 ");
			
		}
		if(employeeInforce.getWorkFromHome()==1 ){
			sql.append(" and e.WORK_FROM_HOME = 1 ");
			
		}
		sql.append(")");
		

		sql.append("MINUS ");
		//sql.append("-- shifts ");
		sql.append("select distinct e.EMPLOYEE_ID EMPLOYEE_ID, e.EMP_ID_NUMBER EMP_ID_NUMBER,e.FIRST_NAME FIRST_NAME, "); 
		sql.append("e.LAST_NAME LAST_NAME,e.ORG_UNIT_ID ORG_UNIT_ID, e.JOB_TIME JOB_TIME, e.CITY ,e.JOB_NAME , ");
		sql.append("e.CELLULAR_PHONE,e.HOME_PHONE,e.WORK_FROM_HOME ,e.BENZOOG_TEL, e.HOME_PHONE  ,e.TRAINED ");
		sql.append("from shifter.shf_employee_day d ");
		sql.append("left join shifter.shf_day_changes c on c.shf_employee_day_id=d.shf_employee_day_id ");
		sql.append("left join shifter.shf_employees e on substr(e.emp_id_number,1,8)=nvl(c.new_employee_id,d.emp_id_number) ");
		sql.append("left join shifter.shf_org_unit u on u.org_unit_id=e.org_unit_id ");
		sql.append("where e.employee_id>0 and c.cancel_reason_code is null ");
		sql.append("and ( ");
		sql.append("nvl(c.new_shift_start,d.wm_shift_start_datetime) between ?-?/1440 and ?+?/1440 "); 
		sql.append("or nvl(c.new_shift_end,d.wm_shift_end_datetime) between ?-?/1440 and ?+?/1440  ");
		sql.append("or (nvl(c.new_shift_start,d.wm_shift_start_datetime)<= ?-?/1440 and nvl(c.new_shift_end,d.wm_shift_end_datetime)>= ?+?/1440) ");
		sql.append(") ");
		sql.append("and nvl(c.new_day_type,d.wm_day_type) = 4 ");
		sql.append("and u.parent_unit=? or u.org_unit_id=? ");
	
        
		sql.append("MINUS ");
		
		//sql.append("-- timeoff ");
		sql.append("select distinct e.EMPLOYEE_ID EMPLOYEE_ID, e.EMP_ID_NUMBER EMP_ID_NUMBER,e.FIRST_NAME FIRST_NAME, "); 
		sql.append("e.LAST_NAME LAST_NAME,e.ORG_UNIT_ID ORG_UNIT_ID, e.JOB_TIME JOB_TIME, e.CITY ,e.JOB_NAME , ");
		sql.append("e.CELLULAR_PHONE,e.HOME_PHONE,e.WORK_FROM_HOME ,e.BENZOOG_TEL, e.HOME_PHONE  ,e.TRAINED ");
		//sql.append("select distinct e.EMPLOYEE_ID EMPLOYEE_ID, e.EMP_ID_NUMBER EMP_ID_NUMBER,e.FIRST_NAME FIRST_NAME, e.LAST_NAME LAST_NAME,e.ORG_UNIT_ID ORG_UNIT_ID, e.JOB_TIME JOB_TIME, e.CITY ,e.JOB_NAME, e.CELLULAR_PHONE,e.HOME_PHONE,e.WORK_FROM_HOME ,e.BENZOOG_TEL ,e.HOME_PHONE "); 
		//sql.append("select distinct e.EMPLOYEE_ID EMPLOYEE_ID, e.EMP_ID_NUMBER EMP_ID_NUMBER,e.FIRST_NAME FIRST_NAME, e.LAST_NAME LAST_NAME,e.ORG_UNIT_ID ORG_UNIT_ID, e.JOB_TIME JOB_TIME ");
		sql.append("from shifter.shf_employee_day d ");
		sql.append("left join shifter.shf_day_changes c on c.shf_employee_day_id=d.shf_employee_day_id ");
		sql.append("left join shifter.shf_employees e on substr(e.emp_id_number,1,8)=nvl(c.new_employee_id,d.emp_id_number) ");
		sql.append("left join shifter.shf_org_unit u on u.org_unit_id=e.org_unit_id ");
		sql.append("where e.employee_id>0 and c.cancel_reason_code is null ");
		sql.append("and ( ");
		sql.append("d.wm_date between ? and ? "); 
		sql.append("or d.wm_date+1 between ? and ? "); 
		sql.append("or (d.wm_date<= ? and d.wm_date+1 >= ?) ");
		sql.append("and nvl(c.new_day_type,d.wm_day_type) = 2 ");
		sql.append("and u.parent_unit=? or u.org_unit_id=?) ");
		/*
		sql.append("intersect  "); 
		
		sql.append("select distinct p.EMPLOYEE_ID EMPLOYEE_ID, p.EMP_ID_NUMBER EMP_ID_NUMBER,p.FIRST_NAME FIRST_NAME, p.LAST_NAME LAST_NAME,p.ORG_UNIT_ID ORG_UNIT_ID, p.JOB_TIME JOB_TIME ");
		sql.append("from SHIFTER.shf_employee_skills e ");
		sql.append("left join SHIFTER.Shf_Employees p on substr(p.emp_id_number,1,8) = e.emp_id_number ");
		sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id=p.org_unit_id ");
		sql.append("where p.employee_id>0 and e.skill_id =? ");
		sql.append("and (u.org_unit_id = ? or u.parent_unit=?) ");
		//sql.append("group by p.emp_id_number ");
		
		sql.append("intersect  "); 
			
		sql.append("select distinct p.EMPLOYEE_ID EMPLOYEE_ID, p.EMP_ID_NUMBER EMP_ID_NUMBER,p.FIRST_NAME FIRST_NAME, p.LAST_NAME LAST_NAME,p.ORG_UNIT_ID ORG_UNIT_ID, p.JOB_TIME JOB_TIME ");
		sql.append("from SHIFTER.shf_employee_skills e ");
		sql.append("left join SHIFTER.Shf_Employees p on substr(p.emp_id_number,1,8) = e.emp_id_number ");
		sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id=p.org_unit_id ");
		sql.append("where p.employee_id>0 and e.skill_id in (select t.skill_id from shifter.shf_activity_skill t where t.activity_type_id=?) ");
		sql.append("and (u.org_unit_id = ? or u.parent_unit=?) ");*/
		//sql.append("group by p.emp_id_number ");
		
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setString(param_index++, employeeInforce.getMoked());
			dBAccess.setString(param_index++, employeeInforce.getMoked());
			dBAccess.setInt(param_index++, SHFConstants.EMPLOYEE_STATUS_ACTIVE);
			if(employeeInforce.getCategoryJob()==0){
				dBAccess.setInt(param_index++,SHFConstants.EMPLOYEE_CATEGORY_JOB);	
			}
			
			dBAccess.setTimestamp(param_index++,shiftStart);
			dBAccess.setInt(param_index++,shiftRangeBefore);
			dBAccess.setTimestamp(param_index++,shiftEnd);
			dBAccess.setInt(param_index++,shiftRangeAfter);
			dBAccess.setTimestamp(param_index++,shiftStart);
			dBAccess.setInt(param_index++,shiftRangeBefore);
			dBAccess.setTimestamp(param_index++,shiftEnd);
			dBAccess.setInt(param_index++,shiftRangeAfter);
			dBAccess.setTimestamp(param_index++,shiftStart);
			dBAccess.setInt(param_index++,shiftRangeBefore);
			dBAccess.setTimestamp(param_index++,shiftEnd);
			dBAccess.setInt(param_index++,shiftRangeAfter);
			dBAccess.setString(param_index++, employeeInforce.getMoked());
			dBAccess.setString(param_index++, employeeInforce.getMoked());
			
			dBAccess.setTimestamp(param_index++,shiftStart);
			dBAccess.setTimestamp(param_index++,shiftEnd);
			dBAccess.setTimestamp(param_index++,shiftStart);
			dBAccess.setTimestamp(param_index++,shiftEnd);
			dBAccess.setTimestamp(param_index++,shiftStart);
			dBAccess.setTimestamp(param_index++,shiftEnd);
			
			dBAccess.setString(param_index++, employeeInforce.getMoked());
			dBAccess.setString(param_index++, employeeInforce.getMoked());
			/*
			dBAccess.setInt(param_index++, employeeInforce.getSkill());
			dBAccess.setString(param_index++, employeeInforce.getMoked());
			dBAccess.setString(param_index++, employeeInforce.getMoked());
			dBAccess.setString(param_index++,employeeInforce.getActivity());
			dBAccess.setString(param_index++, employeeInforce.getMoked());
			dBAccess.setString(param_index++, employeeInforce.getMoked());*/
			
			dBAccess.executeQuery();
			
			Vector<EmployeeBean> employees=new Vector<EmployeeBean>();
			EmployeeBean employeeInfo=null;

			while(dBAccess.next()){
				employeeInfo=new EmployeeBean();
				dBAccess.populate(employeeInfo);
				employees.add(employeeInfo);
			}
			if(!employees.isEmpty())
			employeeInforce.setEmployee((EmployeeBean[])employees.toArray(new EmployeeBean[employees.size()]));	
			
		} catch (DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error in populateEployeeInforce(): "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in populateEployeeInforce() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}			
	}
	
	private void validateAddEvent() throws ShfException {
		logger.debug("Starting validateAddEvent()");
		
		if(eventForm.getDate().after(new Date())){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.eventFutureDate",null));
			throw new ShfException(actionErrors);
		}
	}
	
	public void addEvent() throws ShfException {
		logger.debug("Starting addEvent()");
		validateAddEvent();
		String date=BaseConvert.dateToString(eventForm.getDate(),"dd/MM/yyyy");
		Date d=null;
		try {
			d=BaseConvert.stringToDate(date+" "+eventForm.getHour(),"dd/MM/yyyy HH:mm");
		} catch (ConvertException e) {
			logger.error("Not fatal ConvertException in addEvent(), using current time instead eventForm.getHour() : "+e.getMessage(), e);
			d=new Date();
		}
		
		int param_ind=1;
		StringBuffer sql=new StringBuffer();
		sql.append("INSERT INTO SHIFTER.shf_employee_events");
		sql.append("(EVENT_ID,EVENT_TYPE,EMPLOYEE_ID,");
		sql.append("EVENT_TIME,EMPLOYEE_DAY_ID,");
		sql.append("EVENT_LENGTH,REMARK,STATUS,");
		sql.append("CREATION_USER,CREATION_TIME,OTHER_EVENT_DESC) ");
		sql.append("values(SHIFTER.SHF_EMPLOYEE_EVENT_ID.NEXTVAL,?,?,?,?,?,?,?,?,?,?)");

		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(param_ind++,eventForm.getReason());
			db.setInt(param_ind++,eventForm.getEmployee_id());
			db.setTimestamp(param_ind++,d);
			db.setLong(param_ind++,eventForm.getEmployee_day_id());
			db.setInt(param_ind++,eventForm.getLength());
			db.setString(param_ind++,eventForm.getRemark());
			db.setInt(param_ind++,eventForm.getStatus());
			db.setString(param_ind++,eventForm.getUserFirstName()+" "+eventForm.getUserLastName());
			db.setTimestamp(param_ind++,new Date());
			db.setString(param_ind++,eventForm.getOtherEventDesc());
			
			db.executeUpdate();
			
		} catch (DBException e) {
			logger.error("error in addEvent() :" +e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in addEvent() while closing db connection :" +e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}	
	}
	

	public void cancelEvent() throws ShfException{
		logger.debug("Starting cancelEvent()");
		int type=eventForm.getSerType();
		int empid=eventForm.getEmployee_id();
		long dayId=eventForm.getEmployee_day_id();
		
		switch(type){
			case SHFConstants.EVENT_TYPE:
			case SHFConstants.BREAK_LATE:
				removeEvent((int)dayId);
			break;
			
			case SHFConstants.LATE_REASON:
				AttendanceDataModel.cancelLate(dayId);
			break;
			
			case SHFConstants.STAGE_LATE_REASON:
				AttendanceDataModel.cancelStageLate(dayId);
			break;
			
			case SHFConstants.MISSING_REASON:
				AttendanceDataModel.cancelMissing(dayId);
			break;
		}
	}
	
	public void removeEvent(int eventId) throws ShfException{
		logger.debug("Starting removeEvent()");
		
		String sql="delete from SHIFTER.SHF_EMPLOYEE_EVENTS e WHERE e.EVENT_ID = ?";
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setInt(1,eventId);
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){
			logger.error("error in removeEvent() , event id="+eventId+" not found");
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.deleteFailed"));
			throw new ShfException(actionErrors);
		}catch(DBException e){
			logger.error("error in removeEvent() :"+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.deleteFailed"));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in removeEvent() while closing db connection :"+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}

	/**
	 * 
	 */
	public void getMyId() throws ShfException {
		logger.debug("Starting getMyId()");
		
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT e.EMPLOYEE_ID FROM SHIFTER.SHF_EMPLOYEES e WHERE e.EMP_ID_NUMBER = ?");
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(1,employeeData.getUserId());
			db.executeQuery();
			if(db.next()){
				db.populate(employeeData);
			}
		} catch (DBQueryNoRowsException e){
			logger.error("error in getMyId()  idnum:"+employeeData.getUserId()+" not found ");
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed"));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			logger.error("error in getMyId() for idnum="+employeeData.getUserId()+" :"+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in getMyId() while closing db connection :"+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}	
		
	}

	/**
	 * 
	 */
	public void lockEmployee() throws ShfException{
		logger.debug("Starting lockEmployee()");

		String sql="update SHIFTER.shf_employees e set e.shf_locked=1 where substr(e.emp_id_number,1,8)=?";
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setString(1,employeeData.getIdNumber());
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){
			logger.error("error in lockEmployee() employee: "+employeeData.getIdNumber()+" not found ");
		}catch(DBException e){
			logger.error("error in lockEmployee() idnum:"+employeeData.getIdNumber()+" : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in lockEmployee() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public static boolean checkIfShiftAllowedForReplace(long agentDayId) throws ShfException {
			logger.debug("Starting checkIfShiftAllowedForReplace()");
		
			boolean retVal=false;
			EmployeeDataForm empData = null;

			
			StringBuffer sql=new StringBuffer();
			sql.append("select e.replace_allowed from shifter.shf_employee_day d ");
			sql.append("left join shifter.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
			sql.append("left join shifter.shf_employees e on substr(e.emp_id_number,1,8)=NVL(c.new_employee_id,d.emp_id_number) ");
			sql.append("where d.shf_employee_day_id=? ");
			
			DBAccess db=null;
			try {
				db=new DBAccess();
				db.prepareStatement(sql.toString());
				db.setLong(1,agentDayId);
				db.executeQuery();
				if(db.next()){
					empData = new EmployeeDataForm();
					db.populate(empData);
					return (empData.getReplaceAllowed()==1);
				}
			
			} catch (DBQueryNoRowsException e){
				logger.error("error in checkIfAllowedForReplace("+agentDayId+") DBQueryNoRowsException : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed"));
				throw new ShfException(actionErrors);
			} catch (DBException e) {
				logger.error("error in checkIfAllowedForReplace("+agentDayId+") : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			} finally{
				try {
					db.close();
				} catch (DBException e) {
					logger.error("error in checkIfAllowedForReplace("+agentDayId+") while closing db connection : "+e.getMessage());
					ActionErrors actionErrors=new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
					throw new ShfException(actionErrors);
				}
			}	
		
			return retVal;
		}


	
	public Vector populateExceptions() throws ShfException{
		logger.debug("Starting populateExceptions()");
		
		if(((EmployeeActivitiesForm)employeeData).getFrom()==null){
			Calendar calendar=Calendar.getInstance();
			calendar.add(Calendar.MONTH,-1);
			((EmployeeActivitiesForm)employeeData).setFrom(calendar.getTime());
		}
		int param=1;	

		StringBuffer sql=new StringBuffer();
		sql.append("select x.*,0 as FULLDAY from shifter.shf_employee_exceptions x ");
		sql.append("LEFT JOIN shifter.shf_employee_day d ON d.shf_employee_day_id=x.agent_day_id ");
		sql.append("LEFT JOIN shifter.shf_day_changes c on c.shf_employee_day_id=d.shf_employee_day_id ");
		sql.append("LEFT JOIN shifter.shf_employees e on substr(e.emp_id_number,1,8)=nvl(c.new_employee_id,d.emp_id_number)  ");
		sql.append("where x.SOURCE<> 'DEL' and e.employee_id=? and x.CANCEL_REASON_CODE is null and x.state_type<>? ");
		sql.append("and ? < x.start_Time order by x.start_Time desc ");
		
		StringBuffer sql2=new StringBuffer();
		sql2.append("select d.shf_employee_day_id as AGENT_DAY_ID, ");
		sql2.append("(24*60) as DURATION, ");
		sql2.append("d.wm_date as START_TIME, ");
		sql2.append("d.wm_date+1 as END_TIME, ");
		sql2.append("d.wm_exception_type_id as EXCEPTION_TYPE, ");
		sql2.append("d.wm_timeoff_type_id as TIMEOFF_TYPE, ");
		sql2.append("d.source as SOURCE, ");
		sql2.append("d.remark as REMARK, ");
		sql2.append("d.wm_day_type as STATE_TYPE, ");
		sql2.append("1 as FULLDAY ");
		sql2.append("from SHIFTER.shf_employee_day d ");
		sql2.append("left join SHIFTER.shf_day_changes c on c.shf_employee_day_id=d.shf_employee_day_id ");
		sql2.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8)=nvl(c.new_employee_id,d.emp_id_number) ");
		sql2.append("where e.employee_id=? and c.CANCEL_REASON_CODE is null and nvl(c.new_day_type,d.wm_day_type)>0 and nvl(c.new_day_type,d.wm_day_type)<>? and nvl(c.new_day_type,d.wm_day_type)<>?  ");
		sql2.append("and d.WM_DATE >= ?  ");
		
		Vector vec=new Vector();
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(param++,employeeData.getEmployeeId());
			db.setInt(param++,SHFConstants.STATE_BREAK);
			db.setDate(param++,((EmployeeActivitiesForm)employeeData).getFrom());
			
			try {
				db.executeQuery();
				db.populate("bzq.shf.bean.ExceptionSearchBean",vec);
			}catch(DBQueryNoRowsException e){
				
			}
			
			param=1;
			
			db.prepareStatement(sql2.toString());
			db.setInt(param++,employeeData.getEmployeeId());
			db.setInt(param++,SHFConstants.DAY_TYPE_ACTIVITY);
			db.setInt(param++,SHFConstants.DAY_TYPE_DAYOFF);
			db.setDate(param++,((EmployeeActivitiesForm)employeeData).getFrom());
			
			db.executeQuery();
			Vector v2=new Vector();
			db.populate("bzq.shf.bean.ExceptionSearchBean",v2);
			
			vec.addAll(v2);
			return vec;
		} catch (DBQueryNoRowsException e) {
			
		} catch (DBException e) {
			logger.error("error in populateExceptions() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in while  populateExceptions() : "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}	
		return vec;
	}

	
	public Vector getShiftsForSwitch() throws ShfException{
		logger.debug("Starting getShiftsForSwitch()");
		
		Vector shifts=null;
		Date from=new Date();
		Date to=new Date();
		((EmployeeActivitiesForm)employeeData).setFrom(from);
		to.setTime(to.getTime()+(1000*60*60*24*20));
		((EmployeeActivitiesForm)employeeData).setTo(to);
		shifts = populateActivities();
		
		return shifts;
	}

	
	public static Vector<EmployeeBean> populateEmployeesByCompletions(EmployeeCompletionBean[] completionBeans) throws ShfException{
		logger.debug("Starting populateEmployees(int[] allChecked)");
		if(completionBeans==null || completionBeans.length==0) return null;
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT t.* ");
		sql.append("FROM SHIFTER.SHF_EMPLOYEES t ");
		sql.append("LEFT JOIN SHIFTER.shf_cti_employee_completions c on c.emp_id=substr(t.emp_id_number,1,8) ");
		sql.append("WHERE t.EMPLOYEE_ID>0 ");
		sql.append("and c.copmletion_seq_code in ( ");
		for(int i=0;i<completionBeans.length;i++){
			sql.append(completionBeans[i].getId());
			if(i<completionBeans.length-1) sql.append(",");
		}
		sql.append(")");

		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.executeQuery();
			Vector<EmployeeBean> employees=new Vector<EmployeeBean>();
			db.populate("bzq.shf.bean.EmployeeBean",employees);
			return employees;
		} catch (DBQueryNoRowsException e){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.employeeNotExist", null));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			logger.error("error in populate(): "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in populate() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}	
		
	}
	
	public static Vector<EmployeeBean> populateEmployees(Integer[] allChecked) throws ShfException{
		logger.debug("Starting populateEmployees(int[] allChecked)");
		if(allChecked==null || allChecked.length==0) return null;
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT t.* , ");
		sql.append("concat(m.FIRST_NAME ,concat(' ' , m.LAST_NAME)) MANAGER_NAME ");
		sql.append("FROM SHIFTER.SHF_EMPLOYEES t ");
		sql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES m ON t.MANAGER_ID = m.EMPLOYEE_ID ");
		sql.append("WHERE t.EMPLOYEE_ID>0 ");
		
		sql.append("AND t.EMPLOYEE_ID IN ( ");
		for(int i=0;i<allChecked.length;i++){
			sql.append(allChecked[i].intValue());
			if(i<allChecked.length-1) sql.append(",");
		}
		sql.append(")");

		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.executeQuery();
			Vector<EmployeeBean> employees=new Vector<EmployeeBean>();
			db.populate("bzq.shf.bean.EmployeeBean",employees);
			return employees;
		} catch (DBQueryNoRowsException e){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.employeeNotExist", null));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			logger.error("error in populateEmployees(): "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in populateEmployees() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}	
		
	}
	public void updateSMS() throws ShfException {
		logger.debug("Starting EmployeeDataModel.updateSMS(), emp id : " + employeeData.getIdNumber()+ ", sendSMS : "+employeeData.getReceiveSwitchSMS());
		
		StringBuffer sql = new StringBuffer();
		sql.append("UPDATE SHIFTER.SHF_EMPLOYEES t SET ");
		sql.append("t.RECEIVE_SWITCH_SMS = ? ");
		sql.append("WHERE t.emp_id_number = ? ");
		
		DBAccess db = null;
		int param = 1;
		try {
			db = new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(param++, ("true".equals(employeeData.getReceiveSwitchSMS()) == true ? "1" : "0"));
			db.setString(param++, employeeData.getIdNumber());
			db.executeUpdate();
		} catch (DBUpdateNoRowsException e) {	
			logger.error("Error in EmployeeDataModel.updateSMS() for empId "+employeeData.getIdNumber()+" : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} catch (Exception e) {
			logger.error("DB Error in EmployeeDataModel.updateSMS() for empId "+employeeData.getIdNumber()+" : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in EmployeeDataModel.updateSMS() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
}
